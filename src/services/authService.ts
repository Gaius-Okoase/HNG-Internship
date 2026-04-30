import axios from 'axios';
import jwt from 'jsonwebtoken';
import { v7 as uuidv7 } from 'uuid';
import { User } from '../models/User.js';
import { generateState } from '../utils/pkcecode.js'
import { AppError } from '../utils/AppError.js';
import type { GitHubUser, DecodedToken } from '../types/types.js';
import {
  generateAccessToken,
  generateRefreshToken,
} from '../utils/generateToken.js';

// Create a store Map to keep state and code_challenge value
const store = new Map<string, { code_challenge?: string | undefined }>();

export const getGitHubAuthUrlService = (code_challenge?: string) => {
  const redirectUri = process.env.REDIRECT_URI;
  const cliRedirectUri = process.env.REDIRECT_CLI_URI;
  const clientId = process.env.CLIENT_ID;
  // Declare needed variable for this service.
  const scope = `read:user`;
  // Create random state key and store in map
  const state = generateState();
  store.set(state, { code_challenge });
  // get GitHub Auth Uri based on interface
  const gitHubWebPortalUri = `https://github.com/login/oauth/authorize?client_id=${clientId}&state=${state}&redirect_uri=${redirectUri}&scope=${scope}`;
  const gitHubCliUri = `https://github.com/login/oauth/authorize?client_id=${clientId}&state=${state}&redirect_uri=${cliRedirectUri}&scope=${scope}&code_challenge=${code_challenge}&code_challenge_method=S256`;
  const gitHubUri =
    code_challenge !== undefined ? gitHubCliUri : gitHubWebPortalUri;

  return { gitHubUri };
};

export const processGitHubCallbackService = async (
  code: string,
  state: string,
  code_verifier?: string
) => {
  // Check if state is same as when initiated to prevent CSRF
  const entry = store.get(state);
  console.log(entry);
  if (entry == undefined) throw new AppError(401, 'Unauthorized');
  store.delete(state);

  // Declare variables needed for this service
  const clientSecret = process.env.CLIENT_SECRET;
  const redirectUri = process.env.REDIRECT_URI;
  const cliRedirectUri = process.env.CLI_REDIRECT_URI;
  const clientId = process.env.CLIENT_ID;

  // Get access token from GitHub
  const tokenResponse = entry.code_challenge
    ? await axios.post<{
        access_token: string;
        scope: string;
        token_type: string;
      }>(
        'https://github.com/login/oauth/access_token',
        {
          client_id: clientId,
          code_verifier,
          code,
          redirect_uri: cliRedirectUri,
        },
        {
          headers: {
            Accept: 'application/json',
          },
        }
      )
    : await axios.post<{
        access_token: string;
        scope: string;
        token_type: string;
      }>(
        'https://github.com/login/oauth/access_token',
        {
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirectUri,
        },
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );

  const accessToken = tokenResponse.data.access_token;

  // Get user GitHub profile with access token from GitHub
  const userGitHubProfile = await axios.get('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const userData: GitHubUser = userGitHubProfile.data;

  // Retrieve neede data to create user profile
  const github_id = userData.id.toString();

  // Check if user already exists
  const user = await User.findOne({ github_id });  

  if (user) {
    const id = user.id as string;
    const role = user.role as 'admin' | 'analyst';
    const refresh_token = generateRefreshToken(id, role);
    const access_token = generateAccessToken(id, role);

    user.refresh_token = refresh_token;
    user.last_login_at = new Date();
    user.is_active = true;

    await user.save();

    const userWithoutRefresh = await User.findOne({ github_id }).select('-_id -__v -refresh_token');

    return {
      status: 'success',
      data: {
        user: userWithoutRefresh,
        access_token,
        refresh_token,
      },
    };
  } else {
    const username = userData.login;
    const email = userData.email;
    const avatar_url = userData.avatar_url;
    const id = uuidv7();
    const role = 'analyst';
    const is_active = true;
    const refresh_token = generateRefreshToken(id, role);
    const access_token = generateAccessToken(id, role);
    const last_login_at = new Date();
    const created_at = new Date();

    await User.create({
      id,
      github_id,
      username,
      email,
      avatar_url,
      role,
      is_active,
      refresh_token,
      last_login_at,
      created_at,
    });

    const user = await User.findOne({github_id}).select('-_id -__v -refresh_token')
    
    return {
      status: 'success',
      data: {
        user,
        access_token,
        refresh_token,
      },
    };
  }
};

export const refreshTokenService = async (refresh_token: string) => {
  try {
    // Check if token is valid
    const decodedToken = jwt.verify(
      refresh_token,
      process.env.JWT_REFRESH_SECRET!
    ) as DecodedToken;

    // Extract user Id from token payload
    const id = decodedToken.id;
    const role = decodedToken.role;

    // Check if token still exists in DB
    const user = await User.findOne({ refresh_token });

    // Generate new token if token still exists and update DB
    if (user) {
      const newAccessToken = generateAccessToken(id, role);
      const newRefreshToken = generateRefreshToken(id, role);

      await User.findOneAndUpdate({ id }, { refresh_token: newRefreshToken });

      // Return access token and refresh token
      return {
        status: 'success',
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      };
    } else {
      // Find user by id and wipe out the refresh token — force re-login
      await User.findByIdAndUpdate(id, {
        refresh_token: null,
        is_active: false,
      });

      // Throw expired token error.
      throw new AppError(401, 'Token expired. Please log in again.');
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    } else {
      throw new AppError(401, 'Invalid or Missing token');
    }
  }
};

export const logoutService = async (id: string) => {
  const user = await User.findOneAndUpdate(
    { id: id },
    { refresh_token: null, is_active: false },
    { returnDocument: 'after' }
  );

  if (!user) throw new AppError(401, 'User does not exist');

  return { status: 'success' };
};

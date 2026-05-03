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
const store = new Map<string, { code_challenge?: string | undefined}>();

export const getGitHubAuthUrlService = (code_challenge?: string) => {
  const clientId = code_challenge ? process.env.CLI_CLIENT_ID : process.env.CLIENT_ID;  
  const redirectUri = code_challenge ? process.env.REDIRECT_CLI_URI : process.env.REDIRECT_URI;
  // Declare needed variable for this service.
  const scope = `read:user`;
  // Create random state key and store in map
  const state = generateState();
  store.set(state, { code_challenge });
  // get GitHub Auth Uri based on interface
  const gitHubUri = code_challenge 
  ? `https://github.com/login/oauth/authorize?client_id=${clientId}&state=${state}&redirect_uri=${redirectUri}&scope=${scope}&code_challenge=${code_challenge}&code_challenge_method=S256` 
  : `https://github.com/login/oauth/authorize?client_id=${clientId}&state=${state}&redirect_uri=${redirectUri}&scope=${scope}`;

  return { gitHubUri };
};

export const processGitHubCallbackService = async (
  code: string,
  state: string,
  code_verifier?: string
) => {
  // Check if state is same as when initiated to prevent CSRF
  const entry = store.get(state);
  if (entry == undefined) throw new AppError(401, 'Unauthorized');
  
  // Determine if it's CLI interface by checking if code_challenge exists
  const isCliFlow = !!entry.code_challenge

  // Declare variables needed for this service
  const clientSecret = isCliFlow ? process.env.CLI_CLIENT_SECRET : process.env.CLIENT_SECRET;
  const redirectUri = isCliFlow ? process.env.REDIRECT_CLI_URI : process.env.REDIRECT_URI;
  const clientId = isCliFlow ? process.env.CLI_CLIENT_ID : process.env.CLIENT_ID;

  // Payload to be posted to github token endpoint
  const tokenPayload = isCliFlow 
  ? {client_id: clientId, code_verifier, code, redirect_uri: redirectUri, client_secret: clientSecret} 
  : {client_id: clientId, code, client_secret: clientSecret, redirect_uri: redirectUri}

  // Get access token from GitHub
  const tokenResponse = await axios.post<{
        access_token: string;
        scope: string;
        token_type: string;
      }>(
        'https://github.com/login/oauth/access_token',
        tokenPayload,
        { headers: { Accept: 'application/json' } }
      )

  const accessToken = tokenResponse.data.access_token;
  
  // Get user GitHub profile with access token from GitHub
  const userGitHubProfile = await axios.get('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const userData: GitHubUser = userGitHubProfile.data;

  // Retrieve neede data to create user profile
  const github_id = userData.id.toString();

  // Check if user already exists
  const userExists = await User.findOne({ github_id }); 
  
  // Declare variables to be returned for new users and existing users alike
  let refresh_token: string;
  let access_token: string;
  let userWithoutRefresh;

  if (userExists) {
    const id = userExists.id as string;
    const role = userExists.role as 'admin' | 'analyst';
    refresh_token = generateRefreshToken(id, role);
    access_token = generateAccessToken(id, role);

    userExists.refresh_token = refresh_token;
    userExists.last_login_at = new Date();
    userExists.is_active = true;

    await userExists.save();

    userWithoutRefresh = await User.findOne({ github_id }).select('-_id -__v -refresh_token');
  } else {
    const id = uuidv7();
    const role = 'analyst';
    refresh_token = generateRefreshToken(id, role);
    access_token = generateAccessToken(id, role);

    await User.create({
      id,
      github_id,
      username: userData.login,
      email: userData.email,
      avatar_url: userData.avatar_url,
      role,
      is_active: true,
      refresh_token,
      last_login_at: new Date(),
      created_at: new Date(),
    });

    userWithoutRefresh = await User.findOne({github_id}).select('-_id -__v -refresh_token')
  }

  store.delete(state);

  return {
    status: 'success',
    data: {
      user: userWithoutRefresh,
      access_token,
      refresh_token
    }
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

import type { Request, Response, NextFunction } from 'express';
import {
  getGitHubAuthUrlService,
  processGitHubCallbackService,
  refreshTokenService,
  logoutService
} from '../services/authService.js';

export const getGitHubAuthUrlController = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code_challenge } = req.query as { code_challenge ?: string};
    const { gitHubUri } = getGitHubAuthUrlService(code_challenge);

    return res.redirect(gitHubUri);
  } catch (error) {
    next(error);
  }
};

export const processGitHubCallbackController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, state } = req.query as { code: string; state: string };
    const result = await processGitHubCallbackService(code, state);

    res.cookie('refresh_token', result.data.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 5 * 60 * 1000,
    });

    res.status(200).json({
      status: result.status,
      data: {
        user: result.data.user,
        access_token: result.data.access_token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const processCliCallbackController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, state, code_verifier } = req.body as { code: string, state: string, code_verifier: string};

    const result = await processGitHubCallbackService(code, state, code_verifier);

    res.status(200).json({
      access_token: result.data.access_token,
      refresh_token: result.data.refresh_token,
      username: result.data.user?.username
    })
  } catch (error) {
    next(error)
  }
}

export const refreshTokenController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token: string = req.cookies.refresh_token;

    const result = await refreshTokenService(token);

    const refresh_token = result.refresh_token;

    res
      .cookie('refresh_token', refresh_token, {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(Date.now() + 5 * 60 * 1000),
      })
      .status(200)
      .json(result);
  } catch (error) {
    next(error);
  }
};

export const logoutController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.user.id;
    
    const logout = await logoutService(id);

    res.status(200).clearCookie('refresh_token').send(logout);
  } catch (error) {
    next(error);
  }
};

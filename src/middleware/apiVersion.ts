import type {Request, Response, NextFunction} from 'express';
import { AppError } from '../utils/AppError.js';

export const apiVersion = (req: Request, _res: Response, next: NextFunction) => {
  const version = req.headers['x-api-version'];
  if (!version || version !== '1') throw new AppError(400, "API version header required")
  return next();
}
import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, AppError } from '../services/auth.service.js';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError(401, 'No token provided');
    }

    const token = header.slice(7);
    const payload = verifyAccessToken(token);
    req.userId = payload.userId;
    next();
  } catch (error) {
    next(error);
  }
}

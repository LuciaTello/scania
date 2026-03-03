import type { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service.js';

export async function registerHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name } = req.body;
    const result = await authService.register(email, password, name);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function refreshHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refresh(refreshToken);
    res.json(tokens);
  } catch (error) {
    next(error);
  }
}

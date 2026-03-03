import type { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service.js';

export async function getProfileHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.getProfile(req.userId!);
    res.json(user);
  } catch (error) {
    next(error);
  }
}

export async function updateProfileHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, avatar } = req.body;
    const user = await userService.updateProfile(req.userId!, { name, avatar });
    res.json(user);
  } catch (error) {
    next(error);
  }
}

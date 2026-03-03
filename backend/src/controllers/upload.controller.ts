import type { Request, Response, NextFunction } from 'express';
import { uploadImage } from '../services/upload.service.js';
import { AppError } from '../services/auth.service.js';

export async function uploadHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw new AppError(400, 'No file provided');
    }

    const folder = (req.body?.folder as string) || 'scania';
    const url = await uploadImage(req.file.buffer, folder);
    res.json({ url });
  } catch (error) {
    next(error);
  }
}

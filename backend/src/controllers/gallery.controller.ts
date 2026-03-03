import type { Request, Response, NextFunction } from 'express';
import { cloudinary } from '../lib/cloudinary.js';
import { AppError } from '../services/auth.service.js';

export async function galleryHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'scania/scans',
      max_results: 50,
      resource_type: 'image',
    });

    const images = result.resources.map((r: any) => ({
      url: r.secure_url,
      public_id: r.public_id,
      created_at: r.created_at,
    }));

    res.json({ images });
  } catch (error) {
    next(new AppError(500, 'Failed to fetch gallery'));
  }
}

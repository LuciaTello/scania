import { cloudinary } from '../lib/cloudinary.js';
import { AppError } from './auth.service.js';

export async function uploadImage(buffer: Buffer, folder = 'scania'): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error || !result) {
          reject(new AppError(500, 'Upload failed'));
          return;
        }
        resolve(result.secure_url);
      },
    );
    stream.end(buffer);
  });
}

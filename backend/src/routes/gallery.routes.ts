import { Router } from 'express';
import { galleryHandler } from '../controllers/gallery.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticate, galleryHandler);

export { router as galleryRoutes };

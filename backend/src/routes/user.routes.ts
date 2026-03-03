import { Router } from 'express';
import { getProfileHandler, updateProfileHandler } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/me', authenticate, getProfileHandler);
router.patch('/me', authenticate, updateProfileHandler);

export { router as userRoutes };

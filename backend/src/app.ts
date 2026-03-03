import express from 'express';
import cors from 'cors';
import { authRoutes } from './routes/auth.routes.js';
import { userRoutes } from './routes/user.routes.js';
import { uploadRoutes } from './routes/upload.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

app.use(cors({
  origin: process.env['FRONTEND_URL'] || 'http://localhost:4200',
  credentials: true,
}));

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);

app.use(errorHandler);

export { app };

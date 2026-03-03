import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

const JWT_SECRET = process.env['JWT_SECRET'] || 'fallback-secret';
const JWT_REFRESH_SECRET = process.env['JWT_REFRESH_SECRET'] || 'fallback-refresh-secret';

function generateTokens(userId: string) {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

export async function register(email: string, password: string, name: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, 'Email already registered');
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, name },
  });

  const tokens = generateTokens(user.id);
  return {
    user: { id: user.id, email: user.email, name: user.name },
    ...tokens,
  };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(401, 'Invalid credentials');
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new AppError(401, 'Invalid credentials');
  }

  const tokens = generateTokens(user.id);
  return {
    user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
    ...tokens,
  };
}

export async function refresh(refreshToken: string) {
  try {
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      throw new AppError(401, 'User not found');
    }
    const tokens = generateTokens(user.id);
    return tokens;
  } catch {
    throw new AppError(401, 'Invalid refresh token');
  }
}

export function verifyAccessToken(token: string): { userId: string } {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    throw new AppError(401, 'Invalid or expired token');
  }
}

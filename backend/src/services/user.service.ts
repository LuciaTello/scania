import { prisma } from '../lib/prisma.js';
import { AppError } from './auth.service.js';

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, avatar: true, createdAt: true },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  return user;
}

export async function updateProfile(userId: string, data: { name?: string; avatar?: string }) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, email: true, name: true, avatar: true, createdAt: true },
  });

  return user;
}

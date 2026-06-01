import type { NextFunction, Request, Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        email: string;
        name?: string;
      };
    }
  }
}

interface JwtPayload {
  userId: string;
  role: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError(500, 'JWT_SECRET_MISSING', 'JWT secret is not configured.');
  }
  return secret;
}

export function generateToken(userId: string, role: string): string {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || '8h') as SignOptions['expiresIn'],
  };
  return jwt.sign({ userId, role }, getJwtSecret(), options);
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, getJwtSecret());
  if (typeof decoded !== 'object' || !('userId' in decoded) || !('role' in decoded)) {
    throw new AppError(401, 'INVALID_TOKEN', 'Token không hợp lệ.');
  }
  return decoded as JwtPayload;
}

export async function adminAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHORIZED', 'Vui lòng đăng nhập admin.');
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      throw new AppError(401, 'UNAUTHORIZED', 'Vui lòng đăng nhập admin.');
    }

    let payload: JwtPayload;
    try {
      payload = verifyToken(token);
    } catch {
      throw new AppError(401, 'INVALID_TOKEN', 'Token không hợp lệ hoặc đã hết hạn.');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user || user.role !== 'admin') {
      throw new AppError(403, 'FORBIDDEN', 'Bạn không có quyền admin.');
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    next();
  } catch (error) {
    next(error);
  }
}

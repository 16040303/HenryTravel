import { randomBytes, createHash } from 'crypto';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';

const REFRESH_TOKEN_BYTES = 48;

export interface RotatedAdminRefreshToken {
  rawToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export function getRefreshTokenDays(): number {
  const value = Number(process.env.ADMIN_REFRESH_TOKEN_DAYS || 30);
  return Number.isInteger(value) && value > 0 ? value : 30;
}

export function getRefreshTokenMaxAgeMs(): number {
  return getRefreshTokenDays() * 24 * 60 * 60 * 1000;
}

function hashRefreshToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

function createRawRefreshToken(): string {
  return randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
}

export async function createAdminRefreshToken(userId: string): Promise<string> {
  const rawToken = createRawRefreshToken();
  await prisma.adminRefreshToken.create({
    data: {
      userId,
      tokenHash: hashRefreshToken(rawToken),
      expiresAt: new Date(Date.now() + getRefreshTokenMaxAgeMs()),
    },
  });
  return rawToken;
}

export async function rotateAdminRefreshToken(rawToken: string): Promise<RotatedAdminRefreshToken> {
  const tokenHash = hashRefreshToken(rawToken);
  const stored = await prisma.adminRefreshToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, email: true, name: true, role: true } } },
  });

  if (!stored || stored.revokedAt || stored.expiresAt.getTime() <= Date.now() || stored.user.role !== 'admin') {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }

  const newRawToken = createRawRefreshToken();
  await prisma.$transaction([
    prisma.adminRefreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    }),
    prisma.adminRefreshToken.create({
      data: {
        userId: stored.userId,
        tokenHash: hashRefreshToken(newRawToken),
        expiresAt: new Date(Date.now() + getRefreshTokenMaxAgeMs()),
      },
    }),
  ]);

  return { rawToken: newRawToken, user: stored.user };
}

export async function revokeAdminRefreshToken(rawToken: string): Promise<void> {
  const tokenHash = hashRefreshToken(rawToken);
  await prisma.adminRefreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

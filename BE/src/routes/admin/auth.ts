import { Router, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma';
import { generateToken } from '../../middleware/auth';
import { logAdminAction } from '../../services/adminLog';
import {
  createAdminRefreshToken,
  getRefreshTokenMaxAgeMs,
  revokeAdminRefreshToken,
  rotateAdminRefreshToken,
} from '../../services/adminRefreshToken';
import { AppError } from '../../utils/errors';

const router = Router();
const ADMIN_REFRESH_COOKIE = 'admin_refresh_token';

function refreshCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/api/admin/auth',
    maxAge: getRefreshTokenMaxAgeMs(),
  };
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(ADMIN_REFRESH_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/admin/auth',
  });
}

function adminUserResponse(user: { id: string; email: string; name: string; role: string }) {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

router.post('/login', async (req, res, next) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Email và mật khẩu là bắt buộc.');
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== 'admin' || !user.password) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng.');
    }

    const token = generateToken(user.id, user.role);
    const refreshToken = await createAdminRefreshToken(user.id);
    res.cookie(ADMIN_REFRESH_COOKIE, refreshToken, refreshCookieOptions());

    await logAdminAction({
      adminId: user.id,
      action: 'ADMIN_LOGIN',
      targetType: 'user',
      targetId: user.id,
      req,
    });

    res.json({
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      user: adminUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const rawToken = typeof req.cookies?.[ADMIN_REFRESH_COOKIE] === 'string'
      ? req.cookies[ADMIN_REFRESH_COOKIE]
      : '';
    if (!rawToken) {
      throw new AppError(401, 'REFRESH_TOKEN_MISSING', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    const rotated = await rotateAdminRefreshToken(rawToken);
    res.cookie(ADMIN_REFRESH_COOKIE, rotated.rawToken, refreshCookieOptions());

    res.json({
      token: generateToken(rotated.user.id, rotated.user.role),
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      user: adminUserResponse(rotated.user),
    });
  } catch (error) {
    clearRefreshCookie(res);
    next(error);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const rawToken = typeof req.cookies?.[ADMIN_REFRESH_COOKIE] === 'string'
      ? req.cookies[ADMIN_REFRESH_COOKIE]
      : '';
    if (rawToken) {
      await revokeAdminRefreshToken(rawToken);
    }
    clearRefreshCookie(res);
    res.json({ ok: true });
  } catch (error) {
    clearRefreshCookie(res);
    next(error);
  }
});

export default router;

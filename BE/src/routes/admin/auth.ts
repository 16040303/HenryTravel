import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma';
import { generateToken } from '../../middleware/auth';
import { logAdminAction } from '../../services/adminLog';
import { AppError } from '../../utils/errors';

const router = Router();

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
    await logAdminAction({
      adminId: user.id,
      action: 'ADMIN_LOGIN',
      targetType: 'user',
      targetId: user.id,
      req,
    });

    res.json({
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import {
  buildZaloUrl,
  getAdminSettings,
  normalizeZaloPhone,
  SETTING_KEYS,
  upsertSettingValue,
} from '../../services/settings';
import { AppError } from '../../utils/errors';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    res.json(await getAdminSettings());
  } catch (error) {
    next(error);
  }
});

router.put('/', async (req, res, next) => {
  try {
    const input = typeof req.body.zaloUrl === 'string'
      ? req.body.zaloUrl
      : typeof req.body.zaloPhone === 'string'
        ? req.body.zaloPhone
        : '';

    if (!input.trim()) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Vui lòng nhập số điện thoại hoặc Zalo URL.');
    }

    let zaloPhone: string;
    try {
      zaloPhone = normalizeZaloPhone(input);
    } catch {
      throw new AppError(400, 'VALIDATION_ERROR', 'Số điện thoại Zalo không hợp lệ.');
    }

    await upsertSettingValue(SETTING_KEYS.ZALO_PHONE, zaloPhone);

    if (req.user?.id) {
      await prisma.adminLog.create({
        data: {
          adminId: req.user.id,
          action: 'settings.update_zalo_phone',
          targetType: 'system_setting',
          targetId: SETTING_KEYS.ZALO_PHONE,
          ipAddress: req.ip,
          userAgent: req.get('user-agent') || null,
        },
      });
    }

    res.json({
      zaloPhone,
      zaloUrl: buildZaloUrl(zaloPhone),
    });
  } catch (error) {
    next(error);
  }
});

export default router;

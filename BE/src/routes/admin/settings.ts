import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import {
  getAdminSettings,
  normalizeHoldTimeMode,
  normalizeOptionalUrl,
  normalizeSettingMinutes,
  normalizeWhatsAppUrl,
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
    const zaloInput = typeof req.body.zaloUrl === 'string'
      ? req.body.zaloUrl
      : typeof req.body.zaloPhone === 'string'
        ? req.body.zaloPhone
        : '';
    const whatsappInput = typeof req.body.whatsappUrl === 'string' ? req.body.whatsappUrl : '';
    const wechatId = typeof req.body.wechatId === 'string' ? req.body.wechatId.trim() : '';
    const kakaoTalkId = typeof req.body.kakaoTalkId === 'string' ? req.body.kakaoTalkId.trim() : '';
    const tikTokInput = typeof req.body.tikTokUrl === 'string' ? req.body.tikTokUrl : '';
    const facebookPersonalInput = typeof req.body.facebookPersonalUrl === 'string' ? req.body.facebookPersonalUrl : '';
    const facebookFanpageInput = typeof req.body.facebookFanpageUrl === 'string' ? req.body.facebookFanpageUrl : '';
    const naverBlogInput = typeof req.body.naverBlogUrl === 'string' ? req.body.naverBlogUrl : '';
    const instagramWorkInput = typeof req.body.instagramWorkUrl === 'string' ? req.body.instagramWorkUrl : '';
    const commonPolicyInput = typeof req.body.commonPolicy === 'string' ? req.body.commonPolicy.trim() : '';

    const shouldUpdateContactSettings =
      req.body.zaloUrl !== undefined ||
      req.body.zaloPhone !== undefined ||
      req.body.whatsappUrl !== undefined ||
      req.body.wechatId !== undefined ||
      req.body.kakaoTalkId !== undefined ||
      req.body.tikTokUrl !== undefined ||
      req.body.facebookPersonalUrl !== undefined ||
      req.body.facebookFanpageUrl !== undefined ||
      req.body.naverBlogUrl !== undefined ||
      req.body.instagramWorkUrl !== undefined;
    const shouldUpdateSystemSettings =
      req.body.commonPolicy !== undefined ||
      req.body.bookingHoldTimeMode !== undefined ||
      req.body.holdMinutes !== undefined ||
      req.body.customHoldMinutes !== undefined;

    if (shouldUpdateContactSettings && !zaloInput.trim()) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Vui lòng nhập số điện thoại hoặc Zalo URL.');
    }

    try {
      const updates: Promise<unknown>[] = [];

      if (shouldUpdateContactSettings) {
        const zaloPhone = normalizeZaloPhone(zaloInput);
        updates.push(
          upsertSettingValue(SETTING_KEYS.ZALO_PHONE, zaloPhone),
          upsertSettingValue(SETTING_KEYS.WHATSAPP_URL, normalizeWhatsAppUrl(whatsappInput)),
          upsertSettingValue(SETTING_KEYS.WECHAT_ID, wechatId),
          upsertSettingValue(SETTING_KEYS.KAKAOTALK_ID, kakaoTalkId),
          upsertSettingValue(SETTING_KEYS.TIKTOK_URL, normalizeOptionalUrl(tikTokInput, 'TikTok URL')),
          upsertSettingValue(SETTING_KEYS.FACEBOOK_PERSONAL_URL, normalizeOptionalUrl(facebookPersonalInput, 'Facebook cá nhân URL')),
          upsertSettingValue(SETTING_KEYS.FACEBOOK_FANPAGE_URL, normalizeOptionalUrl(facebookFanpageInput, 'Facebook fanpage URL')),
          upsertSettingValue(SETTING_KEYS.NAVER_BLOG_URL, normalizeOptionalUrl(naverBlogInput, 'Naver Blog URL')),
          upsertSettingValue(SETTING_KEYS.INSTAGRAM_WORK_URL, normalizeOptionalUrl(instagramWorkInput, 'Instagram URL'))
        );
      }

      if (shouldUpdateSystemSettings) {
        const bookingHoldTimeMode = normalizeHoldTimeMode(req.body.bookingHoldTimeMode ?? 'preset');
        const holdMinutes = normalizeSettingMinutes(req.body.holdMinutes ?? 15, 'Thời gian giữ chỗ');
        const customHoldMinutes = normalizeSettingMinutes(req.body.customHoldMinutes ?? 45, 'Thời gian giữ chỗ tùy chỉnh');

        updates.push(
          upsertSettingValue(SETTING_KEYS.COMMON_POLICY, commonPolicyInput),
          upsertSettingValue(SETTING_KEYS.BOOKING_HOLD_TIME_MODE, bookingHoldTimeMode),
          upsertSettingValue(SETTING_KEYS.BOOKING_HOLD_MINUTES, String(holdMinutes)),
          upsertSettingValue(SETTING_KEYS.BOOKING_CUSTOM_HOLD_MINUTES, String(customHoldMinutes))
        );
      }

      await Promise.all(updates);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Thông tin cài đặt không hợp lệ.';
      throw new AppError(400, 'VALIDATION_ERROR', message);
    }


    if (req.user?.id) {
      await prisma.adminLog.create({
        data: {
          adminId: req.user.id,
          action: 'settings.update',
          targetType: 'system_setting',
          targetId: 'admin_settings',
          ipAddress: req.ip,
          userAgent: req.get('user-agent') || null,
        },
      });
    }

    res.json(await getAdminSettings());
  } catch (error) {
    next(error);
  }
});

export default router;

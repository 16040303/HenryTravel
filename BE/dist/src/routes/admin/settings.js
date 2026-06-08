"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../../lib/prisma");
const settings_1 = require("../../services/settings");
const errors_1 = require("../../utils/errors");
const router = (0, express_1.Router)();
router.get('/', async (_req, res, next) => {
    try {
        res.json(await (0, settings_1.getAdminSettings)());
    }
    catch (error) {
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
        const shouldUpdateContactSettings = req.body.zaloUrl !== undefined ||
            req.body.zaloPhone !== undefined ||
            req.body.whatsappUrl !== undefined ||
            req.body.wechatId !== undefined ||
            req.body.kakaoTalkId !== undefined ||
            req.body.tikTokUrl !== undefined ||
            req.body.facebookPersonalUrl !== undefined ||
            req.body.facebookFanpageUrl !== undefined ||
            req.body.naverBlogUrl !== undefined ||
            req.body.instagramWorkUrl !== undefined;
        const shouldUpdateSystemSettings = req.body.commonPolicy !== undefined ||
            req.body.bookingHoldTimeMode !== undefined ||
            req.body.holdMinutes !== undefined ||
            req.body.customHoldMinutes !== undefined;
        if (shouldUpdateContactSettings && !zaloInput.trim()) {
            throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'Vui lòng nhập số điện thoại hoặc Zalo URL.');
        }
        try {
            const updates = [];
            if (shouldUpdateContactSettings) {
                const zaloPhone = (0, settings_1.normalizeZaloPhone)(zaloInput);
                updates.push((0, settings_1.upsertSettingValue)(settings_1.SETTING_KEYS.ZALO_PHONE, zaloPhone), (0, settings_1.upsertSettingValue)(settings_1.SETTING_KEYS.WHATSAPP_URL, (0, settings_1.normalizeWhatsAppUrl)(whatsappInput)), (0, settings_1.upsertSettingValue)(settings_1.SETTING_KEYS.WECHAT_ID, wechatId), (0, settings_1.upsertSettingValue)(settings_1.SETTING_KEYS.KAKAOTALK_ID, kakaoTalkId), (0, settings_1.upsertSettingValue)(settings_1.SETTING_KEYS.TIKTOK_URL, (0, settings_1.normalizeOptionalUrl)(tikTokInput, 'TikTok URL')), (0, settings_1.upsertSettingValue)(settings_1.SETTING_KEYS.FACEBOOK_PERSONAL_URL, (0, settings_1.normalizeOptionalUrl)(facebookPersonalInput, 'Facebook cá nhân URL')), (0, settings_1.upsertSettingValue)(settings_1.SETTING_KEYS.FACEBOOK_FANPAGE_URL, (0, settings_1.normalizeOptionalUrl)(facebookFanpageInput, 'Facebook fanpage URL')), (0, settings_1.upsertSettingValue)(settings_1.SETTING_KEYS.NAVER_BLOG_URL, (0, settings_1.normalizeOptionalUrl)(naverBlogInput, 'Naver Blog URL')), (0, settings_1.upsertSettingValue)(settings_1.SETTING_KEYS.INSTAGRAM_WORK_URL, (0, settings_1.normalizeOptionalUrl)(instagramWorkInput, 'Instagram URL')));
            }
            if (shouldUpdateSystemSettings) {
                const bookingHoldTimeMode = (0, settings_1.normalizeHoldTimeMode)(req.body.bookingHoldTimeMode ?? 'preset');
                const holdMinutes = (0, settings_1.normalizeSettingMinutes)(req.body.holdMinutes ?? 15, 'Thời gian giữ chỗ');
                const customHoldMinutes = (0, settings_1.normalizeSettingMinutes)(req.body.customHoldMinutes ?? 45, 'Thời gian giữ chỗ tùy chỉnh');
                updates.push((0, settings_1.upsertSettingValue)(settings_1.SETTING_KEYS.COMMON_POLICY, commonPolicyInput), (0, settings_1.upsertSettingValue)(settings_1.SETTING_KEYS.BOOKING_HOLD_TIME_MODE, bookingHoldTimeMode), (0, settings_1.upsertSettingValue)(settings_1.SETTING_KEYS.BOOKING_HOLD_MINUTES, String(holdMinutes)), (0, settings_1.upsertSettingValue)(settings_1.SETTING_KEYS.BOOKING_CUSTOM_HOLD_MINUTES, String(customHoldMinutes)));
            }
            await Promise.all(updates);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Thông tin cài đặt không hợp lệ.';
            throw new errors_1.AppError(400, 'VALIDATION_ERROR', message);
        }
        if (req.user?.id) {
            await prisma_1.prisma.adminLog.create({
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
        res.json(await (0, settings_1.getAdminSettings)());
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;

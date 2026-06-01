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
        const input = typeof req.body.zaloUrl === 'string'
            ? req.body.zaloUrl
            : typeof req.body.zaloPhone === 'string'
                ? req.body.zaloPhone
                : '';
        if (!input.trim()) {
            throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'Vui lòng nhập số điện thoại hoặc Zalo URL.');
        }
        let zaloPhone;
        try {
            zaloPhone = (0, settings_1.normalizeZaloPhone)(input);
        }
        catch {
            throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'Số điện thoại Zalo không hợp lệ.');
        }
        await (0, settings_1.upsertSettingValue)(settings_1.SETTING_KEYS.ZALO_PHONE, zaloPhone);
        if (req.user?.id) {
            await prisma_1.prisma.adminLog.create({
                data: {
                    adminId: req.user.id,
                    action: 'settings.update_zalo_phone',
                    targetType: 'system_setting',
                    targetId: settings_1.SETTING_KEYS.ZALO_PHONE,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent') || null,
                },
            });
        }
        res.json({
            zaloPhone,
            zaloUrl: (0, settings_1.buildZaloUrl)(zaloPhone),
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;

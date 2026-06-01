"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SETTING_KEYS = void 0;
exports.normalizeZaloPhone = normalizeZaloPhone;
exports.buildZaloUrl = buildZaloUrl;
exports.getSettingValue = getSettingValue;
exports.upsertSettingValue = upsertSettingValue;
exports.resolveZaloPhone = resolveZaloPhone;
exports.getAdminSettings = getAdminSettings;
exports.getPublicSettings = getPublicSettings;
const prisma_1 = require("../lib/prisma");
exports.SETTING_KEYS = {
    ZALO_PHONE: 'ZALO_PHONE',
};
function cleanPhone(value) {
    return value.replace(/[^0-9]/g, '');
}
function normalizeZaloPhone(input) {
    const trimmed = input.trim();
    const phone = cleanPhone(trimmed);
    if (!phone || phone.length < 8 || phone.length > 15) {
        throw new Error('Số điện thoại Zalo không hợp lệ.');
    }
    return phone;
}
function buildZaloUrl(phone) {
    return `https://zalo.me/${normalizeZaloPhone(phone)}`;
}
async function getSettingValue(key) {
    const setting = await prisma_1.prisma.systemSetting.findUnique({ where: { key } });
    return setting?.value || null;
}
async function upsertSettingValue(key, value) {
    await prisma_1.prisma.systemSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
    });
}
async function resolveZaloPhone(requestPhone) {
    const dbPhone = await getSettingValue(exports.SETTING_KEYS.ZALO_PHONE);
    if (dbPhone)
        return normalizeZaloPhone(dbPhone);
    if (process.env.ZALO_PHONE)
        return normalizeZaloPhone(process.env.ZALO_PHONE);
    return normalizeZaloPhone(requestPhone || '');
}
function resolveZaloPhoneSync(dbPhone) {
    if (dbPhone) {
        try {
            return normalizeZaloPhone(dbPhone);
        }
        catch { /* fallthrough */ }
    }
    if (process.env.ZALO_PHONE) {
        try {
            return normalizeZaloPhone(process.env.ZALO_PHONE);
        }
        catch { /* fallthrough */ }
    }
    return '';
}
async function getAdminSettings() {
    const dbZaloPhone = await getSettingValue(exports.SETTING_KEYS.ZALO_PHONE);
    const zaloPhone = resolveZaloPhoneSync(dbZaloPhone);
    return {
        zaloPhone,
        zaloUrl: zaloPhone ? buildZaloUrl(zaloPhone) : '',
    };
}
/**
 * Public-safe settings — exposed without admin auth.
 * Only returns fields safe for public consumption.
 */
async function getPublicSettings() {
    const dbZaloPhone = await getSettingValue(exports.SETTING_KEYS.ZALO_PHONE);
    const zaloPhone = resolveZaloPhoneSync(dbZaloPhone);
    return {
        zaloPhone,
        zaloUrl: zaloPhone ? buildZaloUrl(zaloPhone) : '',
    };
}

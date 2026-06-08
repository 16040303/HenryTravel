"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_COMMON_POLICY = exports.DEFAULT_RUNTIME_SETTINGS = exports.SETTING_KEYS = void 0;
exports.normalizeZaloPhone = normalizeZaloPhone;
exports.buildZaloUrl = buildZaloUrl;
exports.buildWhatsAppUrlFromPhone = buildWhatsAppUrlFromPhone;
exports.normalizeWhatsAppUrl = normalizeWhatsAppUrl;
exports.normalizeOptionalUrl = normalizeOptionalUrl;
exports.getSettingValue = getSettingValue;
exports.upsertSettingValue = upsertSettingValue;
exports.normalizeHoldTimeMode = normalizeHoldTimeMode;
exports.normalizeSettingMinutes = normalizeSettingMinutes;
exports.resolveZaloPhone = resolveZaloPhone;
exports.getAdminSettings = getAdminSettings;
exports.getBookingHoldMinutes = getBookingHoldMinutes;
exports.getPublicSettings = getPublicSettings;
const prisma_1 = require("../lib/prisma");
exports.SETTING_KEYS = {
    ZALO_PHONE: 'ZALO_PHONE',
    WHATSAPP_URL: 'WHATSAPP_URL',
    WECHAT_ID: 'WECHAT_ID',
    KAKAOTALK_ID: 'KAKAOTALK_ID',
    TIKTOK_URL: 'TIKTOK_URL',
    FACEBOOK_PERSONAL_URL: 'FACEBOOK_PERSONAL_URL',
    FACEBOOK_FANPAGE_URL: 'FACEBOOK_FANPAGE_URL',
    NAVER_BLOG_URL: 'NAVER_BLOG_URL',
    INSTAGRAM_WORK_URL: 'INSTAGRAM_WORK_URL',
    COMMON_POLICY: 'COMMON_POLICY',
    BOOKING_HOLD_TIME_MODE: 'BOOKING_HOLD_TIME_MODE',
    BOOKING_HOLD_MINUTES: 'BOOKING_HOLD_MINUTES',
    BOOKING_CUSTOM_HOLD_MINUTES: 'BOOKING_CUSTOM_HOLD_MINUTES',
};
exports.DEFAULT_RUNTIME_SETTINGS = {
    bookingHoldTimeMode: 'preset',
    holdMinutes: 15,
    customHoldMinutes: 45,
};
exports.DEFAULT_COMMON_POLICY = [
    'Check in 14h',
    'Check out 11h hôm sau',
    'Giữ chỗ theo thời gian cấu hình của villa',
    'Quy định riêng của từng căn sẽ được admin tư vấn qua Zalo sau khi đặt phòng',
].join('\n');
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
function buildWhatsAppUrlFromPhone(phone) {
    const clean = cleanPhone(phone);
    if (!clean || clean.length < 8 || clean.length > 15)
        return '';
    return `https://wa.me/${clean}`;
}
function normalizeWhatsAppUrl(input) {
    const trimmed = input.trim();
    if (!trimmed)
        return '';
    const phone = cleanPhone(trimmed);
    if (/^[+\d\s().-]+$/.test(trimmed) && phone.length >= 8 && phone.length <= 15) {
        return buildWhatsAppUrlFromPhone(phone);
    }
    let url;
    try {
        url = new URL(trimmed);
    }
    catch {
        throw new Error('Đường dẫn WhatsApp không hợp lệ.');
    }
    const host = url.hostname.toLowerCase();
    const isAllowedHost = host === 'wa.me' || host === 'api.whatsapp.com' || host === 'web.whatsapp.com' || host.endsWith('.whatsapp.com');
    if (url.protocol !== 'https:' || !isAllowedHost) {
        throw new Error('Đường dẫn WhatsApp phải là URL https của WhatsApp.');
    }
    return url.toString();
}
function normalizeOptionalUrl(input, label) {
    const trimmed = input.trim();
    if (!trimmed)
        return '';
    let url;
    try {
        url = new URL(trimmed);
    }
    catch {
        throw new Error(`${label} không hợp lệ.`);
    }
    if (url.protocol !== 'https:') {
        throw new Error(`${label} phải là URL https.`);
    }
    return url.toString();
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
function normalizeHoldTimeMode(input) {
    if (input === 'preset' || input === 'custom')
        return input;
    throw new Error('Chế độ giữ chỗ chỉ được là preset hoặc custom.');
}
function normalizeSettingMinutes(input, label) {
    const value = typeof input === 'number' ? input : Number(input);
    if (!Number.isInteger(value) || value < 5 || value > 1440) {
        throw new Error(`${label} phải là số nguyên từ 5 đến 1440 phút.`);
    }
    return value;
}
function resolveHoldTimeMode(dbValue) {
    return dbValue === 'custom' ? 'custom' : exports.DEFAULT_RUNTIME_SETTINGS.bookingHoldTimeMode;
}
function resolveMinutesSetting(dbValue, defaultValue) {
    const value = Number(dbValue);
    return Number.isInteger(value) && value >= 5 && value <= 1440 ? value : defaultValue;
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
function resolveWhatsAppUrlSync(dbUrl) {
    if (dbUrl) {
        try {
            return normalizeWhatsAppUrl(dbUrl);
        }
        catch { /* fallthrough */ }
    }
    if (process.env.WHATSAPP_URL) {
        try {
            return normalizeWhatsAppUrl(process.env.WHATSAPP_URL);
        }
        catch { /* fallthrough */ }
    }
    if (process.env.WHATSAPP_PHONE) {
        return buildWhatsAppUrlFromPhone(process.env.WHATSAPP_PHONE);
    }
    return '';
}
function resolveTextSetting(dbValue, envValue) {
    return dbValue || envValue || '';
}
function resolveUrlSetting(dbValue, envValue, label) {
    const value = dbValue || envValue || '';
    if (!value)
        return '';
    try {
        return normalizeOptionalUrl(value, label);
    }
    catch {
        return '';
    }
}
async function getAdminSettings() {
    const [dbZaloPhone, dbWhatsAppUrl, dbWeChatId, dbKakaoTalkId, dbTikTokUrl, dbFacebookPersonalUrl, dbFacebookFanpageUrl, dbNaverBlogUrl, dbInstagramWorkUrl, dbCommonPolicy, dbHoldTimeMode, dbHoldMinutes, dbCustomHoldMinutes,] = await Promise.all([
        getSettingValue(exports.SETTING_KEYS.ZALO_PHONE),
        getSettingValue(exports.SETTING_KEYS.WHATSAPP_URL),
        getSettingValue(exports.SETTING_KEYS.WECHAT_ID),
        getSettingValue(exports.SETTING_KEYS.KAKAOTALK_ID),
        getSettingValue(exports.SETTING_KEYS.TIKTOK_URL),
        getSettingValue(exports.SETTING_KEYS.FACEBOOK_PERSONAL_URL),
        getSettingValue(exports.SETTING_KEYS.FACEBOOK_FANPAGE_URL),
        getSettingValue(exports.SETTING_KEYS.NAVER_BLOG_URL),
        getSettingValue(exports.SETTING_KEYS.INSTAGRAM_WORK_URL),
        getSettingValue(exports.SETTING_KEYS.COMMON_POLICY),
        getSettingValue(exports.SETTING_KEYS.BOOKING_HOLD_TIME_MODE),
        getSettingValue(exports.SETTING_KEYS.BOOKING_HOLD_MINUTES),
        getSettingValue(exports.SETTING_KEYS.BOOKING_CUSTOM_HOLD_MINUTES),
    ]);
    const zaloPhone = resolveZaloPhoneSync(dbZaloPhone);
    const whatsappUrl = resolveWhatsAppUrlSync(dbWhatsAppUrl);
    return {
        zaloPhone,
        zaloUrl: zaloPhone ? buildZaloUrl(zaloPhone) : '',
        whatsappUrl,
        wechatId: resolveTextSetting(dbWeChatId, process.env.WECHAT_ID),
        kakaoTalkId: resolveTextSetting(dbKakaoTalkId, process.env.KAKAOTALK_ID),
        tikTokUrl: resolveUrlSetting(dbTikTokUrl, process.env.TIKTOK_URL, 'TikTok URL'),
        facebookPersonalUrl: resolveUrlSetting(dbFacebookPersonalUrl, process.env.FACEBOOK_PERSONAL_URL, 'Facebook cá nhân URL'),
        facebookFanpageUrl: resolveUrlSetting(dbFacebookFanpageUrl, process.env.FACEBOOK_FANPAGE_URL, 'Facebook fanpage URL'),
        naverBlogUrl: resolveUrlSetting(dbNaverBlogUrl, process.env.NAVER_BLOG_URL, 'Naver Blog URL'),
        instagramWorkUrl: resolveUrlSetting(dbInstagramWorkUrl, process.env.INSTAGRAM_WORK_URL, 'Instagram URL'),
        commonPolicy: dbCommonPolicy || exports.DEFAULT_COMMON_POLICY,
        bookingHoldTimeMode: resolveHoldTimeMode(dbHoldTimeMode),
        holdMinutes: resolveMinutesSetting(dbHoldMinutes, exports.DEFAULT_RUNTIME_SETTINGS.holdMinutes),
        customHoldMinutes: resolveMinutesSetting(dbCustomHoldMinutes, exports.DEFAULT_RUNTIME_SETTINGS.customHoldMinutes),
    };
}
async function getBookingHoldMinutes() {
    const [modeValue, holdValue, customValue] = await Promise.all([
        getSettingValue(exports.SETTING_KEYS.BOOKING_HOLD_TIME_MODE),
        getSettingValue(exports.SETTING_KEYS.BOOKING_HOLD_MINUTES),
        getSettingValue(exports.SETTING_KEYS.BOOKING_CUSTOM_HOLD_MINUTES),
    ]);
    const mode = modeValue === 'custom' ? 'custom' : 'preset';
    const selectedValue = mode === 'custom' ? customValue : holdValue;
    if (!selectedValue)
        return null;
    const minutes = Number(selectedValue);
    return Number.isInteger(minutes) && minutes >= 5 && minutes <= 1440 ? minutes : null;
}
/**
 * Public-safe settings — exposed without admin auth.
 * Only returns fields safe for public consumption.
 */
async function getPublicSettings() {
    return getAdminSettings();
}

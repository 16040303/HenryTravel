import { prisma } from '../lib/prisma';

export const SETTING_KEYS = {
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
} as const;

export type BookingHoldTimeMode = 'preset' | 'custom';

export const DEFAULT_RUNTIME_SETTINGS = {
  bookingHoldTimeMode: 'preset' as BookingHoldTimeMode,
  holdMinutes: 15,
  customHoldMinutes: 45,
};

export const DEFAULT_COMMON_POLICY = [
  'Check in 14h',
  'Check out 11h hôm sau',
  'Giữ chỗ theo thời gian cấu hình của villa',
  'Quy định riêng của từng căn sẽ được admin tư vấn qua Zalo sau khi đặt phòng',
].join('\n');

export interface PublicContactSettings {
  zaloPhone: string;
  zaloUrl: string;
  whatsappUrl: string;
  wechatId: string;
  kakaoTalkId: string;
  tikTokUrl: string;
  facebookPersonalUrl: string;
  facebookFanpageUrl: string;
  naverBlogUrl: string;
  instagramWorkUrl: string;
  commonPolicy: string;
  bookingHoldTimeMode: BookingHoldTimeMode;
  holdMinutes: number;
  customHoldMinutes: number;
}

function cleanPhone(value: string): string {
  return value.replace(/[^0-9]/g, '');
}

export function normalizeZaloPhone(input: string): string {
  const trimmed = input.trim();
  const phone = cleanPhone(trimmed);

  if (!phone || phone.length < 8 || phone.length > 15) {
    throw new Error('Số điện thoại Zalo không hợp lệ.');
  }

  return phone;
}

export function buildZaloUrl(phone: string): string {
  return `https://zalo.me/${normalizeZaloPhone(phone)}`;
}

export function buildWhatsAppUrlFromPhone(phone: string): string {
  const clean = cleanPhone(phone);
  if (!clean || clean.length < 8 || clean.length > 15) return '';
  return `https://wa.me/${clean}`;
}

export function normalizeWhatsAppUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  const phone = cleanPhone(trimmed);
  if (/^[+\d\s().-]+$/.test(trimmed) && phone.length >= 8 && phone.length <= 15) {
    return buildWhatsAppUrlFromPhone(phone);
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error('Đường dẫn WhatsApp không hợp lệ.');
  }

  const host = url.hostname.toLowerCase();
  const isAllowedHost = host === 'wa.me' || host === 'api.whatsapp.com' || host === 'web.whatsapp.com' || host.endsWith('.whatsapp.com');
  if (url.protocol !== 'https:' || !isAllowedHost) {
    throw new Error('Đường dẫn WhatsApp phải là URL https của WhatsApp.');
  }

  return url.toString();
}

export function normalizeOptionalUrl(input: string, label: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error(`${label} không hợp lệ.`);
  }

  if (url.protocol !== 'https:') {
    throw new Error(`${label} phải là URL https.`);
  }

  return url.toString();
}

export async function getSettingValue(key: string): Promise<string | null> {
  const setting = await prisma.systemSetting.findUnique({ where: { key } });
  return setting?.value || null;
}

export async function upsertSettingValue(key: string, value: string): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export function normalizeHoldTimeMode(input: unknown): BookingHoldTimeMode {
  if (input === 'preset' || input === 'custom') return input;
  throw new Error('Chế độ giữ chỗ chỉ được là preset hoặc custom.');
}

export function normalizeSettingMinutes(input: unknown, label: string): number {
  const value = typeof input === 'number' ? input : Number(input);
  if (!Number.isInteger(value) || value < 5 || value > 1440) {
    throw new Error(`${label} phải là số nguyên từ 5 đến 1440 phút.`);
  }
  return value;
}

function resolveHoldTimeMode(dbValue: string | null): BookingHoldTimeMode {
  return dbValue === 'custom' ? 'custom' : DEFAULT_RUNTIME_SETTINGS.bookingHoldTimeMode;
}

function resolveMinutesSetting(dbValue: string | null, defaultValue: number): number {
  const value = Number(dbValue);
  return Number.isInteger(value) && value >= 5 && value <= 1440 ? value : defaultValue;
}

export async function resolveZaloPhone(requestPhone?: string | null): Promise<string> {
  const dbPhone = await getSettingValue(SETTING_KEYS.ZALO_PHONE);
  if (dbPhone) return normalizeZaloPhone(dbPhone);

  if (process.env.ZALO_PHONE) return normalizeZaloPhone(process.env.ZALO_PHONE);

  return normalizeZaloPhone(requestPhone || '');
}

function resolveZaloPhoneSync(dbPhone: string | null): string {
  if (dbPhone) {
    try { return normalizeZaloPhone(dbPhone); } catch { /* fallthrough */ }
  }
  if (process.env.ZALO_PHONE) {
    try { return normalizeZaloPhone(process.env.ZALO_PHONE); } catch { /* fallthrough */ }
  }
  return '';
}

function resolveWhatsAppUrlSync(dbUrl: string | null): string {
  if (dbUrl) {
    try { return normalizeWhatsAppUrl(dbUrl); } catch { /* fallthrough */ }
  }
  if (process.env.WHATSAPP_URL) {
    try { return normalizeWhatsAppUrl(process.env.WHATSAPP_URL); } catch { /* fallthrough */ }
  }
  if (process.env.WHATSAPP_PHONE) {
    return buildWhatsAppUrlFromPhone(process.env.WHATSAPP_PHONE);
  }
  return '';
}

function resolveTextSetting(dbValue: string | null, envValue?: string): string {
  return dbValue || envValue || '';
}

function resolveUrlSetting(dbValue: string | null, envValue: string | undefined, label: string): string {
  const value = dbValue || envValue || '';
  if (!value) return '';
  try { return normalizeOptionalUrl(value, label); } catch { return ''; }
}

export async function getAdminSettings(): Promise<PublicContactSettings> {
  const [
    dbZaloPhone,
    dbWhatsAppUrl,
    dbWeChatId,
    dbKakaoTalkId,
    dbTikTokUrl,
    dbFacebookPersonalUrl,
    dbFacebookFanpageUrl,
    dbNaverBlogUrl,
    dbInstagramWorkUrl,
    dbCommonPolicy,
    dbHoldTimeMode,
    dbHoldMinutes,
    dbCustomHoldMinutes,
  ] = await Promise.all([
    getSettingValue(SETTING_KEYS.ZALO_PHONE),
    getSettingValue(SETTING_KEYS.WHATSAPP_URL),
    getSettingValue(SETTING_KEYS.WECHAT_ID),
    getSettingValue(SETTING_KEYS.KAKAOTALK_ID),
    getSettingValue(SETTING_KEYS.TIKTOK_URL),
    getSettingValue(SETTING_KEYS.FACEBOOK_PERSONAL_URL),
    getSettingValue(SETTING_KEYS.FACEBOOK_FANPAGE_URL),
    getSettingValue(SETTING_KEYS.NAVER_BLOG_URL),
    getSettingValue(SETTING_KEYS.INSTAGRAM_WORK_URL),
    getSettingValue(SETTING_KEYS.COMMON_POLICY),
    getSettingValue(SETTING_KEYS.BOOKING_HOLD_TIME_MODE),
    getSettingValue(SETTING_KEYS.BOOKING_HOLD_MINUTES),
    getSettingValue(SETTING_KEYS.BOOKING_CUSTOM_HOLD_MINUTES),
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
    commonPolicy: dbCommonPolicy || DEFAULT_COMMON_POLICY,
    bookingHoldTimeMode: resolveHoldTimeMode(dbHoldTimeMode),
    holdMinutes: resolveMinutesSetting(dbHoldMinutes, DEFAULT_RUNTIME_SETTINGS.holdMinutes),
    customHoldMinutes: resolveMinutesSetting(dbCustomHoldMinutes, DEFAULT_RUNTIME_SETTINGS.customHoldMinutes),
  };
}

export async function getBookingHoldMinutes(): Promise<number | null> {
  const [modeValue, holdValue, customValue] = await Promise.all([
    getSettingValue(SETTING_KEYS.BOOKING_HOLD_TIME_MODE),
    getSettingValue(SETTING_KEYS.BOOKING_HOLD_MINUTES),
    getSettingValue(SETTING_KEYS.BOOKING_CUSTOM_HOLD_MINUTES),
  ]);

  const mode = modeValue === 'custom' ? 'custom' : 'preset';
  const selectedValue = mode === 'custom' ? customValue : holdValue;
  if (!selectedValue) return null;

  const minutes = Number(selectedValue);
  return Number.isInteger(minutes) && minutes >= 5 && minutes <= 1440 ? minutes : null;
}

/**
 * Public-safe settings — exposed without admin auth.
 * Only returns fields safe for public consumption.
 */
export async function getPublicSettings(): Promise<PublicContactSettings> {
  return getAdminSettings();
}


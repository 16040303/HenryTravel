import { prisma } from '../lib/prisma';

export const SETTING_KEYS = {
  ZALO_PHONE: 'ZALO_PHONE',
} as const;

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

export async function getAdminSettings() {
  const dbZaloPhone = await getSettingValue(SETTING_KEYS.ZALO_PHONE);
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
export async function getPublicSettings(): Promise<{ zaloPhone: string; zaloUrl: string }> {
  const dbZaloPhone = await getSettingValue(SETTING_KEYS.ZALO_PHONE);
  const zaloPhone = resolveZaloPhoneSync(dbZaloPhone);

  return {
    zaloPhone,
    zaloUrl: zaloPhone ? buildZaloUrl(zaloPhone) : '',
  };
}

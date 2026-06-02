interface BookingEmailData {
  bookingCode: string;
  villaName: string;
  villaLocation?: string | null;
  guestName?: string | null;
  guestPhone?: string | null;
  guestEmail?: string | null;
  checkIn: Date;
  checkOut: Date;
  guestsCount: number;
  roomsCount: number;
  holdExpireAt?: Date | null;
}

interface FeedbackEmailData {
  villaName: string;
  bookingCode?: string | null;
  guestName?: string | null;
  rating: number;
  comment?: string | null;
}

export interface EmailTemplate {
  subject: string;
  text: string;
  html: string;
}

const appUrl = process.env.PUBLIC_APP_URL?.replace(/\/$/, '') || '';
const lookupUrl = appUrl ? `${appUrl}/#/lookup` : '';
const adminUrl = appUrl ? `${appUrl}/#/admin` : '';

const escapeHtml = (value: unknown): string => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const formatDate = (value: Date): string => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(value);
const formatDateTime = (value?: Date | null): string => value
  ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(value)
  : 'Không có';

function renderEmailLayout({
  title,
  intro,
  contentHtml,
  ctaLabel,
  ctaUrl,
}: {
  title: string;
  intro: string;
  contentHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
}): string {
  const safeTitle = escapeHtml(title);
  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f3f7fb;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;color:#1f2937;line-height:1.55;">
  <div style="display:none;max-height:0;overflow:hidden;color:transparent;opacity:0;">${escapeHtml(intro)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f7fb;margin:0;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #dbeafe;border-radius:20px;overflow:hidden;box-shadow:0 12px 32px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:#0f6fb5;padding:22px 28px;">
              <div style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#dbeafe;">HenryTravel</div>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;line-height:1.25;font-weight:700;">${safeTitle}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 20px;font-size:15px;color:#374151;">${escapeHtml(intro)}</p>
              ${contentHtml}
              ${ctaLabel && ctaUrl ? `
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0 6px;">
                <tr>
                  <td style="border-radius:999px;background:#0f6fb5;">
                    <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:12px 22px;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;border-radius:999px;">${escapeHtml(ctaLabel)}</a>
                  </td>
                </tr>
              </table>` : ''}
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #e5edf7;background:#f8fafc;padding:18px 28px;color:#64748b;font-size:13px;">
              <p style="margin:0 0 6px;">Email này được gửi tự động từ HenryTravel.</p>
              <p style="margin:0;">Nếu bạn cần hỗ trợ, vui lòng liên hệ tư vấn viên qua Zalo.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderInfoTable(rows: Array<[string, string | number | null | undefined]>): string {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;border:1px solid #dbeafe;border-radius:14px;overflow:hidden;background:#ffffff;">
      ${rows.map(([label, value], index) => `
      <tr>
        <td style="width:42%;padding:12px 14px;background:${index % 2 === 0 ? '#f8fbff' : '#ffffff'};border-bottom:1px solid #eaf2fb;color:#64748b;font-size:13px;font-weight:700;">${escapeHtml(label)}</td>
        <td style="padding:12px 14px;background:${index % 2 === 0 ? '#f8fbff' : '#ffffff'};border-bottom:1px solid #eaf2fb;color:#0f172a;font-size:14px;font-weight:600;">${escapeHtml(value || 'N/A')}</td>
      </tr>`).join('')}
    </table>`;
}

function bookingRows(data: BookingEmailData, status: string, includeContact = false): Array<[string, string | number | null | undefined]> {
  return [
    ['Mã booking', data.bookingCode],
    ['Villa', `${data.villaName}${data.villaLocation ? ` — ${data.villaLocation}` : ''}`],
    ...(includeContact ? [
      ['Khách', data.guestName || 'N/A'] as [string, string],
      ['Số điện thoại', data.guestPhone || 'N/A'] as [string, string],
      ['Email khách', data.guestEmail || 'N/A'] as [string, string],
    ] : []),
    ['Check-in', formatDate(data.checkIn)],
    ['Check-out', formatDate(data.checkOut)],
    ['Số khách / số phòng', `${data.guestsCount} khách / ${data.roomsCount} phòng`],
    ['Trạng thái', status],
  ];
}

function bookingTextRows(data: BookingEmailData, status: string, includeContact = false): string[] {
  return bookingRows(data, status, includeContact).map(([label, value]) => `${label}: ${value || 'N/A'}`);
}

function textFooter(ctaLabel?: string, ctaUrl?: string): string[] {
  return [
    ctaLabel && ctaUrl ? `${ctaLabel}: ${ctaUrl}` : '',
    '',
    'Email này được gửi tự động từ HenryTravel.',
    'Nếu bạn cần hỗ trợ, vui lòng liên hệ tư vấn viên qua Zalo.',
  ].filter((line) => line !== undefined);
}

export function bookingPendingAdminTemplate(data: BookingEmailData): EmailTemplate {
  const subject = `[HenryTravel] Có yêu cầu giữ chỗ mới - ${data.bookingCode}`;
  const intro = 'Khách vừa tạo yêu cầu giữ chỗ. Vui lòng kiểm tra Zalo/tin nhắn và xác nhận nếu thông tin phù hợp.';
  const text = [
    intro,
    '',
    ...bookingTextRows(data, 'Đang giữ chỗ', true),
    `Hết hạn giữ chỗ: ${formatDateTime(data.holdExpireAt)}`,
    ...textFooter(adminUrl ? 'Mở trang quản trị' : undefined, adminUrl),
  ].join('\n');
  const html = renderEmailLayout({
    title: 'Có yêu cầu giữ chỗ mới',
    intro,
    contentHtml: renderInfoTable([
      ...bookingRows(data, 'Đang giữ chỗ', true),
      ['Hết hạn giữ chỗ', formatDateTime(data.holdExpireAt)],
    ]),
    ctaLabel: adminUrl ? 'Mở trang quản trị' : undefined,
    ctaUrl: adminUrl,
  });
  return { subject, text, html };
}

export function bookingConfirmedGuestTemplate(data: BookingEmailData): EmailTemplate {
  const subject = `[HenryTravel] Đặt phòng của bạn đã được xác nhận - ${data.bookingCode}`;
  const greeting = `Chào ${data.guestName || 'quý khách'},`;
  const intro = `${greeting} đặt phòng của bạn đã được HenryTravel xác nhận. Vui lòng lưu lại mã booking để tiện tra cứu khi cần.`;
  const text = [
    intro,
    '',
    ...bookingTextRows(data, 'Đã xác nhận'),
    'Nhắc nhỏ: bạn nên lưu mã booking để tra cứu hoặc trao đổi với tư vấn viên.',
    ...textFooter(lookupUrl ? 'Tra cứu đặt phòng' : undefined, lookupUrl),
  ].join('\n');
  const html = renderEmailLayout({
    title: 'Đặt phòng đã được xác nhận',
    intro,
    contentHtml: `${renderInfoTable(bookingRows(data, 'Đã xác nhận'))}
      <p style="margin:18px 0 0;color:#475569;font-size:14px;">Bạn vui lòng lưu mã booking <strong style="color:#0f172a;">${escapeHtml(data.bookingCode)}</strong> để tra cứu hoặc trao đổi với tư vấn viên.</p>`,
    ctaLabel: lookupUrl ? 'Tra cứu đặt phòng' : undefined,
    ctaUrl: lookupUrl,
  });
  return { subject, text, html };
}

export function bookingCancelledGuestTemplate(data: BookingEmailData, reason?: string): EmailTemplate {
  const subject = `[HenryTravel] Cập nhật trạng thái đặt phòng - ${data.bookingCode}`;
  const intro = `Chào ${data.guestName || 'quý khách'}, HenryTravel xin thông báo đặt phòng của bạn đã được cập nhật sang trạng thái hủy.`;
  const reasonText = reason ? `Ghi chú: ${reason}` : '';
  const text = [
    intro,
    reasonText,
    '',
    ...bookingTextRows(data, 'Đã hủy'),
    ...textFooter(lookupUrl ? 'Tra cứu đặt phòng' : undefined, lookupUrl),
  ].filter(Boolean).join('\n');
  const html = renderEmailLayout({
    title: 'Cập nhật trạng thái đặt phòng',
    intro,
    contentHtml: `${reason ? `<div style="margin:0 0 18px;padding:14px 16px;background:#f8fbff;border:1px solid #dbeafe;border-radius:12px;color:#334155;font-size:14px;"><strong>Ghi chú:</strong> ${escapeHtml(reason)}</div>` : ''}
      ${renderInfoTable(bookingRows(data, 'Đã hủy'))}`,
    ctaLabel: lookupUrl ? 'Tra cứu đặt phòng' : undefined,
    ctaUrl: lookupUrl,
  });
  return { subject, text, html };
}

export function feedbackCreatedAdminTemplate(data: FeedbackEmailData): EmailTemplate {
  const subject = '[HenryTravel] Có đánh giá mới từ khách';
  const intro = 'Admin vừa nhận được một đánh giá mới từ khách. Vui lòng kiểm tra nội dung trong trang quản trị.';
  const preview = data.comment ? data.comment.slice(0, 500) : 'Không có nhận xét.';
  const rows: Array<[string, string | number | null | undefined]> = [
    ['Villa', data.villaName],
    ['Mã booking', data.bookingCode || 'N/A'],
    ['Khách', data.guestName || 'N/A'],
    ['Rating', `${data.rating}/5`],
    ['Nội dung feedback', preview],
  ];
  const text = [
    intro,
    '',
    ...rows.map(([label, value]) => `${label}: ${value || 'N/A'}`),
    ...textFooter(adminUrl ? 'Mở trang quản trị' : undefined, adminUrl),
  ].join('\n');
  const html = renderEmailLayout({
    title: 'Có đánh giá mới từ khách',
    intro,
    contentHtml: renderInfoTable(rows),
    ctaLabel: adminUrl ? 'Mở trang quản trị' : undefined,
    ctaUrl: adminUrl,
  });
  return { subject, text, html };
}

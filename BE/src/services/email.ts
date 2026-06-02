import sendgrid from '@sendgrid/mail';

export interface EmailMessage {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
}

interface EmailContext {
  event: string;
  bookingCode?: string;
}

let sendgridConfigured = false;

function getRecipients(value: string | string[]): string[] {
  const raw = Array.isArray(value) ? value : value.split(',');
  return raw.map((item) => item.trim()).filter(Boolean);
}

export function getAdminEmails(): string[] {
  const value = process.env.ADMIN_EMAIL || '';
  return getRecipients(value);
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.SENDGRID_API_KEY && process.env.EMAIL_FROM);
}

function configureSendGrid(): void {
  if (sendgridConfigured) return;
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) return;
  sendgrid.setApiKey(apiKey);
  sendgridConfigured = true;
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  if (!isEmailConfigured()) {
    throw new Error('EMAIL_NOT_CONFIGURED');
  }

  configureSendGrid();
  const from = process.env.EMAIL_FROM as string;
  const recipients = getRecipients(message.to);
  if (recipients.length === 0) return;

  await sendgrid.send({
    to: recipients,
    from,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}

export async function sendEmailBestEffort(message: EmailMessage, context: EmailContext): Promise<void> {
  try {
    if (!isEmailConfigured()) {
      console.warn(`[EMAIL_SKIPPED] ${context.event}: email is not configured`);
      return;
    }
    await sendEmail(message);
  } catch {
    const suffix = context.bookingCode ? ` booking=${context.bookingCode}` : '';
    console.warn(`[EMAIL_FAILED] ${context.event}${suffix}`);
  }
}

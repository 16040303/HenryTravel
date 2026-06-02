"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminEmails = getAdminEmails;
exports.isEmailConfigured = isEmailConfigured;
exports.sendEmail = sendEmail;
exports.sendEmailBestEffort = sendEmailBestEffort;
const mail_1 = __importDefault(require("@sendgrid/mail"));
let sendgridConfigured = false;
function getRecipients(value) {
    const raw = Array.isArray(value) ? value : value.split(',');
    return raw.map((item) => item.trim()).filter(Boolean);
}
function getAdminEmails() {
    const value = process.env.ADMIN_EMAIL || '';
    return getRecipients(value);
}
function isEmailConfigured() {
    return Boolean(process.env.SENDGRID_API_KEY && process.env.EMAIL_FROM);
}
function configureSendGrid() {
    if (sendgridConfigured)
        return;
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey)
        return;
    mail_1.default.setApiKey(apiKey);
    sendgridConfigured = true;
}
async function sendEmail(message) {
    if (!isEmailConfigured()) {
        throw new Error('EMAIL_NOT_CONFIGURED');
    }
    configureSendGrid();
    const from = process.env.EMAIL_FROM;
    const recipients = getRecipients(message.to);
    if (recipients.length === 0)
        return;
    await mail_1.default.send({
        to: recipients,
        from,
        subject: message.subject,
        text: message.text,
        html: message.html,
    });
}
async function sendEmailBestEffort(message, context) {
    try {
        if (!isEmailConfigured()) {
            console.warn(`[EMAIL_SKIPPED] ${context.event}: email is not configured`);
            return;
        }
        await sendEmail(message);
    }
    catch {
        const suffix = context.bookingCode ? ` booking=${context.bookingCode}` : '';
        console.warn(`[EMAIL_FAILED] ${context.event}${suffix}`);
    }
}

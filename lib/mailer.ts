import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || undefined,
  port: process.env.MAIL_PORT ? Number(process.env.MAIL_PORT) : undefined,
  secure: Boolean(process.env.MAIL_SECURE === 'true'),
  service: process.env.MAIL_SERVICE || undefined,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export function renderTemplate(html: string, vars: Record<string, string>): string {
  return html.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => vars[key] ?? "");
}

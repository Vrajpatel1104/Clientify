import { NextResponse } from "next/server";
export const runtime = 'nodejs';
import { prisma } from "@/lib/prisma";
import { transporter } from "@/lib/mailer";
import { buildTrackingPixelUrl, buildUnsubscribeUrl } from "@/lib/email-utils";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { subject, body } = await req.json();
    if (!subject || !body) return NextResponse.json({ error: 'subject and body required' }, { status: 400 });

    const email = await prisma.email.findUnique({ where: { id } });
    if (!email) return NextResponse.json({ error: 'Email not found' }, { status: 404 });

    const log = await prisma.mailLog.create({ data: { emailId: email.id, subject, body, status: 'DRAFT' as any } });
    const html = `
      <div>${body}</div>
      <img src="${buildTrackingPixelUrl(log.id)}" width="1" height="1" style="display:none" />
      <div style="margin-top:16px;font-size:12px;color:#666">
        <a href="${buildUnsubscribeUrl(email.address)}">Unsubscribe</a>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: process.env.MAIL_FROM || process.env.MAIL_USER,
        to: email.address,
        subject,
        html,
        text: body,
      });
      await prisma.mailLog.update({ where: { id: log.id }, data: { status: 'SENT' as any, sentAt: new Date() } });
      return NextResponse.json({ ok: true });
    } catch (e: any) {
      await prisma.mailLog.update({ where: { id: log.id }, data: { status: 'ERROR' as any, bounceReason: e?.message } });
      return NextResponse.json({ error: 'Send failed' }, { status: 500 });
    }
  } catch (e) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}



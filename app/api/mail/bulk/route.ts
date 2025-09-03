import { NextResponse } from "next/server";
export const runtime = 'nodejs';
import { prisma } from "@/lib/prisma";
import { transporter } from "@/lib/mailer";
import { buildTrackingPixelUrl, buildUnsubscribeUrl } from "@/lib/email-utils";

export async function POST(req: Request) {
  try {
    const { emailIds, subject, body } = await req.json();
    if (!Array.isArray(emailIds) || emailIds.length === 0 || !subject || !body) {
      return NextResponse.json({ error: "emailIds[], subject, body are required" }, { status: 400 });
    }

    const emails = await prisma.email.findMany({ where: { id: { in: emailIds } } });

    const results: any[] = [];
    for (const email of emails) {
      const log = await prisma.mailLog.create({
        data: { emailId: email.id, subject, body, status: "DRAFT" as any },
      });

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

        await prisma.mailLog.update({
          where: { id: log.id },
          data: { status: "SENT" as any, sentAt: new Date() },
        });
        results.push({ id: email.id, status: "SENT" });
      } catch (e: any) {
        await prisma.mailLog.update({
          where: { id: log.id },
          data: { status: "ERROR" as any, bounceReason: e?.message },
        });
        results.push({ id: email.id, status: "ERROR" });
      }
    }

    return NextResponse.json({ count: results.length, results });
  } catch (e) {
    return NextResponse.json({ error: "Failed to send bulk" }, { status: 500 });
  }
}



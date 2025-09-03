import { NextResponse } from "next/server";
export const runtime = 'nodejs';
import { transporter } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const { addresses, subject, body } = await req.json();
    if (!Array.isArray(addresses) || addresses.length === 0 || !subject || !body) {
      return NextResponse.json({ error: "addresses[], subject, body are required" }, { status: 400 });
    }

    const from = process.env.MAIL_FROM || process.env.MAIL_USER;
    const results: Array<{ address: string; status: string; error?: string }> = [];
    for (const address of addresses) {
      try {
        await transporter.sendMail({ from, to: address, subject, text: body, html: `<div>${body}</div>` });
        results.push({ address, status: 'SENT' });
      } catch (e: any) {
        results.push({ address, status: 'ERROR', error: e?.message });
      }
    }

    return NextResponse.json({ count: results.length, results });
  } catch (e) {
    return NextResponse.json({ error: "Failed to send raw" }, { status: 500 });
  }
}



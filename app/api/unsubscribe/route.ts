import { NextResponse } from "next/server";
export const runtime = 'nodejs';
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = (searchParams.get("email") || "").toLowerCase();
  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });
  try {
    await prisma.email.update({
      where: { address: email },
      data: { status: "UNSUBSCRIBED" as any, unsubscribeAt: new Date() },
    });
  } catch {}
  return NextResponse.json({ success: true });
}



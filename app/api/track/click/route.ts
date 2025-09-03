import { NextResponse } from "next/server";
export const runtime = 'nodejs';
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const logId = searchParams.get("logId");
  const to = searchParams.get("to");
  if (!logId || !to) return NextResponse.redirect(to || "/", 302);
  try {
    await prisma.mailLog.update({
      where: { id: logId },
      data: { status: "CLICKED" as any, clickedAt: new Date() },
    });
  } catch {}
  return NextResponse.redirect(to, 302);
}



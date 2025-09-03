import { NextResponse } from "next/server";
export const runtime = 'nodejs';
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const business = await prisma.business.findUnique({ where: { id } });
    if (!business || !business.website) {
      return NextResponse.json({ error: "Business not found or no website" }, { status: 400 });
    }
    const origin = new URL(req.url).origin;
    const { force } = await (async () => { try { return await req.json(); } catch { return {}; } })() as any;
    const res = await fetch(`${origin}/api/scrape-emails`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId: business.id, website: business.website, force: Boolean(force) }),
    });
    const data = await res.json();
    const status = res.ok ? 200 : 500;
    return NextResponse.json(data, { status });
  } catch (e) {
    return NextResponse.json({ error: "Failed to trigger scrape" }, { status: 500 });
  }
}



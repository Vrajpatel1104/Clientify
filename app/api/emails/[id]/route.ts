import { NextResponse } from "next/server";
export const runtime = 'nodejs';
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const { status } = body as { status?: 'NEW' | 'VERIFIED' | 'INVALID' | 'BOUNCED' | 'UNSUBSCRIBED' };

    const prismaAny = prisma as any;
    if (!prismaAny?.email?.update) return NextResponse.json({ error: 'Unavailable' }, { status: 503 });

    const updated = await prismaAny.email.update({ where: { id }, data: { ...(status && { status }) } });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update email' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const prismaAny = prisma as any;
    if (!prismaAny?.email?.delete) return NextResponse.json({ error: 'Unavailable' }, { status: 503 });

    // Cleanup related entities best-effort
    try { await prismaAny.emailSource.deleteMany({ where: { emailId: id } }); } catch {}
    try { await prismaAny.emailBusinessLink.deleteMany({ where: { emailId: id } }); } catch {}
    try { await prismaAny.mailLog.deleteMany({ where: { emailId: id } }); } catch {}
    await prismaAny.email.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete email' }, { status: 500 });
  }
}



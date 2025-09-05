import { NextResponse } from "next/server";
export const runtime = 'nodejs';
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const { status } = body as { status?: 'NEW' | 'VERIFIED' | 'INVALID' | 'BOUNCED' | 'UNSUBSCRIBED' };

    const updated = await prisma.email.update({ 
      where: { id }, 
      data: { ...(status && { status }) } 
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update email' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    // Cleanup related entities best-effort
    try { await prisma.emailSource.deleteMany({ where: { emailId: id } }); } catch {}
    try { await prisma.emailBusinessLink.deleteMany({ where: { emailId: id } }); } catch {}
    try { await prisma.mailLog.deleteMany({ where: { emailId: id } }); } catch {}
    await prisma.email.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete email' }, { status: 500 });
  }
}



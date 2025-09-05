import { NextResponse } from "next/server";
export const runtime = 'nodejs';
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const links = await prisma.emailBusinessLink.findMany({
      where: { businessId: id },
      include: { email: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    const emails = links.map((l) => l.email);
    return NextResponse.json(emails);
  } catch {
    return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 });
  }
}



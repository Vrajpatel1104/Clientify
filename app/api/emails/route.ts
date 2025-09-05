import { NextResponse } from "next/server";
export const runtime = 'nodejs';
import { prisma } from "@/lib/prisma";

// Returns dashboard rows grouped by business, including emails and lead status
export async function GET() {
  try {
    const businesses = await prisma.business.findMany({
      orderBy: { addedAt: 'desc' },
      take: 300,
      include: {
        leads: { select: { status: true }, take: 1, orderBy: { updatedAt: 'desc' } },
        emailLinks: { include: { email: true } },
      },
    });

    const rows = businesses.map((b) => ({
      businessId: b.id,
      businessName: b.name,
      website: b.website,
      isScraped: b.isScraped ?? false,
      leadStatus: b.leads[0]?.status ?? null,
      emails: b.emailLinks.map((l) => ({ id: l.email.id, address: l.email.address, status: l.email.status })),
    }));
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([]);
  }
}



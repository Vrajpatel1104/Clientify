import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // First, get all email links for this business to find associated emails
    const emailLinks = await prisma.emailBusinessLink.findMany({
      where: { businessId: id },
      include: { email: true }
    });

    // Delete all leads for this business
    await prisma.lead.deleteMany({
      where: { businessId: id }
    });

    // Delete all email-business links for this business
    await prisma.emailBusinessLink.deleteMany({
      where: { businessId: id }
    });

    // Delete associated emails (only if they're not linked to other businesses)
    for (const link of emailLinks) {
      const otherLinks = await prisma.emailBusinessLink.findMany({
        where: { 
          emailId: link.emailId,
          businessId: { not: id }
        }
      });

      // Only delete the email if it's not linked to any other business
      if (otherLinks.length === 0) {
        // Delete email sources first
        await prisma.emailSource.deleteMany({
          where: { emailId: link.emailId }
        });

        // Delete mail logs
        await prisma.mailLog.deleteMany({
          where: { emailId: link.emailId }
        });

        // Delete the email
        await prisma.email.delete({
          where: { id: link.emailId }
        });
      }
    }

    // Finally, delete the business
    await prisma.business.delete({
      where: { id }
    });

    console.log('Business deleted:', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting business:', error);
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete business" }, { status: 500 });
  }
}

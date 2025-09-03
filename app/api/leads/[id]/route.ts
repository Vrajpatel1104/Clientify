import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, emailSent, notes } = body;

    // Update the lead in the database using Prisma
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        ...(status && { status: status as 'NEW' | 'CONTACTED' | 'REPLIED' | 'CLOSED' }),
        ...(emailSent !== undefined && { emailSent }),
        ...(notes !== undefined && { notes })
      },
      include: {
        business: true
      }
    });

    console.log('Lead updated:', updatedLead);
    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error('Error updating lead:', error);
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete the lead from the database using Prisma
    await prisma.lead.delete({
      where: { id }
    });

    console.log('Lead deleted:', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lead:', error);
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 });
  }
}

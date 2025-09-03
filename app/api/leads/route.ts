import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Fetch leads with business data using Prisma
    const leads = await prisma.lead.findMany({
      include: {
        business: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { businessId } = body;

    if (!businessId) {
      return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
    }

    // Check if business exists in the database
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    });
    
    if (!business) {
      console.error('Business not found:', businessId);
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Check if lead already exists for this business
    const existingLead = await prisma.lead.findFirst({
      where: { businessId },
      include: { business: true }
    });
    
    if (existingLead) {
      return NextResponse.json(existingLead);
    }

    // Create new lead using Prisma
    const newLead = await prisma.lead.create({
      data: {
        businessId,
        status: "NEW",
        emailSent: false,
        notes: null
      },
      include: {
        business: true
      }
    });
    
    console.log('Lead created:', newLead);
    return NextResponse.json(newLead);
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}



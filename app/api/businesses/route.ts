import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const location = searchParams.get("location");

    console.log('API called with:', { category, location });

    if (!category || !location) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    // Check if environment variables are set
    if (!process.env.SERPAPI_BASE_URL || !process.env.SERPAPI_KEY) {
      console.log('Using mock data - SerpAPI not configured');
      
      // Return mock data for testing when SerpAPI is not configured
      const mockData = [
        {
          title: `${category} in ${location}`,
          address: `123 Main St, ${location}`,
          phone: "(555) 123-4567",
          website: "https://example.com",
          email: "contact@example.com",
          type: category
        },
        {
          title: `Another ${category} in ${location}`,
          address: `456 Oak Ave, ${location}`,
          phone: "(555) 987-6543",
          website: null,
          email: null,
          type: category
        },
        {
          title: `Best ${category} in ${location}`,
          address: `789 Pine St, ${location}`,
          phone: "(555) 456-7890",
          website: "https://bestbusiness.com",
          email: "info@bestbusiness.com",
          type: category
        }
      ];
      
      return NextResponse.json(mockData);
    }

    const serpUrl = `${process.env.SERPAPI_BASE_URL}?engine=google_maps&q=${encodeURIComponent(category)}+in+${encodeURIComponent(location)}&api_key=${process.env.SERPAPI_KEY}`;
    
    console.log('Making SerpAPI request to:', serpUrl.replace(process.env.SERPAPI_KEY, 'HIDDEN_KEY'));
    
    const serpRes = await fetch(serpUrl);

    if (!serpRes.ok) {
      const errorText = await serpRes.text();
      console.error('SerpAPI request failed:', serpRes.status, errorText);
      throw new Error(`SerpAPI request failed with status ${serpRes.status}: ${errorText}`);
    }

    const data = await serpRes.json();
    
    // Check if SerpAPI returned an error
    if (data.error) {
      console.error('SerpAPI returned error:', data.error);
      return NextResponse.json({ 
        error: "SerpAPI error", 
        details: data.error 
      }, { status: 500 });
    }

    return NextResponse.json(data.local_results || []);
  } catch (error) {
    console.error('Error in businesses API:', error);
    return NextResponse.json({ 
      error: "Failed to fetch businesses", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, category, location, phone, website, email } = body;

    if (!name || !category || !location) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if business already exists to avoid duplicates
    const existingBusiness = await prisma.business.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        },
        location: {
          equals: location,
          mode: 'insensitive'
        }
      }
    });

    if (existingBusiness) {
      console.log('Business already exists:', existingBusiness);
      return NextResponse.json(existingBusiness);
    }

    // Create new business using Prisma
    const business = await prisma.business.create({
      data: {
        name,
        category,
        location,
        phone: phone || null,
        website: website || null,
        email: email || null
      }
    });

    console.log('Business created:', business);
    return NextResponse.json(business);
  } catch (error) {
    console.error('Error creating business:', error);
    return NextResponse.json({ error: "Failed to create business" }, { status: 500 });
  }
}

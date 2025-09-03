import { NextResponse } from "next/server";
export const runtime = 'nodejs';

// Auto-scrape is disabled by design. Keep the route but respond with 410 Gone.
export async function POST() {
  return NextResponse.json({ error: 'Auto-scrape disabled. Use manual scrape.' }, { status: 410 });
}



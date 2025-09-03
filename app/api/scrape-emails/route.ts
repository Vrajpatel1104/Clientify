import { NextResponse } from "next/server";
export const runtime = 'nodejs';
import { prisma } from "@/lib/prisma";
import { fetchPages, extractEmails } from "@/lib/crawl";
import { normalizeEmail, isLikelyJunk, validateEmailSyntax } from "@/lib/extract-emails";
import { hasValidMx } from "@/lib/email-utils";

export async function POST(req: Request) {
  try {
    const { businessId, force } = await req.json();
    if (!businessId) {
      return NextResponse.json({ error: "businessId is required" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business || !business.website) {
      return NextResponse.json({ error: "Business not found or no website" }, { status: 400 });
    }

    if (business.isScraped && !force) {
      return NextResponse.json({ skipped: true, reason: "ALREADY_SCRAPED" }, { status: 200 });
    }

    const pages = await fetchPages(business.website);
    console.log(`[SCRAPE] Fetched ${pages.length} pages for ${business.website}`);
    
    // If no pages were fetched, try just the main website
    if (pages.length === 0) {
      console.log(`[SCRAPE] No pages fetched, trying direct website fetch`);
      try {
        const response = await fetch(business.website, { 
          headers: { "user-agent": "ClientifyBot/1.0" },
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        if (response.ok) {
          const html = await response.text();
          pages.push({ url: business.website, html, status: response.status });
          console.log(`[SCRAPE] Direct fetch successful, got ${html.length} characters`);
        }
      } catch (directErr) {
        console.log(`[SCRAPE] Direct fetch failed:`, directErr);
      }
    }
    
    const candidates = new Set<string>();
    for (const page of pages) {
      const pageEmails = extractEmails(page.html);
      console.log(`[SCRAPE] Page ${page.url}: found ${pageEmails.length} raw emails`);
      pageEmails.forEach((e) => candidates.add(e));
    }
    console.log(`[SCRAPE] Total raw candidates: ${candidates.size}`);
    console.log(`[SCRAPE] Raw candidates:`, Array.from(candidates));

    // Normalize, validate, filter
    const normalized = Array.from(candidates)
      .map(normalizeEmail)
      .filter((e) => validateEmailSyntax(e))
      .filter((e) => !isLikelyJunk(e));

    console.log(`[SCRAPE] After validation: ${normalized.length} emails`);
    console.log(`[SCRAPE] Normalized:`, normalized);
    console.log(`[SCRAPE] Filtered out:`, Array.from(candidates).filter(e => {
      const normalized = normalizeEmail(e);
      return !validateEmailSyntax(normalized) || isLikelyJunk(normalized);
    }));

    const unique = Array.from(new Set(normalized));

    const results: Array<{ email: string; created: boolean; status: string }> = [];

    // Determine persistence capabilities and existing links
    const prismaAny = prisma as any;
    const canPersist = Boolean(
      prismaAny?.email?.upsert &&
      prismaAny?.emailBusinessLink?.upsert &&
      prismaAny?.emailSource?.create
    );
    let existingAddresses = new Set<string>();
    if (canPersist) {
      const existingLinks = await prismaAny.emailBusinessLink.findMany({ where: { businessId }, include: { email: true } });
      existingAddresses = new Set(existingLinks.map((l: any) => l.email.address));
    }

    for (const email of unique) {
      if (canPersist && existingAddresses.has(email)) {
        results.push({ email, created: false, status: "ALREADY_LINKED" });
        continue;
      }
      try {
        const domain = email.split("@")[1] || "";
        const mxOk = await hasValidMx(domain);
        if (!mxOk) {
          results.push({ email, created: false, status: "NO_MX" });
          continue;
        }
        if (!canPersist) {
          results.push({ email, created: false, status: "SKIPPED_DB" });
          continue;
        }

        const emailRecord = await prismaAny.email.upsert({
          where: { address: email },
          update: {},
          create: { address: email, status: "NEW" as any },
        });

        await prismaAny.emailBusinessLink.upsert({
          where: { businessId_emailId: { businessId, emailId: emailRecord.id } },
          update: {},
          create: { businessId, emailId: emailRecord.id },
        });

        const page = pages[0];
        await prismaAny.emailSource.create({
          data: {
            emailId: emailRecord.id,
            url: page ? page.url : business.website,
            method: "crawl",
            confidence: 70,
          },
        });

        results.push({ email, created: true, status: "OK" });
      } catch (innerErr) {
        console.error("Failed to persist email", email, innerErr);
        results.push({ email, created: false, status: "ERROR" });
        continue;
      }
    }

    // Mark business as scraped regardless of found results to avoid re-scraping
    try {
      await prisma.business.update({ where: { id: businessId }, data: { isScraped: true } });
    } catch {}

    return NextResponse.json({ count: results.length, results, businessId, isScraped: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to scrape emails" }, { status: 500 });
  }
}



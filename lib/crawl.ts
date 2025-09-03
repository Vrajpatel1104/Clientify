import { load } from "cheerio";

export type FetchedPage = {
  url: string;
  html: string;
  status: number;
};

const DEFAULT_PATHS = [
  "/",
  "/contact",
  "/contact-us",
  "/contactus",
  "/about",
  "/team",
  "/support",
  "/help",
  "/legal",
  "/privacy",
  "/terms",
  "/impressum",
  "/careers",
  "/jobs"
];

function normalizeBase(website: string): string {
  try {
    const u = new URL(website.startsWith("http") ? website : `https://${website}`);
    u.hash = "";
    u.search = "";
    return u.origin;
  } catch {
    return website;
  }
}

export async function fetchPages(website: string, extraPaths: string[] = []): Promise<FetchedPage[]> {
  const origin = normalizeBase(website);
  const paths = Array.from(new Set([...DEFAULT_PATHS, ...extraPaths]));
  const urls = paths.map((p) => new URL(p, origin).toString());

  const results = await Promise.all(
    urls.map(async (url) => {
      try {
        const res = await fetch(url, { headers: { "user-agent": "ClientifyBot/1.0" } });
        const html = await res.text();
        return { url, html, status: res.status } as FetchedPage;
      } catch {
        return { url, html: "", status: 0 } as FetchedPage;
      }
    })
  );

  return results.filter((r) => r.status >= 200 && r.status < 400 && r.html);
}

export function extractMailtoLinks(html: string): string[] {
  const $ = load(html);
  const emails: string[] = [];
  $("a[href^='mailto:']").each((_, el) => {
    const href = $(el).attr("href") || "";
    const email = href.replace(/^mailto:/i, "").split("?")[0];
    if (email) emails.push(email);
  });
  return emails;
}

function normalizeEmail(email: string): string | null {
  const cleaned = email
    .replace(/[\u00A0\s]+/g, "")
    .replace(/[<>(),;:"'`]+/g, "")
    .replace(/[\.]$/g, "")
    .toLowerCase();

  const match = cleaned.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  return match ? match[0] : null;
}

export function extractEmails(html: string): string[] {
  const $ = load(html);

  // 1) Collect emails from explicit mailto links
  const fromMailto = extractMailtoLinks(html);

  // 2) Remove non-content nodes and extract visible text
  const bodyClone = $("body").clone();
  bodyClone.find("script, style, noscript, svg").remove();
  let textContent = bodyClone.text();

  // Handle common obfuscations: "[at]", "(at)", " at ", " dot "
  const obfuscations: Array<[RegExp, string]> = [
    [/\s*\[at\]\s*/gi, "@"],
    [/\s*\(at\)\s*/gi, "@"],
    [/\s+at\s+/gi, "@"],
    [/\s*\[dot\]\s*/gi, "."],
    [/\s*\(dot\)\s*/gi, "."],
    [/\s+dot\s+/gi, "."],
  ];
  for (const [pattern, replacement] of obfuscations) {
    textContent = textContent.replace(pattern, replacement);
  }

  // 3) Regex search for email-like patterns in text
  const emailRegex = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
  const fromText = Array.from(textContent.matchAll(emailRegex)).map((m) => m[0]);

  // 4) Check common attributes that may store emails
  const attrCandidates: string[] = [];
  $("*[data-email], *[data-contact], *[data-mail], meta[name='email'], meta[property='og:email']").each((_, el) => {
    const attribs = (el as any).attribs || {};
    Object.values(attribs).forEach((v: any) => {
      if (typeof v === "string") attrCandidates.push(v);
    });
  });
  const fromAttrs = attrCandidates.flatMap((val) => Array.from(val.matchAll(emailRegex)).map((m) => m[0]));

  // 5) Normalize and dedupe
  const normalized = [...fromMailto, ...fromText, ...fromAttrs]
    .map((e) => normalizeEmail(e))
    .filter((e): e is string => Boolean(e));

  return Array.from(new Set(normalized));
}

export async function scrapeEmails(website: string, extraPaths: string[] = []): Promise<string[]> {
  const pages = await fetchPages(website, extraPaths);
  const allEmails = new Set<string>();
  for (const page of pages) {
    for (const email of extractEmails(page.html)) {
      allEmails.add(email);
    }
  }
  return Array.from(allEmails);
}

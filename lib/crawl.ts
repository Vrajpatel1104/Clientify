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
  "/about-us",
  "/about",
  "/team",
  "/support",
  "/help",
  "/legal",
  "/privacy",
  "/terms",
  "/impressum",
  "/careers",
  "/jobs",
  "/kontakt",
  "/kontact",
  "/en/contact",
  "/en/about",
  "/company",
  "/who-we-are"
];

function buildBaseVariants(website: string): string[] {
  try {
    const hasProtocol = website.startsWith("http://") || website.startsWith("https://");
    const initial = new URL(hasProtocol ? website : `https://${website}`);
    const hostname = initial.hostname.replace(/^www\./i, "");
    const candidates = [
      new URL(`${initial.protocol}//${hostname}`),
      new URL(`${initial.protocol}//www.${hostname}`),
      new URL(`https://${hostname}`),
      new URL(`https://www.${hostname}`),
      new URL(`http://${hostname}`),
      new URL(`http://www.${hostname}`),
    ];
    const normalized = candidates.map((u) => {
      u.hash = "";
      u.search = "";
      return u.origin;
    });
    return Array.from(new Set(normalized));
  } catch {
    return [website];
  }
}

export async function fetchPages(website: string, extraPaths: string[] = []): Promise<FetchedPage[]> {
  const bases = buildBaseVariants(website);
  const paths = Array.from(new Set([...DEFAULT_PATHS, ...extraPaths]));
  const urls = bases.flatMap((base) => paths.map((p) => new URL(p, base).toString()));

  async function fetchWithRetry(url: string, attempts: number = 2): Promise<FetchedPage> {
    const headers = { "user-agent": "Mozilla/5.0 (compatible; ClientifyBot/1.0; +https://clientify.local)" } as any;
    for (let i = 0; i < attempts; i++) {
      try {
        const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
        const html = await res.text();
        return { url, html, status: res.status } as FetchedPage;
      } catch {
        if (i === attempts - 1) break;
        await new Promise((r) => setTimeout(r, 300));
      }
    }
    return { url, html: "", status: 0 } as FetchedPage;
  }

  const results = await Promise.all(urls.map((u) => fetchWithRetry(u)));

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

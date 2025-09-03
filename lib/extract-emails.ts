const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}/g;

export function extractEmailsFromText(htmlOrText: string): string[] {
  const matches = htmlOrText.match(EMAIL_REGEX) || [];
  return Array.from(new Set(matches));
}

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "10minutemail.com",
  "guerrillamail.com",
  "yopmail.com",
]);

const JUNK_LOCALPART = [
  "noreply",
  "no-reply",
  "donotreply",
  "do-not-reply",
  "test",
  "example",
  // Removed "admin" and "webmaster" as they are common business emails
];

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isLikelyJunk(email: string): boolean {
  const [local, domain = ""] = email.split("@");
  if (!local || !domain) return true;
  if (domain.includes("example.com")) return true;
  if (DISPOSABLE_DOMAINS.has(domain)) return true;
  if (JUNK_LOCALPART.some((j) => local.includes(j))) return true;
  return false;
}

export function validateEmailSyntax(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}



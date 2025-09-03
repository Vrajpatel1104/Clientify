import dns from "dns";

export async function hasValidMx(domain: string): Promise<boolean> {
  try {
    const records = await new Promise<dns.MxRecord[]>((resolve, reject) => {
      dns.resolveMx(domain, (err, addresses) => {
        if (err) return resolve([]);
        resolve(addresses || []);
      });
    });
    return records.length > 0;
  } catch {
    return false;
  }
}

export function throttle<T>(items: T[], perSecond: number): T[][] {
  const chunkSize = Math.max(1, perSecond);
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

export function buildTrackingPixelUrl(logId: string): string {
  return `/api/track/open?logId=${encodeURIComponent(logId)}`;
}

export function buildClickUrl(logId: string, to: string): string {
  return `/api/track/click?logId=${encodeURIComponent(logId)}&to=${encodeURIComponent(to)}`;
}

export function buildUnsubscribeUrl(email: string): string {
  return `/api/unsubscribe?email=${encodeURIComponent(email)}`;
}



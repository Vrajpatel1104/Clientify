"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type LeadStatus = "NEW" | "CONTACTED" | "REPLIED" | "CLOSED";
type EmailStatus = "NEW" | "VERIFIED" | "INVALID" | "BOUNCED" | "UNSUBSCRIBED";

type Row = {
  businessId: string;
  businessName: string;
  website?: string | null;
  isScraped: boolean;
  emails: { id: string; address: string; status: EmailStatus }[];
  leadStatus?: LeadStatus | null;
};

export default function EmailsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState<Record<string, boolean>>({});
  const isMountedRef = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/emails", { cache: "no-store" });
      const json = await res.json();
      const parsed = Array.isArray(json) ? (json as Row[]) : [];
      if (isMountedRef.current) setRows(parsed);
    } catch {
      if (isMountedRef.current) setRows([]);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    load();
    return () => { isMountedRef.current = false; };
  }, [load]);

  const scrapeBusiness = async (businessId: string, opts?: { force?: boolean }) => {
    setScraping(prev => ({ ...prev, [businessId]: true }));
    try {
      const res = await fetch(`/api/scrape-emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, force: Boolean(opts?.force) })
      });
      if (!res.ok) throw new Error('Scrape failed');
      await load();
    } catch {
    } finally {
      setScraping(prev => ({ ...prev, [businessId]: false }));
    }
  };

  const scrapeAll = async () => {
    const toScrape = rows.filter(r => !r.isScraped && r.website);
    for (const r of toScrape) {
      await scrapeBusiness(r.businessId);
    }
  };

  const flattened = useMemo(() => rows.flatMap(r => r.emails.map(e => ({
    key: `${r.businessId}:${e.id}`,
    businessId: r.businessId,
    businessName: r.businessName,
    website: r.website,
    isScraped: r.isScraped,
    emailId: e.id,
    address: e.address,
    status: e.status,
    leadStatus: r.leadStatus,
  }))
  ), [rows]);

  const updateEmailStatus = async (emailId: string, status: EmailStatus) => {
    await fetch(`/api/emails/${emailId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    await load();
  };

  return (
    <div className="h-screen w-full mx-auto p-15 bg-gray-900">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold">Email Dashboard</h1>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading} className="px-3 py-1 text-sm bg-green-800 rounded-md disabled:opacity-50">
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button onClick={scrapeAll} className="px-3 py-1 bg-blue-600 text-sm rounded-md">
            Scrape All Not-Scraped
          </button>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-800">
            <th className="p-2 border text-left">Business</th>
            <th className="p-2 border text-left">Website</th>
            <th className="p-2 border text-left">Extracted Emails</th>
            <th className="p-2 border text-left">Email Status</th>
            <th className="p-2 border text-left">Lead Status</th>
            <th className="p-2 border text-left">Scraped</th>
            <th className="p-2 border text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const emailsCsv = r.emails.map(e => e.address).join(', ');
            const firstEmail = r.emails[0];
            return (
              <tr key={r.businessId}>
                <td className="p-2 border">{r.businessName}</td>
                <td className="p-2 border">
                  {r.website ? (
                    <a href={r.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Visit</a>
                  ) : (
                    <span className="text-gray-500">No website</span>
                  )}
                </td>
                <td className="p-2 border truncate" title={emailsCsv}>{emailsCsv || <span className="text-gray-500">None</span>}</td>
                <td className="p-2 border">
                  {firstEmail ? (
                    <select value={firstEmail.status} onChange={(ev) => updateEmailStatus(firstEmail.id, ev.target.value as EmailStatus)} className="border rounded px-2 py-1 text-sm">
                      <option value="NEW" className="text-gray-200 bg-gray-900">NEW</option>
                      <option value="VERIFIED" className="text-gray-200 bg-gray-900">VERIFIED</option>
                      <option value="INVALID" className="text-gray-200 bg-gray-900">INVALID</option>
                      <option value="BOUNCED" className="text-gray-200 bg-gray-900">BOUNCED</option>
                      <option value="UNSUBSCRIBED" className="text-gray-200 bg-gray-900">UNSUBSCRIBED</option>
                    </select>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
                <td className="p-2 border">
                  <span className="px-2 py-0.5 text-xs rounded bg-gray-800">{r.leadStatus || '—'}</span>
                </td>
                <td className="p-2 border">
                  <span className={`px-2 py-0.5 text-xs rounded ${r.isScraped ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-300'}`}>{r.isScraped ? 'Yes' : 'No'}</span>
                </td>
                <td className="p-2 border">
                  <div className="flex gap-2">
                    <button onClick={() => scrapeBusiness(r.businessId)} disabled={scraping[r.businessId] || r.isScraped} className="px-2 py-1 text-xs border rounded disabled:opacity-50">
                      {scraping[r.businessId] ? 'Scraping…' : 'Scrape'}
                    </button>
                    <button onClick={() => scrapeBusiness(r.businessId, { force: true })} disabled={scraping[r.businessId]} className="px-2 py-1 text-xs border rounded disabled:opacity-50">
                      {scraping[r.businessId] ? 'Re-scraping…' : 'Re-scrape'}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td className="p-4 border text-center text-gray-500" colSpan={7}>No data yet</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

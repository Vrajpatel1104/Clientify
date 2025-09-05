"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { LeadStatus, EmailStatus, Lead } from "@/types";

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


  const updateEmailStatus = async (emailId: string, status: EmailStatus) => {
    await fetch(`/api/emails/${emailId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    await load();
  };


  const removeBusiness = async (businessId: string) => {
    if (!confirm('Are you sure you want to delete this business and all its data? This action cannot be undone.')) return;
    try {
      await fetch(`/api/businesses/${businessId}`, { method: 'DELETE' });
      await load();
    } catch (error) {
      console.error('Failed to delete business:', error);
      alert('Failed to delete business');
    }
  };

  const addToLeads = async (businessId: string) => {
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId })
      });
      if (res.ok) {
        alert('Business added to leads successfully!');
        await load(); // Refresh to update lead status
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to add to leads');
      }
    } catch (error) {
      console.error('Failed to add to leads:', error);
      alert('Failed to add to leads');
    }
  };

  const updateLeadStatus = async (businessId: string, status: LeadStatus) => {
    try {
      // First get the lead ID for this business
      const leadsRes = await fetch('/api/leads');
      const leads = await leadsRes.json();
      const lead = leads.find((l: Lead) => l.businessId === businessId);
      
      if (!lead) {
        alert('No lead found for this business');
        return;
      }

      await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      await load();
    } catch (error) {
      console.error('Failed to update lead status:', error);
      alert('Failed to update lead status');
    }
  };

  return (
    <div className="min-h-screen w-full mx-auto p-4 sm:p-6 lg:p-8 bg-gray-900">
      {/* Header Section - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white">Email Dashboard</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <button 
            onClick={load} 
            disabled={loading} 
            className="px-3 py-2 text-sm bg-green-800 hover:bg-green-700 rounded-md disabled:opacity-50 transition-colors"
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button 
            onClick={scrapeAll} 
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-sm rounded-md transition-colors"
          >
            Scrape All Not-Scraped
          </button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800">
                          <th className="p-3 border border-gray-700 text-left">Business</th>
            <th className="p-3 border border-gray-700 text-left">Website</th>
            <th className="p-3 border border-gray-700 text-left">Extracted Emails</th>
            <th className="p-3 border border-gray-700 text-left">Email Status</th>
            <th className="p-3 border border-gray-700 text-left">Lead Status</th>
            <th className="p-3 border border-gray-700 text-left">Scraped</th>
            <th className="p-3 border border-gray-700 text-left">Lead Actions</th>
            <th className="p-3 border border-gray-700 text-left">Manage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const emailsCsv = r.emails.map(e => e.address).join(', ');
              const firstEmail = r.emails[0];
              return (
                <tr key={r.businessId} className="hover:bg-gray-800/50">
                  <td className="p-3 border border-gray-700 text-white">{r.businessName}</td>
                  <td className="p-3 border border-gray-700">
                    {r.website ? (
                      <a href={r.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                        Visit
                      </a>
                    ) : (
                      <span className="text-gray-500">No website</span>
                    )}
                  </td>
                  <td className="p-3 border border-gray-700 truncate max-w-xs" title={emailsCsv}>
                    {emailsCsv || <span className="text-gray-500">None</span>}
                  </td>
                  <td className="p-3 border border-gray-700">
                    {firstEmail ? (
                      <select 
                        value={firstEmail.status} 
                        onChange={(ev) => updateEmailStatus(firstEmail.id, ev.target.value as EmailStatus)} 
                        className="border border-gray-600 rounded px-2 py-1 text-sm bg-gray-800 text-white"
                      >
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
                  <td className="p-3 border border-gray-700">
                    <span className="px-2 py-1 text-xs rounded bg-gray-800 text-gray-300">
                      {r.leadStatus || '—'}
                    </span>
                  </td>
                  <td className="p-3 border border-gray-700">
                    <span className={`px-2 py-1 text-xs rounded ${r.isScraped ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-300'}`}>
                      {r.isScraped ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="p-3 border border-gray-700">
                    <div className="flex flex-col gap-2">
                      {!r.leadStatus ? (
                        <button 
                          onClick={() => addToLeads(r.businessId)} 
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Add to Leads
                        </button>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <select 
                            value={r.leadStatus} 
                            onChange={(ev) => updateLeadStatus(r.businessId, ev.target.value as LeadStatus)} 
                            className="border border-gray-600 rounded px-2 py-1 text-xs bg-gray-800 text-white"
                          >
                            <option value="NEW" className="text-gray-200 bg-gray-900">NEW</option>
                            <option value="CONTACTED" className="text-gray-200 bg-gray-900">CONTACTED</option>
                            <option value="REPLIED" className="text-gray-200 bg-gray-900">REPLIED</option>
                            <option value="CLOSED" className="text-gray-200 bg-gray-900">CLOSED</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3 border border-gray-700">
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-1">
                        <button 
                          onClick={() => scrapeBusiness(r.businessId)} 
                          disabled={scraping[r.businessId] || r.isScraped} 
                          className="px-2 py-1 text-xs border border-gray-600 rounded disabled:opacity-50 hover:bg-gray-700 transition-colors"
                        >
                          {scraping[r.businessId] ? 'Scraping…' : 'Scrape'}
                        </button>
                        <button 
                          onClick={() => scrapeBusiness(r.businessId, { force: true })} 
                          disabled={scraping[r.businessId]} 
                          className="px-2 py-1 text-xs border border-gray-600 rounded disabled:opacity-50 hover:bg-gray-700 transition-colors"
                        >
                          {scraping[r.businessId] ? 'Re-scraping…' : 'Re-scrape'}
                        </button>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => removeBusiness(r.businessId)}
                          className="px-2 py-1 text-xs bg-red-800 text-white rounded hover:bg-red-900 transition-colors"
                          title="Delete entire business"
                        >
                          🗑️ Business
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td className="p-4 border border-gray-700 text-center text-gray-500" colSpan={8}>No data yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden space-y-4">
        {rows.length === 0 ? (
          <div className="p-6 text-center text-gray-500 bg-gray-800 rounded-lg">
            No data yet
          </div>
        ) : (
          rows.map((r) => {
            const emailsCsv = r.emails.map(e => e.address).join(', ');
            const firstEmail = r.emails[0];
            return (
              <div key={r.businessId} className="bg-gray-800 rounded-lg p-4 space-y-3">
                {/* Business Name */}
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-white">{r.businessName}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => removeBusiness(r.businessId)}
                      className="px-2 py-1 text-xs bg-red-800 text-white rounded hover:bg-red-900 transition-colors"
                      title="Delete entire business"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Website */}
                <div>
                  <span className="text-sm text-gray-400">Website: </span>
                  {r.website ? (
                    <a href={r.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                      Visit
                    </a>
                  ) : (
                    <span className="text-gray-500">No website</span>
                  )}
                </div>

                {/* Emails */}
                <div>
                  <span className="text-sm text-gray-400">Emails: </span>
                  <span className="text-white break-all" title={emailsCsv}>
                    {emailsCsv || <span className="text-gray-500">None</span>}
                  </span>
                </div>

                {/* Email Status */}
                <div>
                  <span className="text-sm text-gray-400">Email Status: </span>
                  {firstEmail ? (
                    <select 
                      value={firstEmail.status} 
                      onChange={(ev) => updateEmailStatus(firstEmail.id, ev.target.value as EmailStatus)} 
                      className="border border-gray-600 rounded px-2 py-1 text-sm bg-gray-700 text-white ml-2"
                    >
                      <option value="NEW" className="text-gray-200 bg-gray-900">NEW</option>
                      <option value="VERIFIED" className="text-gray-200 bg-gray-900">VERIFIED</option>
                      <option value="INVALID" className="text-gray-200 bg-gray-900">INVALID</option>
                      <option value="BOUNCED" className="text-gray-200 bg-gray-900">BOUNCED</option>
                      <option value="UNSUBSCRIBED" className="text-gray-200 bg-gray-900">UNSUBSCRIBED</option>
                    </select>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </div>

                {/* Lead Management */}
                <div>
                  <span className="text-sm text-gray-400">Lead Status: </span>
                  {!r.leadStatus ? (
                    <button 
                      onClick={() => addToLeads(r.businessId)} 
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Add to Leads
                    </button>
                  ) : (
                    <select 
                      value={r.leadStatus} 
                      onChange={(ev) => updateLeadStatus(r.businessId, ev.target.value as LeadStatus)} 
                      className="border border-gray-600 rounded px-2 py-1 text-xs bg-gray-700 text-white ml-2"
                    >
                      <option value="NEW" className="text-gray-200 bg-gray-900">NEW</option>
                      <option value="CONTACTED" className="text-gray-200 bg-gray-900">CONTACTED</option>
                      <option value="REPLIED" className="text-gray-200 bg-gray-900">REPLIED</option>
                      <option value="CLOSED" className="text-gray-200 bg-gray-900">CLOSED</option>
                    </select>
                  )}
                </div>

                {/* Email Management */}
                <div>
                  <span className="text-sm text-gray-400">Email Management: </span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {r.emails.map((email) => (
                      <div key={email.id} className="flex items-center gap-1 bg-gray-700 rounded px-2 py-1">
                        <span className="text-xs text-white">{email.address}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                    Lead: {r.leadStatus || '—'}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded ${r.isScraped ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'}`}>
                    Scraped: {r.isScraped ? 'Yes' : 'No'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => scrapeBusiness(r.businessId)} 
                    disabled={scraping[r.businessId] || r.isScraped} 
                    className="px-2 py-1 text-xs border border-gray-600 rounded disabled:opacity-50 hover:bg-gray-700 transition-colors"
                  >
                    {scraping[r.businessId] ? 'Scraping…' : 'Scrape'}
                  </button>
                  <button 
                    onClick={() => scrapeBusiness(r.businessId, { force: true })} 
                    disabled={scraping[r.businessId]} 
                    className="px-2 py-1 text-xs border border-gray-600 rounded disabled:opacity-50 hover:bg-gray-700 transition-colors"
                  >
                    {scraping[r.businessId] ? 'Re-scraping…' : 'Re-scrape'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

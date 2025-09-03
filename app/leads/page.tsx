"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type LeadStatus = "NEW" | "CONTACTED" | "REPLIED" | "CLOSED";

interface Business {
  id: string;
  name: string;
  category: string;
  location: string;
  phone?: string;
  website?: string;
  email?: string;
}

interface Lead {
  id: string;
  businessId: string;
  business: Business;
  status: LeadStatus;
  emailSent: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState<{ [key: string]: boolean }>({});
  const [updatingStatus, setUpdatingStatus] = useState<{ [key: string]: boolean }>({});
  const [editingNotes, setEditingNotes] = useState<{ [key: string]: boolean }>({});
  const [notes, setNotes] = useState<{ [key: string]: string }>({});
  const [filterStatus, setFilterStatus] = useState<LeadStatus | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<"createdAt" | "updatedAt" | "status">("createdAt");
  // Scrape per-business (display handled in Emails dashboard)
  const [scrapingEmails, setScrapingEmails] = useState<Record<string, boolean>>({});

  const fetchLeads = async () => {
    try {
      const res = await fetch("/api/leads");
      const data = await res.json();
      setLeads(data);
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // loadEmailsForBusiness removed

  // scrapeEmailsForBusiness removed from Leads dashboard
  const scrapeEmailsForBusiness = async (businessId: string, website?: string) => {
    if (!website) {
      alert('No website for this business');
      return;
    }
    setScrapingEmails(prev => ({ ...prev, [businessId]: true }));
    try {
      const res = await fetch(`/api/businesses/${businessId}/scrape-emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: false }),
      });
      if (!res.ok) throw new Error('Scrape failed');
      const data = await res.json();
      const count = typeof data?.count === 'number' ? data.count : 0;
      alert(count > 0 ? `Scraped ${count} emails` : 'No new emails found');
    } catch (e) {
      console.error('Failed to scrape emails', e);
      alert('Failed to scrape emails');
    } finally {
      setScrapingEmails(prev => ({ ...prev, [businessId]: false }));
    }
  };

  // toggleEmailSelection removed

  // sendSelectedEmails removed

  const updateLeadStatus = async (leadId: string, newStatus: LeadStatus) => {
    setUpdatingStatus(prev => ({ ...prev, [leadId]: true }));
    
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error('Failed to update lead status');
      }

      // Refresh leads
      await fetchLeads();
    } catch (error) {
      console.error('Error updating lead status:', error);
      alert('Failed to update lead status. Please try again.');
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [leadId]: false }));
    }
  };

  const sendEmail = async (lead: Lead) => {
    if (!lead.business.email) {
      alert('Cannot send email: No email address available for this business');
      return;
    }

    setSendingEmail(prev => ({ ...prev, [lead.id]: true }));
    
    try {
      const res = await fetch('/api/mail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: lead.business.email,
          businessName: lead.business.name,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to send email');
      }

      // Update lead to mark email as sent
      await updateLeadStatus(lead.id, 'CONTACTED');
      alert('Email sent successfully!');
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setSendingEmail(prev => ({ ...prev, [lead.id]: false }));
    }
  };

  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case 'NEW': return 'bg-gray-100 text-gray-800';
      case 'CONTACTED': return 'bg-blue-100 text-blue-800';
      case 'REPLIED': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusOptions = (currentStatus: LeadStatus): LeadStatus[] => {
    const allStatuses: LeadStatus[] = ['NEW', 'CONTACTED', 'REPLIED', 'CLOSED'];
    return allStatuses.filter(status => status !== currentStatus);
  };

  const updateNotes = async (leadId: string, newNotes: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: newNotes }),
      });

      if (!res.ok) {
        throw new Error('Failed to update notes');
      }

      // Refresh leads
      await fetchLeads();
      setEditingNotes(prev => ({ ...prev, [leadId]: false }));
    } catch (error) {
      console.error('Error updating notes:', error);
      alert('Failed to update notes. Please try again.');
    }
  };

  const startEditingNotes = (leadId: string, currentNotes?: string) => {
    setEditingNotes(prev => ({ ...prev, [leadId]: true }));
    setNotes(prev => ({ ...prev, [leadId]: currentNotes || '' }));
  };

  const cancelEditingNotes = (leadId: string) => {
    setEditingNotes(prev => ({ ...prev, [leadId]: false }));
    setNotes(prev => ({ ...prev, [leadId]: '' }));
  };

  const getStatusIcon = (status: LeadStatus) => {
    switch (status) {
      case 'NEW': return '🆕';
      case 'CONTACTED': return '📞';
      case 'REPLIED': return '💬';
      case 'CLOSED': return '✅';
      default: return '📋';
    }
  };



  // Filter and sort leads
  const filteredAndSortedLeads = leads
    .filter(lead => filterStatus === "ALL" || lead.status === filterStatus)
    .sort((a, b) => {
      switch (sortBy) {
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'updatedAt':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'status':
          const statusOrder = { 'NEW': 0, 'CONTACTED': 1, 'REPLIED': 2, 'CLOSED': 3 };
          return statusOrder[a.status] - statusOrder[b.status];
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <main className="min-h-screen w-full bg-gray-900 mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-400">Loading leads...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-gray-900 mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6 w-full">
        <h1 className="text-2xl font-bold text-center text-gray-200 mb-2">Leads Dashboard</h1>
        <p className="text-gray-400 text-center">Manage your business leads and track outreach progress</p>
        
        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-200">{leads.length}</div>
            <div className="text-sm text-gray-400">Total Leads</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{leads.filter(l => l.status === 'NEW').length}</div>
            <div className="text-sm text-gray-400">New</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{leads.filter(l => l.status === 'REPLIED').length}</div>
            <div className="text-sm text-gray-400">Replied</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-400">{leads.filter(l => l.status === 'CLOSED').length}</div>
            <div className="text-sm text-gray-400">Closed</div>
          </div>
        </div>

        {/* Filters and Sorting */}
        {leads.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-4 justify-center items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400">Filter:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as LeadStatus | "ALL")}
                className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-gray-200 text-sm"
              >
                <option value="ALL">All Statuses</option>
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="REPLIED">Replied</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "createdAt" | "updatedAt" | "status")}
                className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-gray-200 text-sm"
              >
                <option value="createdAt">Date Created</option>
                <option value="updatedAt">Last Updated</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {leads.length === 0 ? (
        <div className="text-center py-8">
          {/* <div className="text-gray-400 text-4xl mb-3">📊</div> */}
          <h2 className="text-xl font-semibold text-gray-200 mb-2">No leads yet</h2>
          <p className="text-gray-400 mb-4">Start by searching for businesses and adding them to your leads list.</p>
          <Link
            href="/"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
          >
            Search for Businesses
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedLeads.map((lead) => (
            <div key={lead.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-200 mb-2">{lead.business.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-400">
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-1">📍</span>
                      <span>{lead.business.location}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-1">🏷️</span>
                      <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
                        {lead.business.category}
                      </span>
                    </div>
                    {lead.business.phone && (
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-1">📞</span>
                        <span>{lead.business.phone}</span>
                      </div>
                    )}
                    {lead.business.website && (
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-1">🌐</span>
                        <a 
                          href={lead.business.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 hover:underline"
                        >
                          View Site
                        </a>
                      </div>
                    )}
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-1">📧</span>
                      <span className="text-gray-300">
                        {lead.business.email || 'No email available'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="ml-3 flex flex-col items-end space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getStatusIcon(lead.status)}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                      {lead.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    <div>Created: {new Date(lead.createdAt).toLocaleDateString()}</div>
                    {lead.updatedAt !== lead.createdAt && (
                      <div>Updated: {new Date(lead.updatedAt).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div className="mt-3 mb-3">
                {editingNotes[lead.id] ? (
                  <div className="space-y-2">
                    <textarea
                      value={notes[lead.id] || ''}
                      onChange={(e) => setNotes(prev => ({ ...prev, [lead.id]: e.target.value }))}
                      placeholder="Add notes about this lead..."
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-200 text-sm resize-none"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateNotes(lead.id, notes[lead.id] || '')}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => cancelEditingNotes(lead.id)}
                        className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {lead.notes ? (
                        <div className="bg-gray-700 rounded px-3 py-2 text-sm text-gray-300">
                          <div className="flex items-start gap-2">
                            <span className="text-gray-500 mt-0.5">📝</span>
                            <span>{lead.notes}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 italic">No notes added yet</div>
                      )}
                    </div>
                    <button
                      onClick={() => startEditingNotes(lead.id, lead.notes)}
                      className="ml-2 px-2 py-1 text-xs text-gray-400 hover:text-gray-200 border border-gray-600 rounded hover:bg-gray-700"
                    >
                      {lead.notes ? 'Edit' : 'Add Notes'}
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {getStatusOptions(lead.status).map((status) => (
                  <button
                    key={status}
                    onClick={() => updateLeadStatus(lead.id, status)}
                    disabled={updatingStatus[lead.id]}
                    className="px-3 py-1 text-xs border border-gray-600 rounded hover:bg-gray-700 disabled:opacity-50 text-gray-300 transition-colors"
                  >
                    {updatingStatus[lead.id] ? 'Updating...' : `Mark as ${status}`}
                  </button>
                ))}
                
                {lead.business.email && !lead.emailSent && (
                  <button
                    onClick={() => sendEmail(lead)}
                    disabled={sendingEmail[lead.id]}
                    className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {sendingEmail[lead.id] ? 'Sending...' : 'Send Email'}
                  </button>
                )}
                
                {lead.emailSent && (
                  <span className="px-3 py-1 text-xs bg-green-900 text-green-300 rounded flex items-center gap-1">
                    <span>✅</span>
                    Email Sent
                  </span>
                )}
              </div>

              {/* Quick action: scrape emails for this business */}
              <div className="mt-3">
                <button
                  onClick={() => scrapeEmailsForBusiness(lead.business.id, lead.business.website)}
                  disabled={scrapingEmails[lead.business.id] || !lead.business.website}
                  className="px-3 py-1 text-xs border border-gray-600 rounded hover:bg-gray-700 disabled:opacity-50 text-gray-300"
                >
                  {scrapingEmails[lead.business.id] ? 'Scraping…' : 'Scrape Emails'}
                </button>
                {!lead.business.website && (
                  <span className="ml-2 text-xs text-gray-500">No website provided</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

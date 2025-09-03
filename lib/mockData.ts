// Shared mock data storage for development
// In production, this would be replaced with a real database

export interface Business {
  id: string;
  name: string;
  category: string;
  location: string;
  phone?: string;
  website?: string;
  addedAt: string;
}

export interface Lead {
  id: string;
  businessId: string;
  status: 'NEW' | 'CONTACTED' | 'REPLIED' | 'CLOSED';
  emailSent: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory storage (resets on server restart)
const businesses: Business[] = [];
const leads: Lead[] = [];

export const mockData = {
  // Business operations
  addBusiness: (business: Business): Business => {
    const existingIndex = businesses.findIndex(b => b.id === business.id);
    if (existingIndex >= 0) {
      businesses[existingIndex] = business;
    } else {
      businesses.push(business);
    }
    return business;
  },

  getBusiness: (id: string): Business | undefined => {
    return businesses.find(b => b.id === id);
  },

  getAllBusinesses: (): Business[] => {
    return businesses;
  },

  // Lead operations
  addLead: (lead: Lead): Lead => {
    const existingIndex = leads.findIndex(l => l.id === lead.id);
    if (existingIndex >= 0) {
      leads[existingIndex] = lead;
    } else {
      leads.push(lead);
    }
    return lead;
  },

  getLead: (id: string): Lead | undefined => {
    return leads.find(l => l.id === id);
  },

  getAllLeads: (): Lead[] => {
    return leads;
  },

  updateLead: (id: string, updates: Partial<Lead>): Lead | undefined => {
    const index = leads.findIndex(l => l.id === id);
    if (index >= 0) {
      leads[index] = { ...leads[index], ...updates, updatedAt: new Date().toISOString() };
      return leads[index];
    }
    return undefined;
  },

  deleteLead: (id: string): boolean => {
    const index = leads.findIndex(l => l.id === id);
    if (index >= 0) {
      leads.splice(index, 1);
      return true;
    }
    return false;
  },

  // Check if lead already exists for a business
  getLeadByBusinessId: (businessId: string): Lead | undefined => {
    return leads.find(l => l.businessId === businessId);
  }
};

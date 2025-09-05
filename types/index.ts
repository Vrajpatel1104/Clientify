// Shared type definitions for the entire application

export type LeadStatus = "NEW" | "CONTACTED" | "REPLIED" | "CLOSED";
export type EmailStatus = "NEW" | "VERIFIED" | "INVALID" | "BOUNCED" | "UNSUBSCRIBED";
export type MailStatus = "DRAFT" | "SENT" | "OPENED" | "CLICKED" | "BOUNCED" | "ERROR";

// Business related types
export interface Business {
  id: string;
  name: string;
  category: string;
  location: string;
  phone?: string;
  website?: string;
  email?: string;
  isScraped: boolean;
  addedAt: string;
}

export interface BusinessResult {
  title: string;
  address: string;
  phone?: string;
  website?: string;
  email?: string;
  type?: string;
}

// Lead related types
export interface Lead {
  id: string;
  businessId: string;
  business: Business;
  status: LeadStatus;
  emailSent: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Email related types
export interface Email {
  id: string;
  address: string;
  status: EmailStatus;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt?: string;
  lastClickedAt?: string;
  unsubscribeAt?: string;
}

// Dashboard row type for emails page
export interface DashboardRow {
  businessId: string;
  businessName: string;
  website?: string | null;
  isScraped: boolean;
  emails: { id: string; address: string; status: EmailStatus }[];
  leadStatus?: LeadStatus | null;
}

// API Response types
export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Search related types
export interface SearchFilters {
  category: string;
  location: string;
}

export interface RecentSearch {
  category: string;
  location: string;
}

// UI State types
export interface LoadingState {
  [key: string]: boolean;
}

export interface ErrorState {
  [key: string]: string | null;
}

// Form types
export interface BusinessFormData {
  name: string;
  category: string;
  location: string;
  phone?: string;
  website?: string;
  email?: string;
}

export interface LeadFormData {
  businessId: string;
  status?: LeadStatus;
  notes?: string;
  emailSent?: boolean;
}

// Constants
export const LEAD_STATUS_OPTIONS: LeadStatus[] = ["NEW", "CONTACTED", "REPLIED", "CLOSED"];
export const EMAIL_STATUS_OPTIONS: EmailStatus[] = ["NEW", "VERIFIED", "INVALID", "BOUNCED", "UNSUBSCRIBED"];

// Status colors for UI
export const STATUS_COLORS = {
  lead: {
    NEW: "bg-gray-100 text-gray-800",
    CONTACTED: "bg-blue-100 text-blue-800",
    REPLIED: "bg-green-100 text-green-800",
    CLOSED: "bg-red-100 text-red-800",
  },
  email: {
    NEW: "bg-gray-100 text-gray-800",
    VERIFIED: "bg-green-100 text-green-800",
    INVALID: "bg-red-100 text-red-800",
    BOUNCED: "bg-orange-100 text-orange-800",
    UNSUBSCRIBED: "bg-purple-100 text-purple-800",
  },
} as const;

// Status icons for UI
export const STATUS_ICONS = {
  lead: {
    NEW: "🆕",
    CONTACTED: "📞",
    REPLIED: "💬",
    CLOSED: "✅",
  },
} as const;

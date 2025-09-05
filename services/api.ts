import { ApiResponse, Business, Lead, DashboardRow, BusinessFormData, LeadFormData } from '@/types';

const API_BASE = '/api';

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
        };
      }
      
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Business endpoints
  async searchBusinesses(category: string, location: string) {
    return this.request<Business[]>(`/businesses?category=${encodeURIComponent(category)}&location=${encodeURIComponent(location)}`);
  }

  async createBusiness(business: BusinessFormData) {
    return this.request<Business>('/businesses', {
      method: 'POST',
      body: JSON.stringify(business),
    });
  }

  async deleteBusiness(id: string) {
    return this.request(`/businesses/${id}`, {
      method: 'DELETE',
    });
  }

  // Lead endpoints
  async getLeads() {
    return this.request<Lead[]>('/leads');
  }

  async createLead(lead: LeadFormData) {
    return this.request<Lead>('/leads', {
      method: 'POST',
      body: JSON.stringify(lead),
    });
  }

  async updateLead(id: string, updates: Partial<LeadFormData>) {
    return this.request<Lead>(`/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteLead(id: string) {
    return this.request(`/leads/${id}`, {
      method: 'DELETE',
    });
  }

  // Email endpoints
  async getEmails() {
    return this.request<DashboardRow[]>('/emails');
  }

  async updateEmailStatus(id: string, status: string) {
    return this.request(`/emails/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteEmail(id: string) {
    return this.request(`/emails/${id}`, {
      method: 'DELETE',
    });
  }

  // Scraping endpoints
  async scrapeEmails(businessId: string, force = false) {
    return this.request('/scrape-emails', {
      method: 'POST',
      body: JSON.stringify({ businessId, force }),
    });
  }

  async scrapeBusinessEmails(businessId: string, force = false) {
    return this.request(`/businesses/${businessId}/scrape-emails`, {
      method: 'POST',
      body: JSON.stringify({ force }),
    });
  }

  // Mail endpoints
  async sendEmail(to: string, businessName: string) {
    return this.request('/mail', {
      method: 'POST',
      body: JSON.stringify({ to, businessName }),
    });
  }
}

export const apiService = new ApiService();

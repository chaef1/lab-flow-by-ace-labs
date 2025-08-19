import { supabase } from '@/integrations/supabase/client';

export interface ModashSearchFilters {
  followers?: { min?: number; max?: number };
  engagementRate?: { min?: number; max?: number };
  location?: Array<{ id: string }>;
  language?: string[];
  interests?: Array<{ id: string | number }>;
  hashtags?: string[];
  keywords?: string;
  audience?: {
    age?: Array<{ from: number; to: number; weight: number }>;
    gender?: { female?: number; male?: number };
  };
  isVerified?: boolean;
  hasContactDetails?: boolean;
  accountType?: string;
  contentThemes?: string[];
}

export interface ModashSearchPayload {
  page?: number;
  limit?: number;
  sort?: { field: string; direction: 'asc' | 'desc' };
  filter?: ModashSearchFilters;
}

export interface ModashCreator {
  userId: string;
  username: string;
  fullName?: string;
  profilePicUrl?: string;
  followers?: number;
  engagementRate?: number;
  avgLikes?: number;
  avgViews?: number;
  isVerified?: boolean;
  hasContactDetails?: boolean;
  topAudience?: {
    country?: string;
    city?: string;
  };
  platform: string;
  report?: any;
}

export interface ModashSearchResponse {
  results: ModashCreator[];
  total: number;
  page: number;
  source: string;
}

export interface DictionaryEntry {
  id: string | number;
  name: string;
  type?: string;
}

class ModashClient {
  private baseUrl = 'https://qmrgnlschrtfvenarovh.supabase.co/functions/v1';

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Modash API Error: ${error}`);
    }

    return response.json();
  }

  // Discovery Search endpoints
  async searchInstagram(payload: ModashSearchPayload): Promise<ModashSearchResponse> {
    return this.makeRequest('/modash-discovery-search', {
      method: 'POST',
      body: JSON.stringify({ platform: 'instagram', ...payload }),
    });
  }

  async searchTikTok(payload: ModashSearchPayload): Promise<ModashSearchResponse> {
    return this.makeRequest('/modash-discovery-search', {
      method: 'POST',
      body: JSON.stringify({ platform: 'tiktok', ...payload }),
    });
  }

  async searchYouTube(payload: ModashSearchPayload): Promise<ModashSearchResponse> {
    return this.makeRequest('/modash-discovery-search', {
      method: 'POST',
      body: JSON.stringify({ platform: 'youtube', ...payload }),
    });
  }

  // Creator Report endpoints
  async getCreatorReport(platform: string, userId: string): Promise<any> {
    return this.makeRequest(`/modash-creator-report?platform=${platform}&userId=${userId}`);
  }

  async getPerformanceData(platform: string, userId: string, params?: any): Promise<any> {
    const query = new URLSearchParams(params).toString();
    return this.makeRequest(`/modash-performance-data?platform=${platform}&userId=${userId}&${query}`);
  }

  // Dictionary endpoints for filters
  async getInterests(platform: string, query?: string): Promise<DictionaryEntry[]> {
    return this.makeRequest('/modash-dictionaries', {
      method: 'POST',
      body: JSON.stringify({ 
        kind: 'interest', 
        query: query || '', 
        limit: 50 
      }),
    });
  }

  async getLocations(platform: string, query?: string): Promise<DictionaryEntry[]> {
    return this.makeRequest('/modash-dictionaries', {
      method: 'POST',
      body: JSON.stringify({ 
        kind: 'location', 
        query: query || '', 
        limit: 50 
      }),
    });
  }

  async getLanguages(platform: string, query?: string): Promise<DictionaryEntry[]> {
    return this.makeRequest('/modash-dictionaries', {
      method: 'POST',
      body: JSON.stringify({ 
        kind: 'language', 
        query: query || '', 
        limit: 100 
      }),
    });
  }

  async getBrands(platform: string, query?: string): Promise<DictionaryEntry[]> {
    return this.makeRequest('/modash-dictionaries', {
      method: 'POST',
      body: JSON.stringify({ 
        kind: 'brand', 
        query: query || '', 
        limit: 50 
      }),
    });
  }

  // Text search for suggestions
  async searchText(platform: string, query: string, limit = 8): Promise<ModashCreator[]> {
    const response = await this.makeRequest<{ suggestions: ModashCreator[] }>('/modash-text-search', {
      method: 'POST',
      body: JSON.stringify({ platform, query, limit }),
    });
    return response.suggestions || [];
  }

  // Email search
  async searchByEmail(emails: string[]): Promise<ModashCreator[]> {
    return this.makeRequest('/modash-email-search', {
      method: 'POST',
      body: JSON.stringify({ emails }),
    });
  }

  // RAW API endpoints for live data
  async getUserFeed(platform: string, url: string, limit = 12): Promise<any> {
    return this.makeRequest(`/modash-raw-feed?platform=${platform}&url=${encodeURIComponent(url)}&limit=${limit}`);
  }

  // Collaborations API
  async getCollaborationPosts(filters: any): Promise<any> {
    return this.makeRequest('/modash-collaborations', {
      method: 'POST',
      body: JSON.stringify({ type: 'posts', ...filters }),
    });
  }

  async getCollaborationSummary(filters: any): Promise<any> {
    return this.makeRequest('/modash-collaborations', {
      method: 'POST',
      body: JSON.stringify({ type: 'summary', ...filters }),
    });
  }
}

export const modashClient = new ModashClient();
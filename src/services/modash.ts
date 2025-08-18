// Modash API client service
export interface ModashUserInfo {
  credits: {
    remaining: number;
    total: number;
  };
  plan: string;
  limits: {
    searches_per_hour: number;
    reports_per_hour: number;
  };
}

export interface ModashHealth {
  status: 'healthy' | 'degraded' | 'down';
  message?: string;
}

export interface DictionaryEntry {
  id: string;
  name: string;
  type?: string;
}

export interface ModashSearchPayload {
  pagination: {
    page: number;
  };
  sort: {
    field: 'relevance' | 'followers' | 'engagement_rate' | 'avg_views';
    order: 'asc' | 'desc';
  };
  filters: {
    influencer: {
      followersMin?: number;
      followersMax?: number;
      hasContactDetails?: boolean;
      isVerified?: boolean;
      postedWithinDays?: number;
      keywords?: string[];
      hashtags?: string[];
      mentions?: string[];
      brands?: string[];
      interests?: string[];
    };
    audience?: {
      age?: Array<{ range: string; minPercent: number }>;
      gender?: { femaleMinPercent?: number; maleMinPercent?: number };
      countries?: Array<{ id: string; minPercent: number }>;
      cities?: Array<{ id: string; minPercent: number }>;
      languages?: Array<{ id: string; minPercent: number }>;
      interests?: Array<{ id: string; minPercent: number }>;
      weights?: {
        gender?: number;
        age?: number;
        interests?: number;
        location?: number;
        language?: number;
      };
    };
  };
}

export interface CreatorResult {
  platform: 'instagram' | 'tiktok' | 'youtube';
  userId: string;
  username: string;
  fullName: string;
  profilePicUrl: string;
  followers: number;
  engagementRate: number;
  avgLikes: number;
  avgViews: number;
  isVerified: boolean;
  topAudience: {
    country?: string;
    city?: string;
  };
  matchBadges: string[];
  hasContactDetails: boolean;
}

export interface SearchResponse {
  page: number;
  pageSize: number;
  total: number;
  results: CreatorResult[];
  lookalikes: CreatorResult[];
  meta: {
    exactMatch: boolean;
    estimatedCredits: number;
  };
}

export interface ModashError {
  code: string;
  message: string;
  retryAfter?: number;
}

class ModashClient {
  private baseURL = 'https://api.modash.io/v1';
  private maxRetries = 3;
  private baseDelay = 1000; // 1 second

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter 
            ? parseInt(retryAfter) * 1000 
            : this.baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
          
          if (attempt < this.maxRetries) {
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          throw new Error(`Rate limited: Retry after ${delay}ms`);
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        if (attempt === this.maxRetries) {
          throw error;
        }
        
        const delay = this.baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('Max retries exceeded');
  }

  async getUserInfo(token: string): Promise<ModashUserInfo> {
    return this.makeRequest<ModashUserInfo>('/user/info', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async getHealth(): Promise<ModashHealth> {
    return this.makeRequest<ModashHealth>('/health');
  }

  async getDictionary(
    token: string,
    kind: 'location' | 'interest' | 'brand' | 'language',
    options: { query?: string; limit?: number } = {}
  ): Promise<DictionaryEntry[]> {
    const params = new URLSearchParams();
    if (options.query) params.set('query', options.query);
    if (options.limit) params.set('limit', options.limit.toString());
    
    const queryString = params.toString();
    const endpoint = `/dictionary/${kind}${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest<DictionaryEntry[]>(endpoint, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async searchInstagram(
    token: string,
    payload: ModashSearchPayload
  ): Promise<any> {
    return this.makeRequest<any>('/instagram/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  }

  // Stub for Phase 2
  async getInstagramReport(token: string, userId: string): Promise<any> {
    return this.makeRequest<any>(`/instagram/report/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }
}

export const modashClient = new ModashClient();
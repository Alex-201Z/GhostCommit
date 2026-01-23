import axios, { AxiosInstance } from 'axios';
import { ConfigManager } from '../utils/config';

export interface ActivitySessionData {
  startTime: string;
  endTime?: string;
  durationMs?: number;
  filesModified?: string[];
  linesAdded?: number;
  linesDeleted?: number;
  commitCount?: number;
  metadata?: Record<string, any>;
  repoId?: string;
}

export class ApiClient {
  private client: AxiosInstance;
  private config: ConfigManager;

  constructor(config: ConfigManager) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.get().apiUrl,
      timeout: 30000,
    });

    // Add auth interceptor
    this.client.interceptors.request.use((config) => {
      const token = this.config.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async createActivitySession(data: ActivitySessionData): Promise<any> {
    try {
      const response = await this.client.post('/activity/sessions', data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating activity session:', error.message);
      throw error;
    }
  }

  async updateActivitySession(id: string, data: Partial<ActivitySessionData>): Promise<any> {
    try {
      const response = await this.client.put(`/activity/sessions/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating activity session:', error.message);
      throw error;
    }
  }

  async getUserInfo(): Promise<any> {
    try {
      const response = await this.client.get('/auth/me');
      return response.data;
    } catch (error: any) {
      console.error('Error getting user info:', error.message);
      throw error;
    }
  }

  async getRepos(): Promise<any[]> {
    try {
      const response = await this.client.get('/repos');
      return response.data;
    } catch (error: any) {
      console.error('Error getting repos:', error.message);
      return [];
    }
  }

  isAuthenticated(): boolean {
    return this.config.isAuthenticated();
  }

  setToken(token: string): void {
    this.config.setToken(token);
  }
}

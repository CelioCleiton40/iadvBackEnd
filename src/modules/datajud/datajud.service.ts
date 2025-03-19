import axios from 'axios';
import { env } from '../../config/env';

// Define interfaces for DataJud API responses
interface DataJudCase {
  id: string;
  number: string;
  court: string;
  subject: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface DataJudDocument {
  id: string;
  caseId: string;
  title: string;
  type: string;
  content: string;
  createdAt: string;
}

interface DataJudMagistrate {
  id: string;
  name: string;
  court: string;
  position: string;
}

interface SearchResult {
  cases: DataJudCase[];
  total: number;
  page: number;
  limit: number;
}

// DataJud API service
export class DataJudService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = env.DATAJUD_API_URL;
    this.apiKey = env.DATAJUD_API_KEY;
  }

  private async request<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        params
      });
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(`DataJud API error: ${error.response.status} - ${error.response.data.message || 'Unknown error'}`);
        } else {
          throw new Error(`DataJud API request failed: ${error.message}`);
        }
      }
      throw error;
    }
  }

  // Search for cases
  async searchCases(query: string, page: number = 1, limit: number = 10): Promise<SearchResult> {
    return this.request<SearchResult>('/cases/search', { query, page, limit });
  }

  // Get all cases
  async getCases(page: number = 1, limit: number = 10): Promise<SearchResult> {
    return this.request<SearchResult>('/cases', { page, limit });
  }

  // Get case by ID
  async getCaseById(id: string): Promise<DataJudCase> {
    return this.request<DataJudCase>(`/cases/${id}`);
  }

  // Get case documents
  async getCaseDocuments(caseId: string): Promise<DataJudDocument[]> {
    return this.request<DataJudDocument[]>(`/cases/${caseId}/documents`);
  }

  // Get magistrate details
  async getMagistrateDetails(id: string): Promise<DataJudMagistrate> {
    return this.request<DataJudMagistrate>(`/magistrates/${id}`);
  }
}

// Create a singleton instance
export const datajudService = new DataJudService();
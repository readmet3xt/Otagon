const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export interface ChatRequest {
  message: string;
  conversation: {
    id: string;
    title?: string;
    genre?: string;
    progress?: number;
  };
  history?: any[];
}

export interface ChatResponse {
  response: string;
  timestamp: string;
  conversationId: string;
}

export interface InsightsRequest {
  gameName: string;
  genre: string;
  progress: number;
  instruction: string;
  insightId?: string;
}

export interface InsightsResponse {
  insights: string;
  timestamp: string;
  gameName: string;
  progress: number;
}

export class ApiService {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  static async sendChatMessage(
    message: string,
    conversation: ChatRequest['conversation'],
    history: any[] = []
  ): Promise<ChatResponse> {
    return this.request<ChatResponse>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversation, history }),
    });
  }

  static async generateInsights(
    gameName: string,
    genre: string,
    progress: number,
    instruction: string,
    insightId?: string
  ): Promise<InsightsResponse> {
    return this.request<InsightsResponse>('/api/insights', {
      method: 'POST',
      body: JSON.stringify({ gameName, genre, progress, instruction, insightId }),
    });
  }

  static async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}

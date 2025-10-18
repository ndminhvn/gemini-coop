import {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  Chat,
  Message,
  CreateChatRequest,
  InviteUserRequest,
  APIError,
} from "./types";

// API Base URL - change this for production
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Helper function to get auth token from localStorage
const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

// Helper function to build headers with auth token
const getHeaders = (includeAuth = false): HeadersInit => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: APIError = await response.json().catch(() => ({
      detail: "An error occurred",
    }));
    throw new Error(error.detail || "An error occurred");
  }
  return response.json();
}

// ============= Auth API =============

export const authAPI = {
  async register(data: RegisterRequest): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<User>(response);
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<AuthResponse>(response);
  },

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: getHeaders(true),
    });
    return handleResponse<User>(response);
  },
};

// ============= Chat API =============

export const chatAPI = {
  async getChats(): Promise<Chat[]> {
    const response = await fetch(`${API_BASE_URL}/api/chats`, {
      headers: getHeaders(true),
    });
    return handleResponse<Chat[]>(response);
  },

  async getChat(chatId: number): Promise<Chat> {
    const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}`, {
      headers: getHeaders(true),
    });
    return handleResponse<Chat>(response);
  },

  async createChat(data: CreateChatRequest): Promise<Chat> {
    const response = await fetch(`${API_BASE_URL}/api/chats`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    return handleResponse<Chat>(response);
  },

  async inviteUser(
    chatId: number,
    data: InviteUserRequest,
  ): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}/invite`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    return handleResponse<{ message: string }>(response);
  },

  async getMessages(chatId: number, limit = 50): Promise<Message[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/chats/${chatId}/messages?limit=${limit}`,
      {
        headers: getHeaders(true),
      },
    );
    return handleResponse<Message[]>(response);
  },

  async getParticipants(chatId: number): Promise<User[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/chats/${chatId}/participants`,
      {
        headers: getHeaders(true),
      },
    );
    return handleResponse<User[]>(response);
  },
};

// ============= WebSocket Helper =============

export const createWebSocket = (token: string): WebSocket => {
  const wsUrl = API_BASE_URL.replace("http", "ws");
  return new WebSocket(`${wsUrl}/ws?token=${token}`);
};

// Export API base URL for direct use
export { API_BASE_URL };

import axios, { AxiosInstance, AxiosError } from "axios";
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
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("token");
};

// Create axios instance with default config
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<APIError>) => {
    const message =
      error.response?.data?.detail || error.message || "An error occurred";
    return Promise.reject(new Error(message));
  },
);

// ============= Auth API =============

export const authAPI = {
  async register(data: RegisterRequest): Promise<User> {
    const response = await axiosInstance.post<User>("/api/auth/register", data);
    return response.data;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await axiosInstance.post<AuthResponse>(
      "/api/auth/login",
      data,
    );
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await axiosInstance.get<User>("/api/auth/me");
    return response.data;
  },

  async searchUsers(query: string, limit = 10): Promise<User[]> {
    const response = await axiosInstance.get<User[]>("/api/users/search", {
      params: { query, limit },
    });
    return response.data;
  },
};

// ============= Chat API =============

export const chatAPI = {
  async getChats(): Promise<Chat[]> {
    const response = await axiosInstance.get<Chat[]>("/api/chats");
    return response.data;
  },

  async getChat(chatId: number): Promise<Chat> {
    const response = await axiosInstance.get<Chat>(`/api/chats/${chatId}`);
    return response.data;
  },

  async createChat(data: CreateChatRequest): Promise<Chat> {
    const response = await axiosInstance.post<Chat>("/api/chats", data);
    return response.data;
  },

  async inviteUser(
    chatId: number,
    data: InviteUserRequest,
  ): Promise<{ message: string }> {
    const response = await axiosInstance.post<{ message: string }>(
      `/api/chats/${chatId}/invite`,
      data,
    );
    return response.data;
  },

  async getMessages(chatId: number, limit = 50): Promise<Message[]> {
    const response = await axiosInstance.get<Message[]>(
      `/api/chats/${chatId}/messages`,
      { params: { limit } },
    );
    return response.data;
  },

  async getParticipants(chatId: number): Promise<User[]> {
    const response = await axiosInstance.get<User[]>(
      `/api/chats/${chatId}/participants`,
    );
    return response.data;
  },

  async markChatAsRead(chatId: number): Promise<{ success: boolean }> {
    const response = await axiosInstance.post<{ success: boolean }>(
      `/api/chats/${chatId}/mark-read`,
    );
    return response.data;
  },

  async getReadReceipts(
    chatId: number,
  ): Promise<
    Record<
      number,
      Array<{ user_id: number; username: string; read_at: string }>
    >
  > {
    const response = await axiosInstance.get<
      Record<
        number,
        Array<{ user_id: number; username: string; read_at: string }>
      >
    >(`/api/chats/${chatId}/read-receipts`);
    return response.data;
  },
};

// ============= WebSocket Helper =============

export const createWebSocket = (token: string): WebSocket => {
  const wsUrl = API_BASE_URL.replace("http", "ws");
  return new WebSocket(`${wsUrl}/ws?token=${token}`);
};

// ============= Generic API Client =============

export const apiClient = {
  async get<T>(endpoint: string, params?: any): Promise<T> {
    const response = await axiosInstance.get<T>(endpoint, { params });
    return response.data;
  },

  async post<T>(endpoint: string, body?: any): Promise<T> {
    const response = await axiosInstance.post<T>(endpoint, body);
    return response.data;
  },

  async put<T>(endpoint: string, body?: any): Promise<T> {
    const response = await axiosInstance.put<T>(endpoint, body);
    return response.data;
  },

  async delete<T>(endpoint: string): Promise<T> {
    const response = await axiosInstance.delete<T>(endpoint);
    return response.data;
  },
};

// Export API base URL for direct use
export { API_BASE_URL };

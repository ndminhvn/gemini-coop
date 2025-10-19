// User types
export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

// Auth types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

// Chat types
export interface Chat {
  id: number;
  name: string | null;
  owner_id: number;
  created_at: string;
  is_group: boolean;
}

export interface ChatWithParticipants extends Chat {
  participants: User[];
}

export interface CreateChatRequest {
  name?: string;
  is_group: boolean;
  is_ai_chat?: boolean;
  participant_usernames?: string[];
}

export interface InviteUserRequest {
  username: string;
}

// Message types
export interface Message {
  id: number;
  chat_id: number;
  user_id: number | null;
  content: string;
  is_bot: boolean;
  created_at: string;
  username: string; // Username of the sender (required for display)
}

// WebSocket message types
export type WSMessageType =
  | "join"
  | "leave"
  | "message"
  | "typing"
  | "bot_stream"
  | "user_joined"
  | "user_left";

export interface WSMessage {
  type: WSMessageType;
  chat_id: number;
  content?: string;
  username?: string;
  message_id?: number;
  chunk?: string;
  is_complete?: boolean;
  full_response?: string;
  is_bot?: boolean;
  created_at?: string;
}

// API Error type
export interface APIError {
  detail: string;
}

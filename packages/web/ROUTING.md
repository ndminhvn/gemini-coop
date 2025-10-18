# Frontend Routing Structure

## Routes

### Public Routes

- **`/login`** - Login and registration page
  - Not protected
  - Redirects to `/chat` if already authenticated

### Protected Routes (require authentication)

- **`/chat`** - Main chat list view
  - Shows all user's chats in sidebar
  - Empty state prompting to select or create a chat
  - Protected by `ProtectedRoute` component

- **`/chat/[chatId]`** - Individual chat view
  - Dynamic route for specific chat
  - Shows chat messages and message input
  - Real-time messaging with WebSocket (to be implemented)
  - Gemini AI integration with `/bot` command
  - Protected by `ProtectedRoute` component

### Root Route

- **`/`** - Redirects based on authentication
  - If authenticated → `/chat`
  - If not authenticated → `/login`
  - No content, just handles routing logic

## Route Protection

All protected routes use the `ProtectedRoute` component which:

1. Checks authentication status from `AuthContext`
2. Shows loading state while checking
3. Redirects to `/login` if not authenticated
4. Renders children if authenticated

## Navigation Flow

```
User visits /
  ↓
Check auth status
  ↓
├─ Authenticated → /chat (chat list)
│    ↓
│    Select chat → /chat/[chatId] (chat view)
│
└─ Not authenticated → /login
     ↓
     Login success → /chat
```

## Components

- **`app/page.tsx`** - Root route handler
- **`app/login/page.tsx`** - Login/register page
- **`app/chat/page.tsx`** - Chat list view
- **`app/chat/[chatId]/page.tsx`** - Individual chat view
- **`components/protected-route.tsx`** - Authentication wrapper
- **`components/app-sidebar.tsx`** - Sidebar with chat list and user menu

## API Integration

All routes use the `apiClient` from `lib/api-client.ts`:

- `apiClient.get()` - GET requests
- `apiClient.post()` - POST requests
- `apiClient.put()` - PUT requests
- `apiClient.delete()` - DELETE requests

Authentication token is automatically included in all requests.

## Next Steps

1. ✅ Routes structure created
2. ⏳ Implement WebSocket integration for real-time messaging
3. ⏳ Add chat creation modal
4. ⏳ Add user invitation functionality
5. ⏳ Implement `/bot` command for Gemini AI
6. ⏳ Add message history scrolling and pagination
7. ⏳ Add typing indicators
8. ⏳ Add message timestamps and read receipts

# Slack Clone — API Contracts

> **Primary deliverable** — This document defines every API endpoint required to populate each screen category in the Slack Clone application with mock data matching the reference screenshots captured from the Slack web application (July 2024).

## Table of Contents

- [Conventions](#conventions)
- [1. Channel Message View](#1-channel-message-view)
- [2. Direct Message Conversation](#2-direct-message-conversation)
- [3. Thread Reply Panel](#3-thread-reply-panel)
- [4. Channel Browser](#4-channel-browser)
- [5. People / Member Directory](#5-people--member-directory)
- [6. Search Results](#6-search-results)
- [7. Activity / Mentions Feed](#7-activity--mentions-feed)
- [8. Saved Items / Bookmarks](#8-saved-items--bookmarks)
- [9. File Browser](#9-file-browser)
- [10. Apps / Integrations View](#10-apps--integrations-view)
- [11. Workspace Settings](#11-workspace-settings)
- [12. User Preferences](#12-user-preferences)
- [13. Channel Settings / Details Panel](#13-channel-settings--details-panel)
- [14. User Profile Panel](#14-user-profile-panel)
- [15. Emoji Picker Overlay](#15-emoji-picker-overlay)
- [16. Huddle / Call Overlay](#16-huddle--call-overlay)
- [17. Canvas / Notes Editor](#17-canvas--notes-editor)
- [18. Channel Creation Modal](#18-channel-creation-modal)
- [19. Invite Members Modal](#19-invite-members-modal)
- [20. Compose New Message View](#20-compose-new-message-view)
- [Cross-Cutting Endpoints](#cross-cutting-endpoints)
- [Appendix A: Database Schema Reference](#appendix-a-database-schema-reference)
- [Appendix B: Endpoint Summary Table](#appendix-b-endpoint-summary-table)
- [Appendix C: Seed Data Reference](#appendix-c-seed-data-reference)

---

## Conventions

- **Base URL:** `http://localhost:3000`
- **Content-Type:** All requests and responses use `application/json`
- **Authentication:** None — the application operates without authentication. The "current user" is selected via a client-side dropdown and passed as `user_id` in request parameters where needed.
- **Error Responses:** All endpoints return `{ "error": "<message>" }` with appropriate HTTP status codes:
  - `400 Bad Request` — Missing or invalid required fields
  - `404 Not Found` — Requested resource does not exist
  - `500 Internal Server Error` — Database or server error
- **Timestamps:** All timestamps are in ISO 8601 format (PostgreSQL `TIMESTAMP` serialized as `"YYYY-MM-DDTHH:mm:ss.sssZ"`)
- **ID Type:** All IDs are auto-incrementing integers (`SERIAL PRIMARY KEY`)
- **Pagination:** List endpoints support `?limit=N&offset=M` query parameters. Default limit is 50; maximum is 200.
- **Sorting:** List endpoints return results in their natural order unless a `sort` parameter is specified.
- **Null Fields:** Nullable fields are included in responses with `null` values rather than being omitted.

---

## 1. Channel Message View

The primary screen of the application. Displays a sidebar with channel list and user switcher, a message area with the active channel's messages, and a message input composer.

**Endpoints required:**
- `GET /api/channels` — Sidebar channel list
- `GET /api/channels/:id/messages` — Message list for active channel
- `POST /api/channels/:id/messages` — Send a new message
- `GET /api/users` — User list for user switcher and avatars

---

### `GET /api/channels`

**Description:** List all channels with creator information, member counts, and last message preview for the sidebar.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | No | `50` | Maximum number of channels to return |
| `offset` | integer | No | `0` | Number of channels to skip |

**Request Body:** None

**Response Body (`200 OK`):**

```typescript
interface Channel {
  id: number;
  name: string;
  description: string;
  created_by: number;
  creator_name: string;
  member_count: number;
  unread_count: number;
  last_message_preview: string | null;
  created_at: string;
}

type Response = Channel[];
```

**Error Responses:**
- `500 Internal Server Error` — `{ "error": "Failed to fetch channels" }`

**Example Response:**

```json
[
  {
    "id": 1,
    "name": "general",
    "description": "Company-wide announcements and chat",
    "created_by": 1,
    "creator_name": "alice",
    "member_count": 3,
    "unread_count": 0,
    "last_message_preview": "Hello world!",
    "created_at": "2024-07-01T00:00:00.000Z"
  },
  {
    "id": 2,
    "name": "random",
    "description": "Non-work banter and water cooler chat",
    "created_by": 1,
    "creator_name": "alice",
    "member_count": 3,
    "unread_count": 2,
    "last_message_preview": "It was amazing!",
    "created_at": "2024-07-01T00:00:00.000Z"
  },
  {
    "id": 3,
    "name": "engineering",
    "description": "Engineering team discussion",
    "created_by": 2,
    "creator_name": "bob",
    "member_count": 2,
    "unread_count": 0,
    "last_message_preview": "Nice work! I will review it today.",
    "created_at": "2024-07-01T00:00:00.000Z"
  }
]
```

---

### `POST /api/channels`

**Description:** Create a new channel. The channel name is normalized to lowercase with hyphens replacing spaces.

**Query Parameters:** None

**Request Body:**

```typescript
interface CreateChannelRequest {
  name: string;          // Required — channel display name
  description?: string;  // Optional — channel description (defaults to "")
  created_by: number;    // Required — ID of the creating user
}
```

**Response Body (`201 Created`):**

```typescript
interface Channel {
  id: number;
  name: string;
  description: string;
  created_by: number;
  created_at: string;
}
```

**Error Responses:**
- `400 Bad Request` — `{ "error": "Channel name is required" }`
- `500 Internal Server Error` — `{ "error": "Failed to create channel" }`

**Example Request:**

```json
{
  "name": "design",
  "description": "Design team collaboration",
  "created_by": 1
}
```

**Example Response:**

```json
{
  "id": 4,
  "name": "design",
  "description": "Design team collaboration",
  "created_by": 1,
  "created_at": "2024-07-15T10:30:00.000Z"
}
```

---

### `GET /api/channels/:id/messages`

**Description:** Fetch all messages for a specific channel, enriched with user info, thread reply counts, reaction summaries, and pin status.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Channel ID |

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | No | `50` | Maximum number of messages to return |
| `before` | string | No | — | ISO 8601 timestamp — return messages created before this time |
| `after` | string | No | — | ISO 8601 timestamp — return messages created after this time |

**Request Body:** None

**Response Body (`200 OK`):**

```typescript
interface ReactionSummary {
  emoji: string;
  count: number;
  users: string[];
}

interface Message {
  id: number;
  channel_id: number;
  user_id: number;
  content: string;
  username: string;
  avatar_color: string;
  created_at: string;
  thread_reply_count: number;
  reaction_summary: ReactionSummary[];
  is_pinned: boolean;
}

type Response = Message[];
```

**Error Responses:**
- `500 Internal Server Error` — `{ "error": "Failed to fetch messages" }`

**Example Response:**

```json
[
  {
    "id": 1,
    "channel_id": 1,
    "user_id": 1,
    "content": "Welcome to the general channel!",
    "username": "alice",
    "avatar_color": "#EF4444",
    "created_at": "2024-07-01T09:00:00.000Z",
    "thread_reply_count": 2,
    "reaction_summary": [
      { "emoji": "👋", "count": 3, "users": ["bob", "charlie", "alice"] }
    ],
    "is_pinned": true
  },
  {
    "id": 2,
    "channel_id": 1,
    "user_id": 2,
    "content": "Hey everyone, glad to be here!",
    "username": "bob",
    "avatar_color": "#3B82F6",
    "created_at": "2024-07-01T09:05:00.000Z",
    "thread_reply_count": 0,
    "reaction_summary": [
      { "emoji": "😄", "count": 1, "users": ["alice"] }
    ],
    "is_pinned": false
  },
  {
    "id": 3,
    "channel_id": 1,
    "user_id": 3,
    "content": "Hello world!",
    "username": "charlie",
    "avatar_color": "#10B981",
    "created_at": "2024-07-01T09:10:00.000Z",
    "thread_reply_count": 0,
    "reaction_summary": [],
    "is_pinned": false
  }
]
```

---

### `POST /api/channels/:id/messages`

**Description:** Send a new message in a channel. Returns the created message enriched with user info.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Channel ID |

**Request Body:**

```typescript
interface CreateMessageRequest {
  user_id: number;  // Required — ID of the sending user
  content: string;  // Required — message text content
}
```

**Response Body (`201 Created`):**

```typescript
interface Message {
  id: number;
  channel_id: number;
  user_id: number;
  content: string;
  username: string;
  avatar_color: string;
  created_at: string;
}
```

**Error Responses:**
- `400 Bad Request` — `{ "error": "user_id and content are required" }`
- `500 Internal Server Error` — `{ "error": "Failed to send message" }`

**Example Request:**

```json
{
  "user_id": 1,
  "content": "Good morning team! 🌞"
}
```

**Example Response:**

```json
{
  "id": 8,
  "channel_id": 1,
  "user_id": 1,
  "content": "Good morning team! 🌞",
  "username": "alice",
  "avatar_color": "#EF4444",
  "created_at": "2024-07-15T08:00:00.000Z"
}
```

---

### `GET /api/users`

**Description:** List all users with profile information, status, and display details for the user switcher dropdown, message avatars, and people directory.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | No | `50` | Maximum number of users to return |
| `offset` | integer | No | `0` | Number of users to skip |
| `search` | string | No | — | Filter users by username or display_name (case-insensitive partial match) |

**Request Body:** None

**Response Body (`200 OK`):**

```typescript
interface User {
  id: number;
  username: string;
  avatar_color: string;
  created_at: string;
  status_emoji: string | null;
  status_text: string | null;
  display_name: string | null;
  title: string | null;
}

type Response = User[];
```

**Error Responses:**
- `500 Internal Server Error` — `{ "error": "Failed to fetch users" }`

**Example Response:**

```json
[
  {
    "id": 1,
    "username": "alice",
    "avatar_color": "#EF4444",
    "created_at": "2024-07-01T00:00:00.000Z",
    "status_emoji": "🏠",
    "status_text": "Working from home",
    "display_name": "Alice Johnson",
    "title": "Engineering Manager"
  },
  {
    "id": 2,
    "username": "bob",
    "avatar_color": "#3B82F6",
    "created_at": "2024-07-01T00:00:00.000Z",
    "status_emoji": null,
    "status_text": null,
    "display_name": "Bob Smith",
    "title": "Senior Developer"
  },
  {
    "id": 3,
    "username": "charlie",
    "avatar_color": "#10B981",
    "created_at": "2024-07-01T00:00:00.000Z",
    "status_emoji": "🎧",
    "status_text": "In a meeting",
    "display_name": "Charlie Davis",
    "title": "DevOps Engineer"
  }
]
```

---

### `POST /api/users`

**Description:** Create a new user account with a username and optional avatar color.

**Query Parameters:** None

**Request Body:**

```typescript
interface CreateUserRequest {
  username: string;       // Required — unique username
  avatar_color?: string;  // Optional — hex color for avatar (defaults to "#6B7280")
}
```

**Response Body (`201 Created`):**

```typescript
interface User {
  id: number;
  username: string;
  avatar_color: string;
  created_at: string;
}
```

**Error Responses:**
- `400 Bad Request` — `{ "error": "Username is required" }`
- `500 Internal Server Error` — `{ "error": "Failed to create user" }`

**Example Request:**

```json
{
  "username": "diana",
  "avatar_color": "#8B5CF6"
}
```

**Example Response:**

```json
{
  "id": 4,
  "username": "diana",
  "avatar_color": "#8B5CF6",
  "created_at": "2024-07-15T12:00:00.000Z"
}
```

---

## 2. Direct Message Conversation

Displays a 1:1 or group direct message conversation with a participant list in the header, message history, and message input. The sidebar shows the list of active DM conversations with unread indicators.

**Endpoints required:**
- `GET /api/dms` — List DM conversations for sidebar
- `GET /api/dms/:id/messages` — Messages in a DM conversation
- `POST /api/dms/:id/messages` — Send a DM message
- `POST /api/dms` — Create a new DM conversation

---

### `GET /api/dms`

**Description:** List all direct message conversations for the current user, with the most recent message preview and unread count.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `user_id` | integer | Yes | — | Current user ID to fetch their DM conversations |
| `limit` | integer | No | `50` | Maximum number of conversations to return |
| `offset` | integer | No | `0` | Number of conversations to skip |

**Request Body:** None

**Response Body (`200 OK`):**

```typescript
interface DmMember {
  user_id: number;
  username: string;
  avatar_color: string;
  display_name: string | null;
}

interface DirectMessage {
  id: number;
  created_by: number;
  is_group: boolean;
  members: DmMember[];
  last_message_preview: string | null;
  last_message_at: string | null;
  unread_count: number;
  created_at: string;
}

type Response = DirectMessage[];
```

**Error Responses:**
- `400 Bad Request` — `{ "error": "user_id is required" }`
- `500 Internal Server Error` — `{ "error": "Failed to fetch direct messages" }`

**Example Response:**

```json
[
  {
    "id": 1,
    "created_by": 1,
    "is_group": false,
    "members": [
      { "user_id": 1, "username": "alice", "avatar_color": "#EF4444", "display_name": "Alice Johnson" },
      { "user_id": 2, "username": "bob", "avatar_color": "#3B82F6", "display_name": "Bob Smith" }
    ],
    "last_message_preview": "Sure, let's sync at 2pm",
    "last_message_at": "2024-07-15T13:45:00.000Z",
    "unread_count": 1,
    "created_at": "2024-07-01T10:00:00.000Z"
  },
  {
    "id": 2,
    "created_by": 1,
    "is_group": true,
    "members": [
      { "user_id": 1, "username": "alice", "avatar_color": "#EF4444", "display_name": "Alice Johnson" },
      { "user_id": 2, "username": "bob", "avatar_color": "#3B82F6", "display_name": "Bob Smith" },
      { "user_id": 3, "username": "charlie", "avatar_color": "#10B981", "display_name": "Charlie Davis" }
    ],
    "last_message_preview": "Great idea, let's do it!",
    "last_message_at": "2024-07-15T11:20:00.000Z",
    "unread_count": 0,
    "created_at": "2024-07-02T14:00:00.000Z"
  }
]
```

---

### `POST /api/dms`

**Description:** Create a new direct message conversation between two or more users.

**Query Parameters:** None

**Request Body:**

```typescript
interface CreateDmRequest {
  created_by: number;     // Required — ID of the user initiating the DM
  member_ids: number[];   // Required — array of user IDs to include (including creator)
}
```

**Response Body (`201 Created`):**

```typescript
interface DirectMessage {
  id: number;
  created_by: number;
  is_group: boolean;
  members: DmMember[];
  last_message_preview: null;
  last_message_at: null;
  unread_count: 0;
  created_at: string;
}
```

**Error Responses:**
- `400 Bad Request` — `{ "error": "created_by and member_ids are required" }`
- `400 Bad Request` — `{ "error": "At least 2 members are required" }`
- `500 Internal Server Error` — `{ "error": "Failed to create direct message" }`

**Example Request:**

```json
{
  "created_by": 1,
  "member_ids": [1, 3]
}
```

**Example Response:**

```json
{
  "id": 3,
  "created_by": 1,
  "is_group": false,
  "members": [
    { "user_id": 1, "username": "alice", "avatar_color": "#EF4444", "display_name": "Alice Johnson" },
    { "user_id": 3, "username": "charlie", "avatar_color": "#10B981", "display_name": "Charlie Davis" }
  ],
  "last_message_preview": null,
  "last_message_at": null,
  "unread_count": 0,
  "created_at": "2024-07-15T14:00:00.000Z"
}
```

---

### `GET /api/dms/:id/messages`

**Description:** Fetch all messages in a direct message conversation, enriched with sender info.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | DM conversation ID |

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | No | `50` | Maximum number of messages to return |
| `before` | string | No | — | ISO 8601 timestamp — return messages before this time |

**Request Body:** None

**Response Body (`200 OK`):**

```typescript
interface DmMessage {
  id: number;
  dm_id: number;
  user_id: number;
  content: string;
  username: string;
  avatar_color: string;
  created_at: string;
}

type Response = DmMessage[];
```

**Error Responses:**
- `404 Not Found` — `{ "error": "DM conversation not found" }`
- `500 Internal Server Error` — `{ "error": "Failed to fetch DM messages" }`

**Example Response:**

```json
[
  {
    "id": 1,
    "dm_id": 1,
    "user_id": 1,
    "content": "Hey Bob, do you have time for a quick sync?",
    "username": "alice",
    "avatar_color": "#EF4444",
    "created_at": "2024-07-15T13:30:00.000Z"
  },
  {
    "id": 2,
    "dm_id": 1,
    "user_id": 2,
    "content": "Sure, let's sync at 2pm",
    "username": "bob",
    "avatar_color": "#3B82F6",
    "created_at": "2024-07-15T13:45:00.000Z"
  }
]
```

---

### `POST /api/dms/:id/messages`

**Description:** Send a message in a direct message conversation. Returns the created message enriched with sender info.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | DM conversation ID |

**Request Body:**

```typescript
interface CreateDmMessageRequest {
  user_id: number;  // Required — ID of the sending user
  content: string;  // Required — message text content
}
```

**Response Body (`201 Created`):**

```typescript
interface DmMessage {
  id: number;
  dm_id: number;
  user_id: number;
  content: string;
  username: string;
  avatar_color: string;
  created_at: string;
}
```

**Error Responses:**
- `400 Bad Request` — `{ "error": "user_id and content are required" }`
- `404 Not Found` — `{ "error": "DM conversation not found" }`
- `500 Internal Server Error` — `{ "error": "Failed to send DM message" }`

**Example Request:**

```json
{
  "user_id": 1,
  "content": "Sounds good, see you then!"
}
```

**Example Response:**

```json
{
  "id": 3,
  "dm_id": 1,
  "user_id": 1,
  "content": "Sounds good, see you then!",
  "username": "alice",
  "avatar_color": "#EF4444",
  "created_at": "2024-07-15T13:50:00.000Z"
}
```

---

## 3. Thread Reply Panel

A right-side panel showing threaded replies to a parent message. Displays the original parent message at the top followed by all replies, with a reply input at the bottom.

**Endpoints required:**
- `GET /api/messages/:id/thread` — Fetch thread replies for a parent message
- `POST /api/messages/:id/thread` — Add a reply to a thread

---

### `GET /api/messages/:id/thread`

**Description:** Fetch all thread replies for a parent message, including the parent message itself and all replies sorted chronologically.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Parent message ID |

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | No | `50` | Maximum number of replies to return |
| `before` | string | No | — | ISO 8601 timestamp — return replies before this time |

**Request Body:** None

**Response Body (`200 OK`):**

```typescript
interface ThreadReply {
  id: number;
  parent_message_id: number;
  user_id: number;
  content: string;
  username: string;
  avatar_color: string;
  created_at: string;
}

interface ThreadResponse {
  parent_message: {
    id: number;
    channel_id: number;
    user_id: number;
    content: string;
    username: string;
    avatar_color: string;
    created_at: string;
  };
  replies: ThreadReply[];
  reply_count: number;
}
```

**Error Responses:**
- `404 Not Found` — `{ "error": "Message not found" }`
- `500 Internal Server Error` — `{ "error": "Failed to fetch thread" }`

**Example Response:**

```json
{
  "parent_message": {
    "id": 1,
    "channel_id": 1,
    "user_id": 1,
    "content": "Welcome to the general channel!",
    "username": "alice",
    "avatar_color": "#EF4444",
    "created_at": "2024-07-01T09:00:00.000Z"
  },
  "replies": [
    {
      "id": 1,
      "parent_message_id": 1,
      "user_id": 2,
      "content": "Thanks for setting this up Alice!",
      "username": "bob",
      "avatar_color": "#3B82F6",
      "created_at": "2024-07-01T09:15:00.000Z"
    },
    {
      "id": 2,
      "parent_message_id": 1,
      "user_id": 3,
      "content": "Excited to be part of the team 🎉",
      "username": "charlie",
      "avatar_color": "#10B981",
      "created_at": "2024-07-01T09:20:00.000Z"
    }
  ],
  "reply_count": 2
}
```

---

### `POST /api/messages/:id/thread`

**Description:** Add a reply to an existing message thread. If the message has no thread yet, one is created automatically.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Parent message ID |

**Request Body:**

```typescript
interface CreateThreadReplyRequest {
  user_id: number;  // Required — ID of the replying user
  content: string;  // Required — reply text content
}
```

**Response Body (`201 Created`):**

```typescript
interface ThreadReply {
  id: number;
  parent_message_id: number;
  user_id: number;
  content: string;
  username: string;
  avatar_color: string;
  created_at: string;
}
```

**Error Responses:**
- `400 Bad Request` — `{ "error": "user_id and content are required" }`
- `404 Not Found` — `{ "error": "Parent message not found" }`
- `500 Internal Server Error` — `{ "error": "Failed to create thread reply" }`

**Example Request:**

```json
{
  "user_id": 2,
  "content": "Great point! I agree completely."
}
```

**Example Response:**

```json
{
  "id": 3,
  "parent_message_id": 1,
  "user_id": 2,
  "content": "Great point! I agree completely.",
  "username": "bob",
  "avatar_color": "#3B82F6",
  "created_at": "2024-07-15T14:30:00.000Z"
}
```

---

## 4. Channel Browser

A dedicated view for discovering and joining public channels across the workspace. Displays a searchable, sortable, and paginated list of all channels with descriptions, member counts, and join/preview actions.

**Endpoints required:**
- `GET /api/channels/browse` — Paginated channel listing for browsing

---

### `GET /api/channels/browse`

**Description:** Fetch a paginated list of all channels in the workspace with detailed metadata for the channel browser view.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | `1` | Page number (1-indexed) |
| `per_page` | integer | No | `20` | Number of channels per page |
| `sort` | string | No | `name` | Sort field: `name`, `member_count`, `created_at` |
| `order` | string | No | `asc` | Sort order: `asc` or `desc` |
| `search` | string | No | — | Filter by channel name or description (case-insensitive partial match) |
| `user_id` | integer | No | — | Current user ID to determine `is_member` status |

**Request Body:** None

**Response Body (`200 OK`):**

```typescript
interface BrowseChannel {
  id: number;
  name: string;
  description: string;
  member_count: number;
  creator_name: string;
  created_at: string;
  is_member: boolean;
}

interface BrowseResponse {
  channels: BrowseChannel[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
```

**Error Responses:**
- `500 Internal Server Error` — `{ "error": "Failed to fetch channels" }`

**Example Response:**

```json
{
  "channels": [
    {
      "id": 3,
      "name": "engineering",
      "description": "Engineering team discussion",
      "member_count": 2,
      "creator_name": "bob",
      "created_at": "2024-07-01T00:00:00.000Z",
      "is_member": true
    },
    {
      "id": 1,
      "name": "general",
      "description": "Company-wide announcements and chat",
      "member_count": 3,
      "creator_name": "alice",
      "created_at": "2024-07-01T00:00:00.000Z",
      "is_member": true
    },
    {
      "id": 2,
      "name": "random",
      "description": "Non-work banter and water cooler chat",
      "member_count": 3,
      "creator_name": "alice",
      "created_at": "2024-07-01T00:00:00.000Z",
      "is_member": true
    }
  ],
  "total": 3,
  "page": 1,
  "per_page": 20,
  "total_pages": 1
}
```

---

## 5. People / Member Directory

Displays a searchable list of all workspace members with their avatars, display names, titles, statuses, and availability indicators.

**Endpoints required:**
- `GET /api/users` (extended) — Full user directory with profile info

This screen consumes the same `GET /api/users` endpoint documented in [Screen 1: Channel Message View](#1-channel-message-view) with the extended response body including `status_emoji`, `status_text`, `display_name`, and `title` fields. The `search` query parameter enables filtering by username or display name.

**Additional Example (People Directory Context):**

```json
[
  {
    "id": 1,
    "username": "alice",
    "avatar_color": "#EF4444",
    "created_at": "2024-07-01T00:00:00.000Z",
    "status_emoji": "🏠",
    "status_text": "Working from home",
    "display_name": "Alice Johnson",
    "title": "Engineering Manager"
  },
  {
    "id": 2,
    "username": "bob",
    "avatar_color": "#3B82F6",
    "created_at": "2024-07-01T00:00:00.000Z",
    "status_emoji": null,
    "status_text": null,
    "display_name": "Bob Smith",
    "title": "Senior Developer"
  },
  {
    "id": 3,
    "username": "charlie",
    "avatar_color": "#10B981",
    "created_at": "2024-07-01T00:00:00.000Z",
    "status_emoji": "🎧",
    "status_text": "In a meeting",
    "display_name": "Charlie Davis",
    "title": "DevOps Engineer"
  }
]
```

---

## 6. Search Results

Global search view with a query input, tab filters for result types (Messages, Files, Channels, People), and result cards showing matched content with highlighted search terms.

**Endpoints required:**
- `GET /api/search` — Search across messages, channels, files, and users

---

### `GET /api/search`

**Description:** Search across messages, channels, files, and users with support for advanced filters. Returns results grouped or filtered by type.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | Yes | — | Search query string |
| `type` | string | No | `all` | Filter by result type: `all`, `messages`, `channels`, `files`, `people` |
| `from` | string | No | — | Filter messages by sender username |
| `in` | string | No | — | Filter messages by channel name |
| `before` | string | No | — | ISO 8601 date — results created before this date |
| `after` | string | No | — | ISO 8601 date — results created after this date |
| `limit` | integer | No | `20` | Maximum number of results to return |
| `offset` | integer | No | `0` | Number of results to skip |

**Request Body:** None

**Response Body (`200 OK`):**

```typescript
interface SearchResultItem {
  type: "message" | "channel" | "file" | "user";
  id: number;
  title: string;
  snippet: string;
  channel_name: string | null;
  channel_id: number | null;
  username: string | null;
  avatar_color: string | null;
  created_at: string;
  highlight: string;
}

interface SearchResponse {
  results: SearchResultItem[];
  total: number;
  query: string;
  filters: {
    type: string;
    from: string | null;
    in: string | null;
    before: string | null;
    after: string | null;
  };
}
```

**Error Responses:**
- `400 Bad Request` — `{ "error": "Search query (q) is required" }`
- `500 Internal Server Error` — `{ "error": "Failed to perform search" }`

**Example Request:**

```
GET /api/search?q=deployment&type=messages&in=engineering
```

**Example Response:**

```json
{
  "results": [
    {
      "type": "message",
      "id": 6,
      "title": "Message in #engineering",
      "snippet": "Just pushed the new deployment pipeline.",
      "channel_name": "engineering",
      "channel_id": 3,
      "username": "bob",
      "avatar_color": "#3B82F6",
      "created_at": "2024-07-01T09:30:00.000Z",
      "highlight": "Just pushed the new <mark>deployment</mark> pipeline."
    }
  ],
  "total": 1,
  "query": "deployment",
  "filters": {
    "type": "messages",
    "from": null,
    "in": "engineering",
    "before": null,
    "after": null
  }
}
```

---

## 7. Activity / Mentions Feed

Displays a chronological feed of activity relevant to the current user — mentions, thread replies, reactions on their messages, and app notifications. Items are grouped by time period (Today, Yesterday, This Week, etc.).

**Endpoints required:**
- `GET /api/activity` — Activity feed for the current user

---

### `GET /api/activity`

**Description:** Fetch the activity feed for a specific user, including mentions, thread replies to their messages, reactions on their messages, and app notifications.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `user_id` | integer | Yes | — | User ID whose activity feed to fetch |
| `type` | string | No | `all` | Filter by activity type: `all`, `mention`, `thread_reply`, `reaction`, `app_notification` |
| `limit` | integer | No | `30` | Maximum number of activity items to return |
| `offset` | integer | No | `0` | Number of items to skip |
| `unread_only` | boolean | No | `false` | If `true`, return only unread activity items |

**Request Body:** None

**Response Body (`200 OK`):**

```typescript
interface ActivityItem {
  id: number;
  type: "mention" | "thread_reply" | "reaction" | "app_notification";
  message_id: number | null;
  channel_id: number | null;
  channel_name: string | null;
  actor_id: number;
  actor_username: string;
  actor_avatar_color: string;
  content: string;
  context_message: string | null;
  emoji: string | null;
  created_at: string;
  read: boolean;
}

type Response = ActivityItem[];
```

**Error Responses:**
- `400 Bad Request` — `{ "error": "user_id is required" }`
- `500 Internal Server Error` — `{ "error": "Failed to fetch activity" }`

**Example Response:**

```json
[
  {
    "id": 1,
    "type": "mention",
    "message_id": 5,
    "channel_id": 2,
    "channel_name": "random",
    "actor_id": 1,
    "actor_username": "alice",
    "actor_avatar_color": "#EF4444",
    "content": "Hey @bob, did you see the game?",
    "context_message": null,
    "emoji": null,
    "created_at": "2024-07-15T10:00:00.000Z",
    "read": false
  },
  {
    "id": 2,
    "type": "thread_reply",
    "message_id": 6,
    "channel_id": 3,
    "channel_name": "engineering",
    "actor_id": 3,
    "actor_username": "charlie",
    "actor_avatar_color": "#10B981",
    "content": "Nice work! I will review it today.",
    "context_message": "Just pushed the new deployment pipeline.",
    "emoji": null,
    "created_at": "2024-07-15T09:30:00.000Z",
    "read": true
  },
  {
    "id": 3,
    "type": "reaction",
    "message_id": 1,
    "channel_id": 1,
    "channel_name": "general",
    "actor_id": 2,
    "actor_username": "bob",
    "actor_avatar_color": "#3B82F6",
    "content": "Welcome to the general channel!",
    "context_message": null,
    "emoji": "👋",
    "created_at": "2024-07-15T08:15:00.000Z",
    "read": true
  }
]
```

---

## 8. Saved Items / Bookmarks

Displays the list of messages and files the current user has saved/bookmarked, showing the content, source channel, author, and timestamp. Users can remove saved items.

**Endpoints required:**
- `GET /api/saved` — List saved items for the current user
- `POST /api/saved` — Save (bookmark) an item
- `DELETE /api/saved` — Remove a saved item

---

### `GET /api/saved`

**Description:** Fetch all saved items (bookmarked messages and files) for a specific user.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `user_id` | integer | Yes | — | User ID whose saved items to fetch |
| `type` | string | No | `all` | Filter by saved item type: `all`, `message`, `file` |
| `limit` | integer | No | `50` | Maximum number of saved items to return |
| `offset` | integer | No | `0` | Number of items to skip |

**Request Body:** None

**Response Body (`200 OK`):**

```typescript
interface SavedItem {
  id: number;
  user_id: number;
  message_id: number | null;
  file_id: number | null;
  item_type: "message" | "file";
  content: string;
  channel_name: string;
  channel_id: number;
  username: string;
  avatar_color: string;
  saved_at: string;
  original_created_at: string;
}

type Response = SavedItem[];
```

**Error Responses:**
- `400 Bad Request` — `{ "error": "user_id is required" }`
- `500 Internal Server Error` — `{ "error": "Failed to fetch saved items" }`

**Example Response:**

```json
[
  {
    "id": 1,
    "user_id": 1,
    "message_id": 6,
    "file_id": null,
    "item_type": "message",
    "content": "Just pushed the new deployment pipeline.",
    "channel_name": "engineering",
    "channel_id": 3,
    "username": "bob",
    "avatar_color": "#3B82F6",
    "saved_at": "2024-07-15T10:00:00.000Z",
    "original_created_at": "2024-07-01T09:30:00.000Z"
  },
  {
    "id": 2,
    "user_id": 1,
    "message_id": 1,
    "file_id": null,
    "item_type": "message",
    "content": "Welcome to the general channel!",
    "channel_name": "general",
    "channel_id": 1,
    "username": "alice",
    "avatar_color": "#EF4444",
    "saved_at": "2024-07-14T16:00:00.000Z",
    "original_created_at": "2024-07-01T09:00:00.000Z"
  }
]
```

---

### `POST /api/saved`

**Description:** Save (bookmark) a message or file for the current user.

**Query Parameters:** None

**Request Body:**

```typescript
interface SaveItemRequest {
  user_id: number;           // Required — ID of the user saving the item
  message_id?: number;       // Conditionally required — ID of the message to save
  file_id?: number;          // Conditionally required — ID of the file to save
}
// One of message_id or file_id must be provided
```

**Response Body (`201 Created`):**

```typescript
interface SavedItem {
  id: number;
  user_id: number;
  message_id: number | null;
  file_id: number | null;
  saved_at: string;
}
```

**Error Responses:**
- `400 Bad Request` — `{ "error": "user_id and either message_id or file_id are required" }`
- `409 Conflict` — `{ "error": "Item already saved" }`
- `500 Internal Server Error` — `{ "error": "Failed to save item" }`

**Example Request:**

```json
{
  "user_id": 1,
  "message_id": 7
}
```

**Example Response:**

```json
{
  "id": 3,
  "user_id": 1,
  "message_id": 7,
  "file_id": null,
  "saved_at": "2024-07-15T14:00:00.000Z"
}
```

---

### `DELETE /api/saved`

**Description:** Remove a saved item (un-bookmark) for the current user.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Saved item ID to remove |
| `user_id` | integer | Yes | User ID (for ownership validation) |

**Request Body:** None

**Response Body (`200 OK`):**

```json
{ "success": true }
```

**Error Responses:**
- `400 Bad Request` — `{ "error": "id and user_id are required" }`
- `404 Not Found` — `{ "error": "Saved item not found" }`
- `500 Internal Server Error` — `{ "error": "Failed to remove saved item" }`

---

## 9. File Browser

Displays all files shared across the workspace in a list or grid view with type icons, filenames, uploaders, source channels, dates, and file sizes.

**Endpoints required:**
- `GET /api/files` — List all files in the workspace
- `POST /api/files` — Upload file metadata (mock — no binary upload)

---

### `GET /api/files`

**Description:** List all files shared in the workspace, with optional filtering by channel, file type, or uploader.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `channel_id` | integer | No | — | Filter files by source channel |
| `uploaded_by` | integer | No | — | Filter files by uploader user ID |
| `type` | string | No | — | Filter by file type: `image`, `pdf`, `document`, `spreadsheet`, `code`, `archive`, `other` |
| `search` | string | No | — | Search by filename (case-insensitive partial match) |
| `limit` | integer | No | `50` | Maximum number of files to return |
| `offset` | integer | No | `0` | Number of files to skip |
| `sort` | string | No | `created_at` | Sort field: `name`, `file_size`, `created_at` |
| `order` | string | No | `desc` | Sort order: `asc` or `desc` |

**Request Body:** None

**Response Body (`200 OK`):**

```typescript
interface FileItem {
  id: number;
  name: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  uploaded_by: number;
  uploader_name: string;
  uploader_avatar_color: string;
  channel_id: number;
  channel_name: string;
  thumbnail_url: string | null;
  created_at: string;
}

type Response = FileItem[];
```

**Error Responses:**
- `500 Internal Server Error` — `{ "error": "Failed to fetch files" }`

**Example Response:**

```json
[
  {
    "id": 1,
    "name": "architecture-diagram.png",
    "file_type": "image",
    "file_size": 245760,
    "mime_type": "image/png",
    "uploaded_by": 2,
    "uploader_name": "bob",
    "uploader_avatar_color": "#3B82F6",
    "channel_id": 3,
    "channel_name": "engineering",
    "thumbnail_url": "/files/thumbnails/1.png",
    "created_at": "2024-07-10T14:30:00.000Z"
  },
  {
    "id": 2,
    "name": "Q3-roadmap.pdf",
    "file_type": "pdf",
    "file_size": 1048576,
    "mime_type": "application/pdf",
    "uploaded_by": 1,
    "uploader_name": "alice",
    "uploader_avatar_color": "#EF4444",
    "channel_id": 1,
    "channel_name": "general",
    "thumbnail_url": null,
    "created_at": "2024-07-08T10:00:00.000Z"
  },
  {
    "id": 3,
    "name": "deploy-script.sh",
    "file_type": "code",
    "file_size": 2048,
    "mime_type": "application/x-sh",
    "uploaded_by": 3,
    "uploader_name": "charlie",
    "uploader_avatar_color": "#10B981",
    "channel_id": 3,
    "channel_name": "engineering",
    "thumbnail_url": null,
    "created_at": "2024-07-05T16:45:00.000Z"
  }
]
```

---

### `POST /api/files`

**Description:** Upload file metadata to the workspace. This is a mock endpoint — no binary file data is uploaded, only metadata describing the file.

**Query Parameters:** None

**Request Body:**

```typescript
interface UploadFileRequest {
  name: string;           // Required — file name with extension
  file_type: string;      // Required — file category (image, pdf, document, etc.)
  file_size: number;      // Required — file size in bytes
  mime_type: string;      // Required — MIME type
  uploaded_by: number;    // Required — user ID of the uploader
  channel_id: number;     // Required — channel where the file is shared
  thumbnail_url?: string; // Optional — path to thumbnail image
}
```

**Response Body (`201 Created`):**

```typescript
interface FileItem {
  id: number;
  name: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  uploaded_by: number;
  channel_id: number;
  thumbnail_url: string | null;
  created_at: string;
}
```

**Error Responses:**
- `400 Bad Request` — `{ "error": "name, file_type, file_size, mime_type, uploaded_by, and channel_id are required" }`
- `500 Internal Server Error` — `{ "error": "Failed to upload file" }`

**Example Request:**

```json
{
  "name": "meeting-notes.pdf",
  "file_type": "pdf",
  "file_size": 524288,
  "mime_type": "application/pdf",
  "uploaded_by": 1,
  "channel_id": 1
}
```

**Example Response:**

```json
{
  "id": 4,
  "name": "meeting-notes.pdf",
  "file_type": "pdf",
  "file_size": 524288,
  "mime_type": "application/pdf",
  "uploaded_by": 1,
  "channel_id": 1,
  "thumbnail_url": null,
  "created_at": "2024-07-15T15:00:00.000Z"
}
```

---

## 10. Apps / Integrations View

Visual mockup of the apps and integrations home tab. This is a static view using workspace metadata — no dedicated app management API is implemented. The screen displays workspace info and a static list of mock installed apps.

**Endpoints required:**
- `GET /api/workspace` — Workspace metadata (shared with Screen 11)

This screen consumes the `GET /api/workspace` endpoint documented in [Screen 11: Workspace Settings](#11-workspace-settings). The apps list is rendered as static mock data on the client side.

---

## 11. Workspace Settings

Displays workspace-level information including workspace name, icon, member count, billing plan, and creation date. Used by administrators and displayed in settings panels.

**Endpoints required:**
- `GET /api/workspace` — Workspace metadata

---

### `GET /api/workspace`

**Description:** Fetch workspace metadata including name, icon, member count, plan information, and creation date.

**Query Parameters:** None

**Request Body:** None

**Response Body (`200 OK`):**

```typescript
interface Workspace {
  id: number;
  name: string;
  icon_url: string | null;
  domain: string;
  member_count: number;
  plan: string;
  created_at: string;
}
```

**Error Responses:**
- `500 Internal Server Error` — `{ "error": "Failed to fetch workspace" }`

**Example Response:**

```json
{
  "id": 1,
  "name": "Acme Corp",
  "icon_url": null,
  "domain": "acme-corp",
  "member_count": 3,
  "plan": "free",
  "created_at": "2024-07-01T00:00:00.000Z"
}
```

---

## 12. User Preferences

Settings modal allowing the current user to configure notification preferences, sidebar display options, theme selection, language, and timezone. Organized into tabbed sections.

**Endpoints required:**
- `GET /api/preferences` — Fetch current user preferences
- `PUT /api/preferences` — Update user preferences

---

### `GET /api/preferences`

**Description:** Fetch the preference settings for a specific user.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | integer | Yes | User ID whose preferences to fetch |

**Request Body:** None

**Response Body (`200 OK`):**

```typescript
interface UserPreferences {
  id: number;
  user_id: number;
  notification_sound: boolean;
  notification_desktop: boolean;
  notification_email: boolean;
  notification_mobile: boolean;
  mute_all: boolean;
  sidebar_sort: "alphabetical" | "recent" | "priority";
  sidebar_show_all_channels: boolean;
  sidebar_show_all_dms: boolean;
  theme: "light" | "dark" | "system";
  language: string;
  timezone: string;
  message_preview: boolean;
  emoji_skin_tone: number;
  updated_at: string;
}
```

**Error Responses:**
- `400 Bad Request` — `{ "error": "user_id is required" }`
- `404 Not Found` — `{ "error": "Preferences not found" }`
- `500 Internal Server Error` — `{ "error": "Failed to fetch preferences" }`

**Example Response:**

```json
{
  "id": 1,
  "user_id": 1,
  "notification_sound": true,
  "notification_desktop": true,
  "notification_email": false,
  "notification_mobile": true,
  "mute_all": false,
  "sidebar_sort": "alphabetical",
  "sidebar_show_all_channels": true,
  "sidebar_show_all_dms": false,
  "theme": "light",
  "language": "en-US",
  "timezone": "America/New_York",
  "message_preview": true,
  "emoji_skin_tone": 1,
  "updated_at": "2024-07-10T12:00:00.000Z"
}
```

---

### `PUT /api/preferences`

**Description:** Update one or more preference settings for a specific user. Only the provided fields are updated; omitted fields remain unchanged.

**Query Parameters:** None

**Request Body:**

```typescript
interface UpdatePreferencesRequest {
  user_id: number;                           // Required — user ID
  notification_sound?: boolean;
  notification_desktop?: boolean;
  notification_email?: boolean;
  notification_mobile?: boolean;
  mute_all?: boolean;
  sidebar_sort?: "alphabetical" | "recent" | "priority";
  sidebar_show_all_channels?: boolean;
  sidebar_show_all_dms?: boolean;
  theme?: "light" | "dark" | "system";
  language?: string;
  timezone?: string;
  message_preview?: boolean;
  emoji_skin_tone?: number;
}
```

**Response Body (`200 OK`):**

Returns the full updated `UserPreferences` object (same schema as `GET /api/preferences` response).

**Error Responses:**
- `400 Bad Request` — `{ "error": "user_id is required" }`
- `404 Not Found` — `{ "error": "Preferences not found" }`
- `500 Internal Server Error` — `{ "error": "Failed to update preferences" }`

**Example Request:**

```json
{
  "user_id": 1,
  "theme": "dark",
  "sidebar_sort": "recent"
}
```

**Example Response:**

```json
{
  "id": 1,
  "user_id": 1,
  "notification_sound": true,
  "notification_desktop": true,
  "notification_email": false,
  "notification_mobile": true,
  "mute_all": false,
  "sidebar_sort": "recent",
  "sidebar_show_all_channels": true,
  "sidebar_show_all_dms": false,
  "theme": "dark",
  "language": "en-US",
  "timezone": "America/New_York",
  "message_preview": true,
  "emoji_skin_tone": 1,
  "updated_at": "2024-07-15T15:30:00.000Z"
}
```

---

## 13. Channel Settings / Details Panel

A right-side panel displaying channel information, members, pinned messages, and shared files. Accessible by clicking the channel name or info icon in the channel header.

**Endpoints required:**
- `GET /api/channels/:id/members` — Channel member list with roles
- `GET /api/channels/:id/pins` — Pinned messages in the channel
- `GET /api/channels/:id/files` — Files shared in the channel

---

### `GET /api/channels/:id/members`

**Description:** List all members of a specific channel with their roles and join dates.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Channel ID |

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | No | `100` | Maximum number of members to return |
| `offset` | integer | No | `0` | Number of members to skip |

**Request Body:** None

**Response Body (`200 OK`):**

```typescript
interface ChannelMember {
  id: number;
  channel_id: number;
  user_id: number;
  username: string;
  avatar_color: string;
  display_name: string | null;
  title: string | null;
  role: "owner" | "admin" | "member";
  joined_at: string;
}

type Response = ChannelMember[];
```

**Error Responses:**
- `404 Not Found` — `{ "error": "Channel not found" }`
- `500 Internal Server Error` — `{ "error": "Failed to fetch channel members" }`

**Example Response:**

```json
[
  {
    "id": 1,
    "channel_id": 1,
    "user_id": 1,
    "username": "alice",
    "avatar_color": "#EF4444",
    "display_name": "Alice Johnson",
    "title": "Engineering Manager",
    "role": "owner",
    "joined_at": "2024-07-01T00:00:00.000Z"
  },
  {
    "id": 2,
    "channel_id": 1,
    "user_id": 2,
    "username": "bob",
    "avatar_color": "#3B82F6",
    "display_name": "Bob Smith",
    "title": "Senior Developer",
    "role": "member",
    "joined_at": "2024-07-01T00:00:00.000Z"
  },
  {
    "id": 3,
    "channel_id": 1,
    "user_id": 3,
    "username": "charlie",
    "avatar_color": "#10B981",
    "display_name": "Charlie Davis",
    "title": "DevOps Engineer",
    "role": "member",
    "joined_at": "2024-07-01T00:00:00.000Z"
  }
]
```

---

### `POST /api/channels/:id/members`

**Description:** Add a member to a channel.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Channel ID |

**Request Body:**

```typescript
interface AddChannelMemberRequest {
  user_id: number;              // Required — user ID to add
  role?: "admin" | "member";    // Optional — member role (defaults to "member")
}
```

**Response Body (`201 Created`):**

```typescript
interface ChannelMember {
  id: number;
  channel_id: number;
  user_id: number;
  role: string;
  joined_at: string;
}
```

**Error Responses:**
- `400 Bad Request` — `{ "error": "user_id is required" }`
- `404 Not Found` — `{ "error": "Channel not found" }`
- `409 Conflict` — `{ "error": "User is already a member of this channel" }`
- `500 Internal Server Error` — `{ "error": "Failed to add member" }`

**Example Request:**

```json
{
  "user_id": 3,
  "role": "member"
}
```

**Example Response:**

```json
{
  "id": 4,
  "channel_id": 1,
  "user_id": 3,
  "role": "member",
  "joined_at": "2024-07-15T16:00:00.000Z"
}
```

---

### `DELETE /api/channels/:id/members`

**Description:** Remove a member from a channel.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | integer | Yes | User ID to remove from the channel |

**Request Body:** None

**Response Body (`200 OK`):**

```json
{ "success": true }
```

**Error Responses:**
- `400 Bad Request` — `{ "error": "user_id is required" }`
- `404 Not Found` — `{ "error": "Member not found in channel" }`
- `500 Internal Server Error` — `{ "error": "Failed to remove member" }`

---

### `GET /api/channels/:id/pins`

**Description:** List all pinned messages in a specific channel, sorted by pin date (most recent first).

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Channel ID |

**Query Parameters:** None

**Request Body:** None

**Response Body (`200 OK`):**

```typescript
interface PinnedMessage {
  id: number;
  message_id: number;
  channel_id: number;
  content: string;
  username: string;
  avatar_color: string;
  pinned_by: number;
  pinned_by_username: string;
  pinned_at: string;
  message_created_at: string;
}

type Response = PinnedMessage[];
```

**Error Responses:**
- `404 Not Found` — `{ "error": "Channel not found" }`
- `500 Internal Server Error` — `{ "error": "Failed to fetch pinned messages" }`

**Example Response:**

```json
[
  {
    "id": 1,
    "message_id": 1,
    "channel_id": 1,
    "content": "Welcome to the general channel!",
    "username": "alice",
    "avatar_color": "#EF4444",
    "pinned_by": 1,
    "pinned_by_username": "alice",
    "pinned_at": "2024-07-02T10:00:00.000Z",
    "message_created_at": "2024-07-01T09:00:00.000Z"
  }
]
```

---

### `GET /api/channels/:id/files`

**Description:** List all files shared in a specific channel.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Channel ID |

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | No | `50` | Maximum number of files to return |
| `offset` | integer | No | `0` | Number of files to skip |
| `type` | string | No | — | Filter by file type |

**Request Body:** None

**Response Body (`200 OK`):**

Returns an array of `FileItem` objects (same schema as `GET /api/files` in [Screen 9: File Browser](#9-file-browser)), filtered to the specified channel.

**Error Responses:**
- `404 Not Found` — `{ "error": "Channel not found" }`
- `500 Internal Server Error` — `{ "error": "Failed to fetch channel files" }`

**Example Response:**

```json
[
  {
    "id": 1,
    "name": "architecture-diagram.png",
    "file_type": "image",
    "file_size": 245760,
    "mime_type": "image/png",
    "uploaded_by": 2,
    "uploader_name": "bob",
    "uploader_avatar_color": "#3B82F6",
    "channel_id": 3,
    "channel_name": "engineering",
    "thumbnail_url": "/files/thumbnails/1.png",
    "created_at": "2024-07-10T14:30:00.000Z"
  }
]
```

---

## 14. User Profile Panel

A slide-out panel or modal displaying a user's full profile information: avatar, display name, username, title, status, timezone, email, phone, and action buttons (Message, Huddle, etc.).

**Endpoints required:**
- `GET /api/users/:id` — Full user profile details
- `GET /api/users/:id/status` — User status information
- `PUT /api/users/:id/status` — Update user status

---

### `GET /api/users/:id`

**Description:** Fetch the complete profile for a specific user.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | User ID |

**Query Parameters:** None

**Request Body:** None

**Response Body (`200 OK`):**

```typescript
interface UserProfile {
  id: number;
  username: string;
  avatar_color: string;
  display_name: string | null;
  title: string | null;
  status_emoji: string | null;
  status_text: string | null;
  status_expiry: string | null;
  timezone: string;
  email: string | null;
  phone: string | null;
  skype: string | null;
  created_at: string;
}
```

**Error Responses:**
- `404 Not Found` — `{ "error": "User not found" }`
- `500 Internal Server Error` — `{ "error": "Failed to fetch user profile" }`

**Example Response:**

```json
{
  "id": 1,
  "username": "alice",
  "avatar_color": "#EF4444",
  "display_name": "Alice Johnson",
  "title": "Engineering Manager",
  "status_emoji": "🏠",
  "status_text": "Working from home",
  "status_expiry": "2024-07-15T18:00:00.000Z",
  "timezone": "America/New_York",
  "email": "alice@acme.com",
  "phone": "+1-555-0101",
  "skype": null,
  "created_at": "2024-07-01T00:00:00.000Z"
}
```

---

### `GET /api/users/:id/status`

**Description:** Fetch the current status for a specific user (emoji, text, and expiry).

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | User ID |

**Query Parameters:** None

**Request Body:** None

**Response Body (`200 OK`):**

```typescript
interface UserStatus {
  user_id: number;
  status_emoji: string | null;
  status_text: string | null;
  status_expiry: string | null;
  updated_at: string;
}
```

**Error Responses:**
- `404 Not Found` — `{ "error": "User not found" }`
- `500 Internal Server Error` — `{ "error": "Failed to fetch user status" }`

**Example Response:**

```json
{
  "user_id": 1,
  "status_emoji": "🏠",
  "status_text": "Working from home",
  "status_expiry": "2024-07-15T18:00:00.000Z",
  "updated_at": "2024-07-15T09:00:00.000Z"
}
```

---

### `PUT /api/users/:id/status`

**Description:** Update the status for a specific user. Set `status_emoji` and `status_text` to `null` to clear the status.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | User ID |

**Request Body:**

```typescript
interface UpdateStatusRequest {
  status_emoji: string | null;    // Required — emoji for status (null to clear)
  status_text: string | null;     // Required — status text (null to clear)
  status_expiry?: string | null;  // Optional — ISO 8601 timestamp when status expires
}
```

**Response Body (`200 OK`):**

```typescript
interface UserStatus {
  user_id: number;
  status_emoji: string | null;
  status_text: string | null;
  status_expiry: string | null;
  updated_at: string;
}
```

**Error Responses:**
- `404 Not Found` — `{ "error": "User not found" }`
- `500 Internal Server Error` — `{ "error": "Failed to update user status" }`

**Example Request:**

```json
{
  "status_emoji": "🎧",
  "status_text": "In a meeting",
  "status_expiry": "2024-07-15T17:00:00.000Z"
}
```

**Example Response:**

```json
{
  "user_id": 1,
  "status_emoji": "🎧",
  "status_text": "In a meeting",
  "status_expiry": "2024-07-15T17:00:00.000Z",
  "updated_at": "2024-07-15T16:00:00.000Z"
}
```

---

## 15. Emoji Picker Overlay

A floating overlay component for selecting emojis for reactions or message composition. This is a **client-side only component** — it renders a static grid of Unicode emojis organized by category, with search functionality and a recently-used section.

**Endpoints required:** None

This overlay does not require any API endpoints. Emoji data is bundled as a static JSON dataset on the client side. The emoji categories include:
- 😊 Smileys & People
- 🐾 Animals & Nature
- 🍔 Food & Drink
- ⚽ Activities
- 🌎 Travel & Places
- 💡 Objects
- 🔣 Symbols
- 🏁 Flags

---

## 16. Huddle / Call Overlay

A visual mockup of Slack's huddle (audio/video call) interface. Displays participant avatars in a grid, call controls (mute, camera, screen share, leave), and call duration. This is a **visual mockup only** — no actual WebRTC or audio/video functionality is implemented.

**Endpoints required:**
- `GET /api/users` (existing) — Fetch participant user data for avatar display

This screen consumes the same `GET /api/users` endpoint documented in [Screen 1: Channel Message View](#1-channel-message-view). Participant data (avatars, display names) is sourced from the user list. Call state (duration, mute status, etc.) is managed entirely on the client side as mock state.

---

## 17. Canvas / Notes Editor

A visual mockup of Slack's canvas (collaborative document) editor. Displays a toolbar with formatting options, a rich text editing area, and collaboration indicators showing which users are viewing or editing. This is a **visual mockup only** — no real-time collaboration or document persistence is implemented.

**Endpoints required:** None

This screen is rendered entirely with static mock content on the client side. No API endpoints are consumed. The canvas content, formatting toolbar state, and collaborator indicators are all hardcoded mock data.

---

## 18. Channel Creation Modal

A modal dialog for creating a new public or private channel. Includes fields for channel name, description, and optional initial members to invite.

**Endpoints required:**
- `POST /api/channels` (existing) — Create the new channel
- `GET /api/users` (existing) — Populate the member invitation autocomplete
- `POST /api/channels/:id/members` (optional) — Add initial members after creation

This screen consumes the existing `POST /api/channels` endpoint documented in [Screen 1: Channel Message View](#1-channel-message-view), and the existing `GET /api/users` endpoint for the member picker. After channel creation, `POST /api/channels/:id/members` documented in [Screen 13: Channel Settings / Details Panel](#13-channel-settings--details-panel) can be used to add initial members.

**Workflow:**

1. User fills in channel name and description
2. Client sends `POST /api/channels` with `{ name, description, created_by }`
3. Server returns the created channel (201)
4. If initial members were selected, client sends one `POST /api/channels/:id/members` per member
5. Client navigates to the new channel view

---

## 19. Invite Members Modal

A modal dialog for inviting members to an existing channel. Displays a searchable user list with avatars and allows selecting multiple users to add.

**Endpoints required:**
- `GET /api/users` (existing) — Searchable user list for member selection
- `GET /api/channels/:id/members` (existing) — Current members (to exclude from invite list)
- `POST /api/channels/:id/members` (existing) — Add selected members to the channel

This screen consumes the `GET /api/users` endpoint with `search` parameter for autocomplete filtering, the `GET /api/channels/:id/members` endpoint to identify existing members (so they can be excluded or shown as "already a member"), and the `POST /api/channels/:id/members` endpoint to add each selected user. All three endpoints are documented in earlier screen sections.

**Workflow:**

1. Client fetches current channel members via `GET /api/channels/:id/members`
2. User types in the search field → client calls `GET /api/users?search=query`
3. Results are filtered to exclude current members
4. User selects one or more users and clicks "Add"
5. Client sends `POST /api/channels/:id/members` for each selected user
6. Modal closes and member list refreshes

---

## 20. Compose New Message View

A compose view for starting a new message — either a new DM or a message to a channel. Displays a recipient picker (channel or user autocomplete) and a message input.

**Endpoints required:**
- `GET /api/channels` (existing) — Channel list for channel picker autocomplete
- `GET /api/users` (existing) — User list for DM recipient autocomplete
- `POST /api/channels/:id/messages` (existing) — Send message to a channel
- `POST /api/dms` (existing) — Create new DM conversation
- `POST /api/dms/:id/messages` (existing) — Send DM message

This screen composes existing endpoints documented in earlier sections. The compose view workflow:

1. User clicks "Compose" / "New Message" button
2. A compose pane appears with a "To:" field
3. User types a channel name → client fetches `GET /api/channels` and filters
4. User types a username → client fetches `GET /api/users` and filters
5. User selects a recipient (channel or user)
6. If channel: message is sent via `POST /api/channels/:id/messages`
7. If user: a DM conversation is created via `POST /api/dms`, then message sent via `POST /api/dms/:id/messages`

---

## Cross-Cutting Endpoints

The following endpoints support functionality shared across multiple screens — reactions and message pinning. They are used within the Channel Message View, Thread Reply Panel, and Channel Settings panels.

---

### `GET /api/messages/:id/reactions`

**Description:** List all reactions on a specific message, grouped by emoji with the list of users who reacted.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Message ID |

**Query Parameters:** None

**Request Body:** None

**Response Body (`200 OK`):**

```typescript
interface Reaction {
  emoji: string;
  count: number;
  users: {
    user_id: number;
    username: string;
  }[];
}

type Response = Reaction[];
```

**Error Responses:**
- `404 Not Found` — `{ "error": "Message not found" }`
- `500 Internal Server Error` — `{ "error": "Failed to fetch reactions" }`

**Example Response:**

```json
[
  {
    "emoji": "👋",
    "count": 3,
    "users": [
      { "user_id": 1, "username": "alice" },
      { "user_id": 2, "username": "bob" },
      { "user_id": 3, "username": "charlie" }
    ]
  },
  {
    "emoji": "🎉",
    "count": 1,
    "users": [
      { "user_id": 2, "username": "bob" }
    ]
  }
]
```

---

### `POST /api/messages/:id/reactions`

**Description:** Add a reaction (emoji) to a message from a specific user. If the user has already reacted with the same emoji, this is a no-op.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Message ID |

**Request Body:**

```typescript
interface AddReactionRequest {
  user_id: number;  // Required — ID of the reacting user
  emoji: string;    // Required — emoji character (e.g., "👍", "🎉")
}
```

**Response Body (`201 Created`):**

```typescript
interface ReactionResponse {
  id: number;
  message_id: number;
  user_id: number;
  emoji: string;
  created_at: string;
}
```

**Error Responses:**
- `400 Bad Request` — `{ "error": "user_id and emoji are required" }`
- `404 Not Found` — `{ "error": "Message not found" }`
- `500 Internal Server Error` — `{ "error": "Failed to add reaction" }`

**Example Request:**

```json
{
  "user_id": 1,
  "emoji": "👍"
}
```

**Example Response:**

```json
{
  "id": 5,
  "message_id": 1,
  "user_id": 1,
  "emoji": "👍",
  "created_at": "2024-07-15T16:30:00.000Z"
}
```

---

### `DELETE /api/messages/:id/reactions`

**Description:** Remove a reaction from a message for a specific user.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Message ID |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | integer | Yes | User ID whose reaction to remove |
| `emoji` | string | Yes | Emoji character to remove |

**Request Body:** None

**Response Body (`200 OK`):**

```json
{ "success": true }
```

**Error Responses:**
- `400 Bad Request` — `{ "error": "user_id and emoji are required" }`
- `404 Not Found` — `{ "error": "Reaction not found" }`
- `500 Internal Server Error` — `{ "error": "Failed to remove reaction" }`

---

### `POST /api/messages/:id/pin`

**Description:** Pin a message to its channel. Only one user can pin a message at a time — re-pinning by a different user updates the `pinned_by` field.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Message ID to pin |

**Request Body:**

```typescript
interface PinMessageRequest {
  user_id: number;  // Required — ID of the user pinning the message
}
```

**Response Body (`201 Created`):**

```typescript
interface PinResponse {
  id: number;
  message_id: number;
  channel_id: number;
  pinned_by: number;
  pinned_at: string;
}
```

**Error Responses:**
- `400 Bad Request` — `{ "error": "user_id is required" }`
- `404 Not Found` — `{ "error": "Message not found" }`
- `409 Conflict` — `{ "error": "Message is already pinned" }`
- `500 Internal Server Error` — `{ "error": "Failed to pin message" }`

**Example Request:**

```json
{
  "user_id": 1
}
```

**Example Response:**

```json
{
  "id": 2,
  "message_id": 6,
  "channel_id": 3,
  "pinned_by": 1,
  "pinned_at": "2024-07-15T17:00:00.000Z"
}
```

---

### `DELETE /api/messages/:id/pin`

**Description:** Unpin a message from its channel.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Message ID to unpin |

**Query Parameters:** None

**Request Body:** None

**Response Body (`200 OK`):**

```json
{ "success": true }
```

**Error Responses:**
- `404 Not Found` — `{ "error": "Pin not found for this message" }`
- `500 Internal Server Error` — `{ "error": "Failed to unpin message" }`

---

## Appendix A: Database Schema Reference

The following tables support all API endpoints documented above. All tables follow the conventions established in `init-db.sql`: `SERIAL PRIMARY KEY`, `REFERENCES ... ON DELETE CASCADE` for foreign keys, `DEFAULT NOW()` for timestamps, and explicit `CREATE INDEX` statements.

### Existing Tables

| Table | Columns | Seed Records |
|-------|---------|--------------|
| `users` | `id`, `username`, `avatar_color`, `created_at` | 3 (alice, bob, charlie) |
| `channels` | `id`, `name`, `description`, `created_by` → users, `created_at` | 3 (general, random, engineering) |
| `messages` | `id`, `channel_id` → channels, `user_id` → users, `content`, `created_at` | 7 messages across 3 channels |

### New Tables

| Table | Columns | Purpose |
|-------|---------|---------|
| `user_statuses` | `id`, `user_id` → users, `status_emoji`, `status_text`, `status_expiry`, `updated_at` | User status (emoji + text + expiry) |
| `user_profiles` | `id`, `user_id` → users, `display_name`, `title`, `timezone`, `email`, `phone`, `skype` | Extended user profile info |
| `user_preferences` | `id`, `user_id` → users, `notification_sound`, `notification_desktop`, `notification_email`, `notification_mobile`, `mute_all`, `sidebar_sort`, `sidebar_show_all_channels`, `sidebar_show_all_dms`, `theme`, `language`, `timezone`, `message_preview`, `emoji_skin_tone`, `updated_at` | User preference settings |
| `channel_members` | `id`, `channel_id` → channels, `user_id` → users, `role`, `joined_at` | Channel membership with roles |
| `threads` | `id`, `parent_message_id` → messages, `user_id` → users, `content`, `created_at` | Thread replies to messages |
| `reactions` | `id`, `message_id` → messages, `user_id` → users, `emoji`, `created_at` | Emoji reactions on messages |
| `pins` | `id`, `message_id` → messages, `channel_id` → channels, `pinned_by` → users, `pinned_at` | Pinned messages per channel |
| `direct_messages` | `id`, `created_by` → users, `is_group`, `created_at` | DM conversation containers |
| `dm_members` | `id`, `dm_id` → direct_messages, `user_id` → users, `joined_at` | DM conversation membership |
| `dm_messages` | `id`, `dm_id` → direct_messages, `user_id` → users, `content`, `created_at` | Messages within DM conversations |
| `files` | `id`, `name`, `file_type`, `file_size`, `mime_type`, `uploaded_by` → users, `channel_id` → channels, `thumbnail_url`, `created_at` | Shared file metadata |
| `saved_items` | `id`, `user_id` → users, `message_id` → messages (nullable), `file_id` → files (nullable), `saved_at` | User-bookmarked messages and files |
| `workspace` | `id`, `name`, `icon_url`, `domain`, `member_count`, `plan`, `created_at` | Workspace metadata (single row) |
| `mentions` | `id`, `message_id` → messages, `mentioned_user_id` → users, `channel_id` → channels, `created_at` | Tracked @mentions for activity feed |

### Index Strategy

```sql
CREATE INDEX idx_messages_channel ON messages(channel_id);
CREATE INDEX idx_messages_created ON messages(created_at);
CREATE INDEX idx_threads_parent ON threads(parent_message_id);
CREATE INDEX idx_reactions_message ON reactions(message_id);
CREATE INDEX idx_pins_channel ON pins(channel_id);
CREATE INDEX idx_pins_message ON pins(message_id);
CREATE INDEX idx_dm_members_dm ON dm_members(dm_id);
CREATE INDEX idx_dm_members_user ON dm_members(user_id);
CREATE INDEX idx_dm_messages_dm ON dm_messages(dm_id);
CREATE INDEX idx_dm_messages_created ON dm_messages(created_at);
CREATE INDEX idx_files_channel ON files(channel_id);
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX idx_saved_items_user ON saved_items(user_id);
CREATE INDEX idx_channel_members_channel ON channel_members(channel_id);
CREATE INDEX idx_channel_members_user ON channel_members(user_id);
CREATE INDEX idx_mentions_user ON mentions(mentioned_user_id);
CREATE INDEX idx_mentions_message ON mentions(message_id);
CREATE INDEX idx_user_statuses_user ON user_statuses(user_id);
CREATE INDEX idx_user_profiles_user ON user_profiles(user_id);
```

---

## Appendix B: Endpoint Summary Table

Complete listing of all API endpoints documented in this contract, organized by HTTP method.

### GET Endpoints

| Endpoint | Screen(s) | Description |
|----------|-----------|-------------|
| `GET /api/channels` | 1, 18, 20 | List all channels with metadata |
| `GET /api/channels/:id/messages` | 1 | Messages for a channel |
| `GET /api/channels/:id/members` | 13, 19 | Channel member list |
| `GET /api/channels/:id/pins` | 13 | Pinned messages in channel |
| `GET /api/channels/:id/files` | 13 | Files shared in channel |
| `GET /api/channels/browse` | 4 | Paginated channel browser |
| `GET /api/users` | 1, 5, 16, 18, 19, 20 | User directory with profile info |
| `GET /api/users/:id` | 14 | Single user full profile |
| `GET /api/users/:id/status` | 14 | User status details |
| `GET /api/dms` | 2 | DM conversation list |
| `GET /api/dms/:id/messages` | 2 | Messages in a DM conversation |
| `GET /api/messages/:id/thread` | 3 | Thread replies for a message |
| `GET /api/messages/:id/reactions` | Cross-cutting | Reactions on a message |
| `GET /api/search` | 6 | Global search |
| `GET /api/activity` | 7 | Activity / mentions feed |
| `GET /api/saved` | 8 | Saved items list |
| `GET /api/files` | 9 | Workspace file browser |
| `GET /api/workspace` | 10, 11 | Workspace metadata |
| `GET /api/preferences` | 12 | User preference settings |

### POST Endpoints

| Endpoint | Screen(s) | Description |
|----------|-----------|-------------|
| `POST /api/channels` | 1, 18 | Create a new channel |
| `POST /api/channels/:id/messages` | 1, 20 | Send a message in a channel |
| `POST /api/channels/:id/members` | 13, 18, 19 | Add a member to a channel |
| `POST /api/users` | 1 | Create a new user |
| `POST /api/dms` | 2, 20 | Create a new DM conversation |
| `POST /api/dms/:id/messages` | 2, 20 | Send a DM message |
| `POST /api/messages/:id/thread` | 3 | Reply in a thread |
| `POST /api/messages/:id/reactions` | Cross-cutting | Add a reaction to a message |
| `POST /api/messages/:id/pin` | Cross-cutting | Pin a message |
| `POST /api/saved` | 8 | Save/bookmark an item |
| `POST /api/files` | 9 | Upload file metadata |

### PUT Endpoints

| Endpoint | Screen(s) | Description |
|----------|-----------|-------------|
| `PUT /api/preferences` | 12 | Update user preferences |
| `PUT /api/users/:id/status` | 14 | Update user status |

### DELETE Endpoints

| Endpoint | Screen(s) | Description |
|----------|-----------|-------------|
| `DELETE /api/channels/:id/members` | 13 | Remove a member from a channel |
| `DELETE /api/messages/:id/reactions` | Cross-cutting | Remove a reaction from a message |
| `DELETE /api/messages/:id/pin` | Cross-cutting | Unpin a message |
| `DELETE /api/saved` | 8 | Remove a saved item |

---

## Appendix C: Seed Data Reference

All example responses in this document use mock data consistent with the seed data defined in `init-db.sql`.

### Users

| ID | Username | Avatar Color | Display Name | Title |
|----|----------|--------------|--------------|-------|
| 1 | alice | `#EF4444` | Alice Johnson | Engineering Manager |
| 2 | bob | `#3B82F6` | Bob Smith | Senior Developer |
| 3 | charlie | `#10B981` | Charlie Davis | DevOps Engineer |

### Channels

| ID | Name | Description | Created By |
|----|------|-------------|------------|
| 1 | general | Company-wide announcements and chat | alice (1) |
| 2 | random | Non-work banter and water cooler chat | alice (1) |
| 3 | engineering | Engineering team discussion | bob (2) |

### Messages

| ID | Channel | User | Content |
|----|---------|------|---------|
| 1 | general (1) | alice (1) | Welcome to the general channel! |
| 2 | general (1) | bob (2) | Hey everyone, glad to be here! |
| 3 | general (1) | charlie (3) | Hello world! |
| 4 | random (2) | bob (2) | Anyone watch the game last night? |
| 5 | random (2) | alice (1) | It was amazing! |
| 6 | engineering (3) | bob (2) | Just pushed the new deployment pipeline. |
| 7 | engineering (3) | charlie (3) | Nice work! I will review it today. |

### Workspace

| ID | Name | Domain | Plan |
|----|------|--------|------|
| 1 | Acme Corp | acme-corp | free |

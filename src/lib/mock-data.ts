/**
 * src/lib/mock-data.ts — Centralized Mock Data Module
 *
 * Exports typed mock data objects that match the seed data in init-db.sql.
 * These objects represent the exact content visible in reference screenshots
 * and serve as the single source of truth for client-side data seeding,
 * Playwright test assertions, and API response verification.
 *
 * Every exported array mirrors a database table's seed records. Field values
 * are identical to the INSERT statements in init-db.sql. Timestamps use
 * ISO 8601 strings (the format PostgreSQL returns via the pg driver).
 *
 * Design principles:
 * - All exports are typed using interfaces from ./types.ts
 * - No runtime database dependency — pure static data
 * - Data relationships (foreign keys) are consistent across all arrays
 * - Timestamps use a fixed reference point for deterministic snapshots
 */

import type {
  User,
  Channel,
  Message,
  Reaction,
  DirectMessage,
  FileItem,
  SavedItem,
  UserStatus,
  Workspace,
  UserPreferences,
  ChannelMember,
  Mention,
  PinnedMessage,
} from "./types";

// =============================================================================
// Reference timestamp for deterministic mock data
// =============================================================================

const REF_DATE = "2024-07-15T12:00:00.000Z";

// =============================================================================
// Users (matches init-db.sql: 3 seed users)
// =============================================================================

export const mockUsers: User[] = [
  {
    id: 1,
    username: "alice",
    avatar_color: "#EF4444",
    created_at: REF_DATE,
    status_emoji: "🏠",
    status_text: "Working from home",
    display_name: "Alice Johnson",
    title: "Senior Engineer",
  },
  {
    id: 2,
    username: "bob",
    avatar_color: "#3B82F6",
    created_at: REF_DATE,
    status_emoji: "📅",
    status_text: "In a meeting",
    display_name: "Bob Smith",
    title: "Product Manager",
  },
  {
    id: 3,
    username: "charlie",
    avatar_color: "#10B981",
    created_at: REF_DATE,
    status_emoji: "",
    status_text: "",
    display_name: "Charlie Brown",
    title: "Designer",
  },
];

// =============================================================================
// Channels (matches init-db.sql: 3 seed channels)
// =============================================================================

export const mockChannels: Channel[] = [
  {
    id: 1,
    name: "general",
    description: "Company-wide announcements and chat",
    created_by: 1,
    created_at: REF_DATE,
    creator_name: "alice",
    member_count: 3,
    unread_count: 0,
    last_message_preview: "Welcome channel is the best!",
  },
  {
    id: 2,
    name: "random",
    description: "Non-work banter and water cooler chat",
    created_by: 1,
    created_at: REF_DATE,
    creator_name: "alice",
    member_count: 3,
    unread_count: 0,
    last_message_preview: "It was amazing!",
  },
  {
    id: 3,
    name: "engineering",
    description: "Engineering team discussion",
    created_by: 2,
    created_at: REF_DATE,
    creator_name: "bob",
    member_count: 2,
    unread_count: 0,
    last_message_preview: "Looks good! Ship it!",
  },
];

// =============================================================================
// Messages (matches init-db.sql: 10 seed messages — 7 original + 3 thread replies)
// =============================================================================

export const mockMessages: Message[] = [
  {
    id: 1,
    channel_id: 1,
    user_id: 1,
    content: "Welcome to the general channel!",
    created_at: REF_DATE,
    username: "alice",
    avatar_color: "#EF4444",
    thread_reply_count: 2,
    is_pinned: true,
    reaction_summary: [{ emoji: "👋", count: 2, users: [] }],
  },
  {
    id: 2,
    channel_id: 1,
    user_id: 2,
    content: "Hey everyone, glad to be here!",
    created_at: REF_DATE,
    username: "bob",
    avatar_color: "#3B82F6",
    thread_reply_count: 0,
    is_pinned: false,
    reaction_summary: [{ emoji: "❤️", count: 1, users: [] }],
  },
  {
    id: 3,
    channel_id: 1,
    user_id: 3,
    content: "Hello world!",
    created_at: REF_DATE,
    username: "charlie",
    avatar_color: "#10B981",
    thread_reply_count: 0,
    is_pinned: false,
    reaction_summary: [],
  },
  {
    id: 4,
    channel_id: 2,
    user_id: 2,
    content: "Anyone watch the game last night?",
    created_at: REF_DATE,
    username: "bob",
    avatar_color: "#3B82F6",
    thread_reply_count: 0,
    is_pinned: false,
    reaction_summary: [],
  },
  {
    id: 5,
    channel_id: 2,
    user_id: 1,
    content: "It was amazing!",
    created_at: REF_DATE,
    username: "alice",
    avatar_color: "#EF4444",
    thread_reply_count: 0,
    is_pinned: false,
    reaction_summary: [],
  },
  {
    id: 6,
    channel_id: 3,
    user_id: 2,
    content: "Just pushed the new deployment pipeline.",
    created_at: REF_DATE,
    username: "bob",
    avatar_color: "#3B82F6",
    thread_reply_count: 1,
    is_pinned: true,
    reaction_summary: [
      { emoji: "🚀", count: 1, users: [] },
      { emoji: "👍", count: 1, users: [] },
    ],
  },
  {
    id: 7,
    channel_id: 3,
    user_id: 3,
    content: "Nice work! I will review it today.",
    created_at: REF_DATE,
    username: "charlie",
    avatar_color: "#10B981",
    thread_reply_count: 0,
    is_pinned: false,
    reaction_summary: [{ emoji: "✅", count: 1, users: [] }],
  },
  {
    id: 8,
    channel_id: 1,
    user_id: 2,
    content: "Thanks Alice, great to be here!",
    created_at: REF_DATE,
    username: "bob",
    avatar_color: "#3B82F6",
    thread_reply_count: 0,
    is_pinned: false,
    reaction_summary: [],
  },
  {
    id: 9,
    channel_id: 1,
    user_id: 3,
    content: "Welcome channel is the best!",
    created_at: REF_DATE,
    username: "charlie",
    avatar_color: "#10B981",
    thread_reply_count: 0,
    is_pinned: false,
    reaction_summary: [],
  },
  {
    id: 10,
    channel_id: 3,
    user_id: 3,
    content: "Looks good! Ship it!",
    created_at: REF_DATE,
    username: "charlie",
    avatar_color: "#10B981",
    thread_reply_count: 0,
    is_pinned: false,
    reaction_summary: [],
  },
];

// =============================================================================
// Reactions (matches init-db.sql: 6 seed reactions)
// =============================================================================

export const mockReactions: Reaction[] = [
  { id: 1, message_id: 1, user_id: 2, emoji: "👋", created_at: REF_DATE },
  { id: 2, message_id: 1, user_id: 3, emoji: "👋", created_at: REF_DATE },
  { id: 3, message_id: 2, user_id: 1, emoji: "❤️", created_at: REF_DATE },
  { id: 4, message_id: 6, user_id: 3, emoji: "🚀", created_at: REF_DATE },
  { id: 5, message_id: 6, user_id: 1, emoji: "👍", created_at: REF_DATE },
  { id: 6, message_id: 7, user_id: 2, emoji: "✅", created_at: REF_DATE },
];

// =============================================================================
// Direct Messages (matches init-db.sql: 2 conversations, 5 DM messages)
// =============================================================================

export const mockDMs: DirectMessage[] = [
  {
    id: 1,
    created_at: REF_DATE,
    last_message_preview: "Sure, I will take a look this afternoon!",
    members: [mockUsers[0], mockUsers[1]],
  },
  {
    id: 2,
    created_at: REF_DATE,
    last_message_preview: "Joining now",
    members: [mockUsers[0], mockUsers[1], mockUsers[2]],
  },
];

// =============================================================================
// Files (matches init-db.sql: 4 seed files)
// =============================================================================

export const mockFiles: FileItem[] = [
  {
    id: 1,
    name: "Q3-report.pdf",
    file_type: "pdf",
    file_size: 2048576,
    uploaded_by: 1,
    channel_id: 1,
    created_at: REF_DATE,
    thumbnail_url: "/thumbnails/pdf-icon.png",
  },
  {
    id: 2,
    name: "architecture-diagram.png",
    file_type: "image",
    file_size: 512000,
    uploaded_by: 2,
    channel_id: 3,
    created_at: REF_DATE,
    thumbnail_url: "/thumbnails/arch-diagram-thumb.png",
  },
  {
    id: 3,
    name: "meeting-notes.md",
    file_type: "markdown",
    file_size: 4096,
    uploaded_by: 3,
    channel_id: 2,
    created_at: REF_DATE,
    thumbnail_url: "/thumbnails/md-icon.png",
  },
  {
    id: 4,
    name: "deploy-script.sh",
    file_type: "script",
    file_size: 1024,
    uploaded_by: 2,
    channel_id: 3,
    created_at: REF_DATE,
    thumbnail_url: "/thumbnails/script-icon.png",
  },
];

// =============================================================================
// Saved Items (matches init-db.sql: 3 seed saved items)
// =============================================================================

export const mockSavedItems: SavedItem[] = [
  {
    id: 1,
    user_id: 1,
    message_id: 6,
    saved_at: REF_DATE,
    source_channel: "engineering",
  },
  {
    id: 2,
    user_id: 2,
    message_id: 1,
    saved_at: REF_DATE,
    source_channel: "general",
  },
  {
    id: 3,
    user_id: 1,
    file_id: 1,
    saved_at: REF_DATE,
    source_channel: "general",
  },
];

// =============================================================================
// User Statuses (matches init-db.sql: 3 seed statuses with profile details)
// =============================================================================

export const mockStatuses: UserStatus[] = [
  {
    user_id: 1,
    status_emoji: "🏠",
    status_text: "Working from home",
  },
  {
    user_id: 2,
    status_emoji: "📅",
    status_text: "In a meeting",
  },
  {
    user_id: 3,
    status_emoji: "",
    status_text: "",
  },
];

// =============================================================================
// Workspace (matches init-db.sql: 1 seed workspace)
// =============================================================================

export const mockWorkspace: Workspace = {
  id: 1,
  name: "Acme Corp",
  icon_url: "/acme-icon.png",
  member_count: 3,
  plan: "pro",
  created_at: REF_DATE,
};

// =============================================================================
// User Preferences (matches init-db.sql: 3 seed preference records)
// =============================================================================

export const mockPreferences: UserPreferences[] = [
  {
    user_id: 1,
    notification_sound: true,
    notification_desktop: true,
    sidebar_sort: "alpha",
    theme: "light",
    language: "en",
    timezone: "UTC",
    updated_at: REF_DATE,
  },
  {
    user_id: 2,
    notification_sound: true,
    notification_desktop: false,
    sidebar_sort: "recent",
    theme: "dark",
    language: "en",
    timezone: "UTC",
    updated_at: REF_DATE,
  },
  {
    user_id: 3,
    notification_sound: false,
    notification_desktop: true,
    sidebar_sort: "alpha",
    theme: "light",
    language: "en",
    timezone: "UTC",
    updated_at: REF_DATE,
  },
];

// =============================================================================
// Channel Members (matches init-db.sql: 8 seed membership records)
// =============================================================================

export const mockChannelMembers: ChannelMember[] = [
  { channel_id: 1, user_id: 1, role: "admin", joined_at: REF_DATE },
  { channel_id: 1, user_id: 2, role: "member", joined_at: REF_DATE },
  { channel_id: 1, user_id: 3, role: "member", joined_at: REF_DATE },
  { channel_id: 2, user_id: 1, role: "member", joined_at: REF_DATE },
  { channel_id: 2, user_id: 2, role: "admin", joined_at: REF_DATE },
  { channel_id: 2, user_id: 3, role: "member", joined_at: REF_DATE },
  { channel_id: 3, user_id: 2, role: "admin", joined_at: REF_DATE },
  { channel_id: 3, user_id: 3, role: "member", joined_at: REF_DATE },
];

// =============================================================================
// Pinned Messages (matches init-db.sql: 2 seed pins)
// =============================================================================

export const mockPins: PinnedMessage[] = [
  {
    message_id: 1,
    channel_id: 1,
    pinned_by: 1,
    created_at: REF_DATE,
  },
  {
    message_id: 6,
    channel_id: 3,
    pinned_by: 2,
    created_at: REF_DATE,
  },
];

// =============================================================================
// Mentions (matches init-db.sql: 2 seed mention records)
// =============================================================================

export const mockMentions: Mention[] = [
  {
    id: 1,
    message_id: 2,
    mentioned_user_id: 1,
    channel_id: 1,
    read: true,
    created_at: REF_DATE,
  },
  {
    id: 2,
    message_id: 7,
    mentioned_user_id: 2,
    channel_id: 3,
    read: false,
    created_at: REF_DATE,
  },
];

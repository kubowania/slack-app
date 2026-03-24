/**
 * src/lib/mock-data.ts — Centralized Typed Mock Data Module
 *
 * Exports 16 typed mock data constants that match the seed data in init-db.sql
 * and represent the content visible in reference screenshots. This file serves
 * as the single source of truth for client-side data seeding, Playwright test
 * assertions, and API response verification.
 *
 * The first 3 users, 3 channels, and 7 messages mirror the INSERT statements
 * in init-db.sql exactly. Additional records extend the dataset to populate
 * all screen categories (threads, DMs, files, activity feed, etc.).
 *
 * Design principles:
 * - All exports are typed using interfaces from ./types.ts
 * - No runtime database dependency — pure static data
 * - Data relationships (foreign keys) are consistent across all arrays
 * - All dates use ISO 8601 strings (the format PostgreSQL returns via pg)
 * - No `any` types — strict mode compliance throughout
 * - No circular imports — this file imports only from ./types.ts
 */

import type {
  User,
  Channel,
  Message,
  Thread,
  Reaction,
  ReactionSummary,
  DirectMessage,
  DmMessage,
  FileItem,
  SavedItem,
  UserStatus,
  Workspace,
  UserPreferences,
  ChannelMember,
  Mention,
  ActivityItem,
  PinnedMessage,
} from "./types";

// =============================================================================
// Users — 8 total (3 from init-db.sql + 5 additional for screenshot coverage)
// =============================================================================

export const mockUsers: User[] = [
  // --- Base users matching init-db.sql seed data ---
  {
    id: 1,
    username: "alice",
    avatar_color: "#EF4444",
    created_at: "2024-01-15T10:00:00Z",
    display_name: "Alice Johnson",
    title: "Senior Engineer",
    status_emoji: "🏠",
    status_text: "Working from home",
  },
  {
    id: 2,
    username: "bob",
    avatar_color: "#3B82F6",
    created_at: "2024-01-15T10:00:00Z",
    display_name: "Bob Smith",
    title: "Product Manager",
    status_emoji: "📅",
    status_text: "In a meeting",
  },
  {
    id: 3,
    username: "charlie",
    avatar_color: "#10B981",
    created_at: "2024-01-15T10:00:00Z",
    display_name: "Charlie Brown",
    title: "Designer",
    status_emoji: "",
    status_text: "",
  },
  // --- Additional users for screenshot population ---
  {
    id: 4,
    username: "diana",
    avatar_color: "#F59E0B",
    created_at: "2024-02-01T09:00:00Z",
    display_name: "Diana Prince",
    title: "Product Manager",
    status_emoji: "📊",
    status_text: "In a meeting",
  },
  {
    id: 5,
    username: "eve",
    avatar_color: "#8B5CF6",
    created_at: "2024-02-01T09:00:00Z",
    display_name: "Eve Chen",
    title: "Senior Engineer",
    status_emoji: "",
    status_text: "",
  },
  {
    id: 6,
    username: "frank",
    avatar_color: "#EC4899",
    created_at: "2024-02-01T09:00:00Z",
    display_name: "Frank Miller",
    title: "Designer",
    status_emoji: "",
    status_text: "",
  },
  {
    id: 7,
    username: "grace",
    avatar_color: "#14B8A6",
    created_at: "2024-02-01T09:00:00Z",
    display_name: "Grace Hopper",
    title: "Engineering Lead",
    status_emoji: "🏠",
    status_text: "Working from home",
  },
  {
    id: 8,
    username: "henry",
    avatar_color: "#F97316",
    created_at: "2024-02-01T09:00:00Z",
    display_name: "Henry Ford",
    title: "DevOps Engineer",
    status_emoji: "🔧",
    status_text: "On call",
  },
];

// =============================================================================
// Channels — 8 total (3 from init-db.sql + 5 additional)
// =============================================================================

export const mockChannels: Channel[] = [
  // --- Base channels matching init-db.sql seed data ---
  {
    id: 1,
    name: "general",
    description: "Company-wide announcements and chat",
    created_by: 1,
    created_at: "2024-01-15T10:00:00Z",
    creator_name: "alice",
    member_count: 8,
    unread_count: 0,
    last_message_preview: "Welcome Diana! Glad to have you on the team.",
  },
  {
    id: 2,
    name: "random",
    description: "Non-work banter and water cooler chat",
    created_by: 1,
    created_at: "2024-01-15T10:00:00Z",
    creator_name: "alice",
    member_count: 6,
    unread_count: 2,
    last_message_preview: "Who's up for lunch at the new Italian place?",
  },
  {
    id: 3,
    name: "engineering",
    description: "Engineering team discussion",
    created_by: 2,
    created_at: "2024-01-15T10:00:00Z",
    creator_name: "bob",
    member_count: 5,
    unread_count: 1,
    last_message_preview: "PR #247 is ready for review — new caching layer.",
  },
  // --- Additional channels for channel browser and sidebar ---
  {
    id: 4,
    name: "design",
    description: "Design team collaboration",
    created_by: 6,
    created_at: "2024-02-15T10:00:00Z",
    creator_name: "frank",
    member_count: 5,
    unread_count: 0,
    last_message_preview:
      "Updated the component library with new button variants.",
  },
  {
    id: 5,
    name: "product",
    description: "Product planning and roadmap",
    created_by: 4,
    created_at: "2024-02-15T10:00:00Z",
    creator_name: "diana",
    member_count: 8,
    unread_count: 3,
    last_message_preview:
      "Q3 roadmap has been finalized, check the attached doc.",
  },
  {
    id: 6,
    name: "devops",
    description: "Infrastructure and deployment",
    created_by: 8,
    created_at: "2024-02-15T10:00:00Z",
    creator_name: "henry",
    member_count: 4,
    unread_count: 0,
    last_message_preview: "I'll be on standby for the migration.",
  },
  {
    id: 7,
    name: "social",
    description: "Team social events and activities",
    created_by: 1,
    created_at: "2024-02-15T10:00:00Z",
    creator_name: "alice",
    member_count: 8,
    unread_count: 1,
    last_message_preview:
      "Team lunch next Friday — let me know your preferences!",
  },
  {
    id: 8,
    name: "announcements",
    description: "Important company announcements",
    created_by: 4,
    created_at: "2024-02-15T10:00:00Z",
    creator_name: "diana",
    member_count: 8,
    unread_count: 0,
    last_message_preview: "Company all-hands meeting this Thursday at 3pm.",
  },
];

// =============================================================================
// Helper: create a ReactionSummary from emoji and user IDs
// =============================================================================

function buildReactionSummary(
  emoji: string,
  userIds: number[],
): ReactionSummary {
  const users = userIds.map((uid) => {
    const user = mockUsers.find((u) => u.id === uid);
    return {
      id: uid,
      username: user?.username ?? "unknown",
      avatar_color: user?.avatar_color ?? "#6B7280",
    };
  });
  return { emoji, count: users.length, users };
}

// =============================================================================
// Messages — 27 total (7 from init-db.sql + 20 additional)
//
// IDs 1-7 match init-db.sql exactly. IDs 8-27 extend coverage to all channels,
// including threaded replies, reactions, and pinned messages.
// =============================================================================

export const mockMessages: Message[] = [
  // -----------------------------------------------------------------------
  // Channel 1 (general) — messages 1, 2, 3, 8, 9, 15, 20
  // -----------------------------------------------------------------------
  {
    id: 1,
    channel_id: 1,
    user_id: 1,
    content: "Welcome to the general channel!",
    created_at: "2024-07-10T09:00:00Z",
    username: "alice",
    avatar_color: "#EF4444",
    thread_reply_count: 2,
    is_pinned: true,
    reaction_summary: [buildReactionSummary("👋", [2, 3])],
  },
  {
    id: 2,
    channel_id: 1,
    user_id: 2,
    content: "Hey everyone, glad to be here!",
    created_at: "2024-07-10T09:05:00Z",
    username: "bob",
    avatar_color: "#3B82F6",
    thread_reply_count: 0,
    is_pinned: false,
    reaction_summary: [buildReactionSummary("❤️", [1])],
  },
  {
    id: 3,
    channel_id: 1,
    user_id: 3,
    content: "Hello world!",
    created_at: "2024-07-10T09:10:00Z",
    username: "charlie",
    avatar_color: "#10B981",
    thread_reply_count: 0,
    is_pinned: false,
    reaction_summary: [],
  },
  {
    id: 8,
    channel_id: 1,
    user_id: 2,
    content: "Thanks for the warm welcome! Excited to collaborate.",
    created_at: "2024-07-10T09:20:00Z",
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
    content: "Same here, looking forward to working together!",
    created_at: "2024-07-10T09:25:00Z",
    username: "charlie",
    avatar_color: "#10B981",
    thread_reply_count: 0,
    is_pinned: false,
    reaction_summary: [],
  },
  {
    id: 15,
    channel_id: 1,
    user_id: 4,
    content: "Hi team! I'm Diana, just joined as Product Manager.",
    created_at: "2024-07-11T10:00:00Z",
    username: "diana",
    avatar_color: "#F59E0B",
    thread_reply_count: 0,
    is_pinned: false,
    reaction_summary: [
      buildReactionSummary("👋", [1]),
      buildReactionSummary("🎉", [2]),
    ],
  },
  {
    id: 20,
    channel_id: 1,
    user_id: 7,
    content: "Welcome Diana! Glad to have you on the team.",
    created_at: "2024-07-12T09:30:00Z",
    username: "grace",
    avatar_color: "#14B8A6",
    thread_reply_count: 0,
    is_pinned: false,
    reaction_summary: [],
  },

  // -----------------------------------------------------------------------
  // Channel 2 (random) — messages 4, 5, 11, 12, 16
  // -----------------------------------------------------------------------
  {
    id: 4,
    channel_id: 2,
    user_id: 2,
    content: "Anyone watch the game last night?",
    created_at: "2024-07-10T10:00:00Z",
    username: "bob",
    avatar_color: "#3B82F6",
    thread_reply_count: 2,
    is_pinned: false,
    reaction_summary: [],
  },
  {
    id: 5,
    channel_id: 2,
    user_id: 1,
    content: "It was amazing!",
    created_at: "2024-07-10T10:15:00Z",
    username: "alice",
    avatar_color: "#EF4444",
    thread_reply_count: 0,
    is_pinned: false,
    reaction_summary: [],
  },
  {
    id: 11,
    channel_id: 2,
    user_id: 3,
    content: "Yeah! What a match, that last goal was incredible.",
    created_at: "2024-07-10T10:30:00Z",
    username: "charlie",
    avatar_color: "#10B981",
    thread_reply_count: 0,
    is_pinned: false,
    reaction_summary: [],
  },
  {
    id: 12,
    channel_id: 2,
    user_id: 4,
    content: "I missed it, any highlights to share?",
    created_at: "2024-07-10T10:45:00Z",
    username: "diana",
    avatar_color: "#F59E0B",
    thread_reply_count: 0,
    is_pinned: false,
    reaction_summary: [],
  },
  {
    id: 16,
    channel_id: 2,
    user_id: 5,
    content: "Who's up for lunch at the new Italian place?",
    created_at: "2024-07-11T11:00:00Z",
    username: "eve",
    avatar_color: "#8B5CF6",
    thread_reply_count: 0,
    is_pinned: false,
    reaction_summary: [],
  },

  // -----------------------------------------------------------------------
  // Channel 3 (engineering) — messages 6, 7, 10, 19, 21
  // -----------------------------------------------------------------------
  {
    id: 6,
    channel_id: 3,
    user_id: 2,
    content: "Just pushed the new deployment pipeline.",
    created_at: "2024-07-10T11:00:00Z",
    username: "bob",
    avatar_color: "#3B82F6",
    thread_reply_count: 1,
    is_pinned: true,
    reaction_summary: [
      buildReactionSummary("🚀", [3]),
      buildReactionSummary("👍", [1]),
    ],
  },
  {
    id: 7,
    channel_id: 3,
    user_id: 3,
    content: "Nice work! I will review it today.",
    created_at: "2024-07-10T11:30:00Z",
    username: "charlie",
    avatar_color: "#10B981",
    thread_reply_count: 0,
    is_pinned: false,
    reaction_summary: [buildReactionSummary("✅", [2])],
  },
  {
    id: 10,
    channel_id: 3,
    user_id: 1,
    content: "Reviewed the pipeline — looks solid. Ship it!",
    created_at: "2024-07-10T14:00:00Z",
    username: "alice",
    avatar_color: "#EF4444",
    thread_reply_count: 0,
    is_pinned: false,
    reaction_summary: [],
  },
  {
    id: 19,
    channel_id: 3,
    user_id: 8,
    content: "CI/CD pipeline metrics are looking great this week.",
    created_at: "2024-07-12T09:00:00Z",
    username: "henry",
    avatar_color: "#F97316",
    thread_reply_count: 0,
    is_pinned: false,
    reaction_summary: [],
  },
  {
    id: 21,
    channel_id: 3,
    user_id: 5,
    content: "PR #247 is ready for review — new caching layer.",
    created_at: "2024-07-12T10:00:00Z",
    username: "eve",
    avatar_color: "#8B5CF6",
    thread_reply_count: 0,
    is_pinned: false,
    reaction_summary: [buildReactionSummary("💯", [2])],
  },

  // -----------------------------------------------------------------------
  // Channel 4 (design) — messages 13, 14, 22
  // -----------------------------------------------------------------------
  {
    id: 13,
    channel_id: 4,
    user_id: 6,
    content: "New design mockups are ready for review.",
    created_at: "2024-07-11T09:00:00Z",
    username: "frank",
    avatar_color: "#EC4899",
    thread_reply_count: 1,
    is_pinned: false,
    reaction_summary: [buildReactionSummary("👀", [4])],
  },
  {
    id: 14,
    channel_id: 4,
    user_id: 4,
    content: "Love the color palette choices, Frank!",
    created_at: "2024-07-11T09:30:00Z",
    username: "diana",
    avatar_color: "#F59E0B",
    thread_reply_count: 0,
    is_pinned: false,
    reaction_summary: [],
  },
  {
    id: 22,
    channel_id: 4,
    user_id: 6,
    content: "Updated the component library with new button variants.",
    created_at: "2024-07-12T11:00:00Z",
    username: "frank",
    avatar_color: "#EC4899",
    thread_reply_count: 0,
    is_pinned: false,
    reaction_summary: [],
  },

  // -----------------------------------------------------------------------
  // Channel 5 (product) — messages 17, 18, 23
  // -----------------------------------------------------------------------
  {
    id: 17,
    channel_id: 5,
    user_id: 4,
    content: "Sprint planning starts at 2pm today.",
    created_at: "2024-07-11T13:00:00Z",
    username: "diana",
    avatar_color: "#F59E0B",
    thread_reply_count: 1,
    is_pinned: false,
    reaction_summary: [],
  },
  {
    id: 18,
    channel_id: 5,
    user_id: 7,
    content: "I'll present the backend architecture update.",
    created_at: "2024-07-11T13:15:00Z",
    username: "grace",
    avatar_color: "#14B8A6",
    thread_reply_count: 0,
    is_pinned: false,
    reaction_summary: [],
  },
  {
    id: 23,
    channel_id: 5,
    user_id: 4,
    content: "Q3 roadmap has been finalized, check the attached doc.",
    created_at: "2024-07-12T14:00:00Z",
    username: "diana",
    avatar_color: "#F59E0B",
    thread_reply_count: 0,
    is_pinned: false,
    reaction_summary: [],
  },

  // -----------------------------------------------------------------------
  // Channel 6 (devops) — messages 24, 25
  // -----------------------------------------------------------------------
  {
    id: 24,
    channel_id: 6,
    user_id: 8,
    content: "Server migration scheduled for this weekend.",
    created_at: "2024-07-13T08:00:00Z",
    username: "henry",
    avatar_color: "#F97316",
    thread_reply_count: 0,
    is_pinned: false,
    reaction_summary: [buildReactionSummary("👍", [7])],
  },
  {
    id: 25,
    channel_id: 6,
    user_id: 7,
    content: "I'll be on standby for the migration.",
    created_at: "2024-07-13T08:30:00Z",
    username: "grace",
    avatar_color: "#14B8A6",
    thread_reply_count: 0,
    is_pinned: false,
    reaction_summary: [],
  },

  // -----------------------------------------------------------------------
  // Channel 7 (social) — message 26
  // -----------------------------------------------------------------------
  {
    id: 26,
    channel_id: 7,
    user_id: 1,
    content: "Team lunch next Friday — let me know your preferences!",
    created_at: "2024-07-14T12:00:00Z",
    username: "alice",
    avatar_color: "#EF4444",
    thread_reply_count: 0,
    is_pinned: false,
    reaction_summary: [],
  },

  // -----------------------------------------------------------------------
  // Channel 8 (announcements) — message 27
  // -----------------------------------------------------------------------
  {
    id: 27,
    channel_id: 8,
    user_id: 4,
    content: "Company all-hands meeting this Thursday at 3pm.",
    created_at: "2024-07-15T09:00:00Z",
    username: "diana",
    avatar_color: "#F59E0B",
    thread_reply_count: 0,
    is_pinned: true,
    reaction_summary: [buildReactionSummary("📌", [1])],
  },
];

// =============================================================================
// Threads — 5 threaded conversations referencing parent messages
// =============================================================================

export const mockThreads: Thread[] = [
  {
    id: 1,
    parent_message_id: 1,
    channel_id: 1,
    reply_count: 2,
    last_reply_at: "2024-07-10T09:25:00Z",
  },
  {
    id: 2,
    parent_message_id: 6,
    channel_id: 3,
    reply_count: 1,
    last_reply_at: "2024-07-10T14:00:00Z",
  },
  {
    id: 3,
    parent_message_id: 4,
    channel_id: 2,
    reply_count: 2,
    last_reply_at: "2024-07-10T10:45:00Z",
  },
  {
    id: 4,
    parent_message_id: 13,
    channel_id: 4,
    reply_count: 1,
    last_reply_at: "2024-07-11T09:30:00Z",
  },
  {
    id: 5,
    parent_message_id: 17,
    channel_id: 5,
    reply_count: 1,
    last_reply_at: "2024-07-11T13:15:00Z",
  },
];

// =============================================================================
// Reactions — 12 individual reactions across messages
// =============================================================================

export const mockReactions: Reaction[] = [
  { id: 1, message_id: 1, user_id: 2, emoji: "👋", created_at: "2024-07-10T09:02:00Z" },
  { id: 2, message_id: 1, user_id: 3, emoji: "👋", created_at: "2024-07-10T09:03:00Z" },
  { id: 3, message_id: 2, user_id: 1, emoji: "❤️", created_at: "2024-07-10T09:06:00Z" },
  { id: 4, message_id: 6, user_id: 3, emoji: "🚀", created_at: "2024-07-10T11:05:00Z" },
  { id: 5, message_id: 6, user_id: 1, emoji: "👍", created_at: "2024-07-10T11:10:00Z" },
  { id: 6, message_id: 7, user_id: 2, emoji: "✅", created_at: "2024-07-10T11:35:00Z" },
  { id: 7, message_id: 13, user_id: 4, emoji: "👀", created_at: "2024-07-11T09:05:00Z" },
  { id: 8, message_id: 15, user_id: 1, emoji: "👋", created_at: "2024-07-11T10:05:00Z" },
  { id: 9, message_id: 15, user_id: 2, emoji: "🎉", created_at: "2024-07-11T10:10:00Z" },
  { id: 10, message_id: 21, user_id: 2, emoji: "💯", created_at: "2024-07-12T10:05:00Z" },
  { id: 11, message_id: 24, user_id: 7, emoji: "👍", created_at: "2024-07-13T08:05:00Z" },
  { id: 12, message_id: 27, user_id: 1, emoji: "📌", created_at: "2024-07-15T09:05:00Z" },
];

// =============================================================================
// Direct Messages — 4 conversations
// =============================================================================

export const mockDMs: DirectMessage[] = [
  {
    id: 1,
    created_at: "2024-07-10T08:00:00Z",
    last_message_preview: "Thanks! No rush.",
    unread_count: 0,
    members: [mockUsers[0], mockUsers[1]],
  },
  {
    id: 2,
    created_at: "2024-07-10T12:00:00Z",
    last_message_preview: "Perfect, thanks!",
    unread_count: 1,
    members: [mockUsers[0], mockUsers[2]],
  },
  {
    id: 3,
    created_at: "2024-07-11T14:00:00Z",
    last_message_preview: "Yes, see you at 3pm!",
    unread_count: 0,
    members: [mockUsers[1], mockUsers[3]],
  },
  {
    id: 4,
    created_at: "2024-07-12T10:00:00Z",
    last_message_preview: "Let's do 2:30 then.",
    unread_count: 2,
    members: [mockUsers[0], mockUsers[3], mockUsers[4]],
  },
];

// =============================================================================
// DM Messages — 12 messages across 4 conversations
// =============================================================================

export const mockDmMessages: DmMessage[] = [
  // --- DM 1: alice ↔ bob ---
  {
    id: 1,
    dm_id: 1,
    user_id: 1,
    content: "Hey Bob, can you review my PR when you get a chance?",
    created_at: "2024-07-10T08:00:00Z",
    username: "alice",
    avatar_color: "#EF4444",
  },
  {
    id: 2,
    dm_id: 1,
    user_id: 2,
    content: "Sure, I'll take a look this afternoon!",
    created_at: "2024-07-10T08:05:00Z",
    username: "bob",
    avatar_color: "#3B82F6",
  },
  {
    id: 3,
    dm_id: 1,
    user_id: 1,
    content: "Thanks! No rush.",
    created_at: "2024-07-10T08:10:00Z",
    username: "alice",
    avatar_color: "#EF4444",
  },

  // --- DM 2: alice ↔ charlie ---
  {
    id: 4,
    dm_id: 2,
    user_id: 3,
    content: "Alice, do you have the design specs?",
    created_at: "2024-07-10T12:00:00Z",
    username: "charlie",
    avatar_color: "#10B981",
  },
  {
    id: 5,
    dm_id: 2,
    user_id: 1,
    content: "Yes, just uploaded them to the design channel.",
    created_at: "2024-07-10T12:10:00Z",
    username: "alice",
    avatar_color: "#EF4444",
  },
  {
    id: 6,
    dm_id: 2,
    user_id: 3,
    content: "Perfect, thanks!",
    created_at: "2024-07-10T12:15:00Z",
    username: "charlie",
    avatar_color: "#10B981",
  },

  // --- DM 3: bob ↔ diana ---
  {
    id: 7,
    dm_id: 3,
    user_id: 4,
    content: "Bob, are we still on for the 1:1?",
    created_at: "2024-07-11T14:00:00Z",
    username: "diana",
    avatar_color: "#F59E0B",
  },
  {
    id: 8,
    dm_id: 3,
    user_id: 2,
    content: "Yes, see you at 3pm!",
    created_at: "2024-07-11T14:05:00Z",
    username: "bob",
    avatar_color: "#3B82F6",
  },

  // --- DM 4: alice, diana, eve (group DM) ---
  {
    id: 9,
    dm_id: 4,
    user_id: 4,
    content: "Team, let's sync on the Q3 priorities.",
    created_at: "2024-07-12T10:00:00Z",
    username: "diana",
    avatar_color: "#F59E0B",
  },
  {
    id: 10,
    dm_id: 4,
    user_id: 1,
    content: "Sounds good, when works for everyone?",
    created_at: "2024-07-12T10:05:00Z",
    username: "alice",
    avatar_color: "#EF4444",
  },
  {
    id: 11,
    dm_id: 4,
    user_id: 5,
    content: "I'm free after 2pm today.",
    created_at: "2024-07-12T10:10:00Z",
    username: "eve",
    avatar_color: "#8B5CF6",
  },
  {
    id: 12,
    dm_id: 4,
    user_id: 4,
    content: "Let's do 2:30 then.",
    created_at: "2024-07-12T10:15:00Z",
    username: "diana",
    avatar_color: "#F59E0B",
  },
];

// =============================================================================
// Files — 6 shared files with varied types
// =============================================================================

export const mockFiles: FileItem[] = [
  {
    id: 1,
    name: "Q3-report.pdf",
    file_type: "pdf",
    file_size: 2048576,
    uploaded_by: 1,
    channel_id: 1,
    created_at: "2024-07-10T09:00:00Z",
    thumbnail_url: "/thumbnails/pdf-icon.png",
  },
  {
    id: 2,
    name: "architecture-diagram.png",
    file_type: "image",
    file_size: 512000,
    uploaded_by: 2,
    channel_id: 3,
    created_at: "2024-07-10T11:00:00Z",
    thumbnail_url: "/thumbnails/arch-diagram-thumb.png",
  },
  {
    id: 3,
    name: "meeting-notes.md",
    file_type: "markdown",
    file_size: 4096,
    uploaded_by: 3,
    channel_id: 2,
    created_at: "2024-07-10T14:00:00Z",
    thumbnail_url: "/thumbnails/md-icon.png",
  },
  {
    id: 4,
    name: "deploy-script.sh",
    file_type: "script",
    file_size: 1024,
    uploaded_by: 2,
    channel_id: 3,
    created_at: "2024-07-11T08:00:00Z",
    thumbnail_url: "/thumbnails/script-icon.png",
  },
  {
    id: 5,
    name: "brand-guidelines.pdf",
    file_type: "pdf",
    file_size: 3145728,
    uploaded_by: 6,
    channel_id: 4,
    created_at: "2024-07-11T09:00:00Z",
    thumbnail_url: "/thumbnails/pdf-icon.png",
  },
  {
    id: 6,
    name: "budget-q3.xlsx",
    file_type: "spreadsheet",
    file_size: 87654,
    uploaded_by: 4,
    channel_id: 5,
    created_at: "2024-07-12T14:30:00Z",
    thumbnail_url: "/thumbnails/xlsx-icon.png",
  },
];

// =============================================================================
// Saved Items — 4 bookmarked messages/files
// =============================================================================

export const mockSavedItems: SavedItem[] = [
  {
    id: 1,
    user_id: 1,
    message_id: 6,
    saved_at: "2024-07-10T12:00:00Z",
    source_channel: "engineering",
  },
  {
    id: 2,
    user_id: 2,
    message_id: 1,
    saved_at: "2024-07-10T09:30:00Z",
    source_channel: "general",
  },
  {
    id: 3,
    user_id: 1,
    file_id: 1,
    saved_at: "2024-07-10T10:00:00Z",
    source_channel: "general",
  },
  {
    id: 4,
    user_id: 1,
    message_id: 27,
    saved_at: "2024-07-15T09:10:00Z",
    source_channel: "announcements",
  },
];

// =============================================================================
// User Statuses — 4 active statuses
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
    user_id: 4,
    status_emoji: "📊",
    status_text: "In a meeting",
    expires_at: "2024-07-15T15:00:00Z",
  },
  {
    user_id: 7,
    status_emoji: "🏠",
    status_text: "Working from home",
  },
  {
    user_id: 8,
    status_emoji: "🔧",
    status_text: "On call",
    expires_at: "2024-07-16T08:00:00Z",
  },
];

// =============================================================================
// Workspace — single workspace metadata object
// =============================================================================

export const mockWorkspace: Workspace = {
  id: 1,
  name: "Acme Corp",
  icon_url: "/acme-icon.png",
  member_count: 3,
  plan: "pro",
  created_at: "2024-01-01T00:00:00Z",
};

// =============================================================================
// User Preferences — default preferences for user 1
// =============================================================================

export const mockPreferences: UserPreferences = {
  user_id: 1,
  notification_sound: true,
  notification_desktop: true,
  sidebar_sort: "alpha",
  theme: "light",
  language: "en",
  timezone: "UTC",
};

// =============================================================================
// Channel Members — 24 membership records across all channels
// =============================================================================

export const mockChannelMembers: ChannelMember[] = [
  // Channel 1 (general) — 8 members (all users)
  { channel_id: 1, user_id: 1, role: "admin", joined_at: "2024-01-15T10:00:00Z" },
  { channel_id: 1, user_id: 2, role: "member", joined_at: "2024-01-15T10:00:00Z" },
  { channel_id: 1, user_id: 3, role: "member", joined_at: "2024-01-15T10:00:00Z" },
  { channel_id: 1, user_id: 4, role: "member", joined_at: "2024-02-01T09:00:00Z" },
  { channel_id: 1, user_id: 5, role: "member", joined_at: "2024-02-01T09:00:00Z" },
  // Channel 2 (random) — 3 base members
  { channel_id: 2, user_id: 1, role: "admin", joined_at: "2024-01-15T10:00:00Z" },
  { channel_id: 2, user_id: 2, role: "member", joined_at: "2024-01-15T10:00:00Z" },
  { channel_id: 2, user_id: 3, role: "member", joined_at: "2024-01-15T10:00:00Z" },
  // Channel 3 (engineering) — 5 members
  { channel_id: 3, user_id: 2, role: "admin", joined_at: "2024-01-15T10:00:00Z" },
  { channel_id: 3, user_id: 3, role: "member", joined_at: "2024-01-15T10:00:00Z" },
  { channel_id: 3, user_id: 1, role: "member", joined_at: "2024-01-20T10:00:00Z" },
  { channel_id: 3, user_id: 5, role: "member", joined_at: "2024-02-05T10:00:00Z" },
  { channel_id: 3, user_id: 8, role: "member", joined_at: "2024-02-05T10:00:00Z" },
  // Channel 4 (design) — 5 members
  { channel_id: 4, user_id: 6, role: "admin", joined_at: "2024-02-15T10:00:00Z" },
  { channel_id: 4, user_id: 4, role: "member", joined_at: "2024-02-15T10:00:00Z" },
  { channel_id: 4, user_id: 5, role: "member", joined_at: "2024-02-15T10:00:00Z" },
  { channel_id: 4, user_id: 3, role: "member", joined_at: "2024-02-20T10:00:00Z" },
  { channel_id: 4, user_id: 7, role: "member", joined_at: "2024-02-20T10:00:00Z" },
  // Channel 5 (product) — 3 members
  { channel_id: 5, user_id: 4, role: "admin", joined_at: "2024-02-15T10:00:00Z" },
  { channel_id: 5, user_id: 7, role: "member", joined_at: "2024-02-15T10:00:00Z" },
  { channel_id: 5, user_id: 2, role: "member", joined_at: "2024-02-15T10:00:00Z" },
  // Channel 6 (devops) — 2 members
  { channel_id: 6, user_id: 8, role: "admin", joined_at: "2024-02-15T10:00:00Z" },
  { channel_id: 6, user_id: 7, role: "member", joined_at: "2024-02-15T10:00:00Z" },
  // Channel 8 (announcements) — 2 members
  { channel_id: 8, user_id: 4, role: "admin", joined_at: "2024-02-15T10:00:00Z" },
];

// =============================================================================
// Mentions — 5 @mention records
// =============================================================================

export const mockMentions: Mention[] = [
  {
    id: 1,
    message_id: 2,
    mentioned_user_id: 1,
    channel_id: 1,
    read: true,
    created_at: "2024-07-10T09:05:00Z",
  },
  {
    id: 2,
    message_id: 7,
    mentioned_user_id: 2,
    channel_id: 3,
    read: false,
    created_at: "2024-07-10T11:30:00Z",
  },
  {
    id: 3,
    message_id: 15,
    mentioned_user_id: 1,
    channel_id: 1,
    read: true,
    created_at: "2024-07-11T10:00:00Z",
  },
  {
    id: 4,
    message_id: 20,
    mentioned_user_id: 4,
    channel_id: 1,
    read: true,
    created_at: "2024-07-12T09:30:00Z",
  },
  {
    id: 5,
    message_id: 21,
    mentioned_user_id: 2,
    channel_id: 3,
    read: false,
    created_at: "2024-07-12T10:00:00Z",
  },
];

// =============================================================================
// Activity Items — 6 activity feed entries of varying types
// =============================================================================

export const mockActivityItems: ActivityItem[] = [
  {
    id: 1,
    type: "mention",
    message_id: 2,
    user_id: 2,
    channel_id: 1,
    created_at: "2024-07-10T09:05:00Z",
    content_preview: "Hey everyone, glad to be here!",
  },
  {
    id: 2,
    type: "thread_reply",
    message_id: 8,
    user_id: 2,
    channel_id: 1,
    created_at: "2024-07-10T09:20:00Z",
    content_preview: "Thanks for the warm welcome! Excited to collaborate.",
  },
  {
    id: 3,
    type: "reaction",
    message_id: 6,
    user_id: 3,
    channel_id: 3,
    created_at: "2024-07-10T11:05:00Z",
    content_preview: "🚀 reacted to: Just pushed the new deployment pipeline.",
  },
  {
    id: 4,
    type: "mention",
    message_id: 7,
    user_id: 3,
    channel_id: 3,
    created_at: "2024-07-10T11:30:00Z",
    content_preview: "Nice work! I will review it today.",
  },
  {
    id: 5,
    type: "channel_join",
    user_id: 4,
    channel_id: 1,
    created_at: "2024-07-11T09:55:00Z",
    content_preview: "diana joined #general",
  },
  {
    id: 6,
    type: "thread_reply",
    message_id: 10,
    user_id: 1,
    channel_id: 3,
    created_at: "2024-07-10T14:00:00Z",
    content_preview: "Reviewed the pipeline — looks solid. Ship it!",
  },
];

// =============================================================================
// Pinned Messages — 3 pinned messages across channels
// =============================================================================

export const mockPinnedMessages: PinnedMessage[] = [
  {
    message_id: 1,
    channel_id: 1,
    pinned_by: 1,
    created_at: "2024-07-10T09:01:00Z",
  },
  {
    message_id: 6,
    channel_id: 3,
    pinned_by: 2,
    created_at: "2024-07-10T11:01:00Z",
  },
  {
    message_id: 27,
    channel_id: 8,
    pinned_by: 4,
    created_at: "2024-07-15T09:01:00Z",
  },
];

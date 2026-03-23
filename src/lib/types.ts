/**
 * src/lib/types.ts — Shared TypeScript Interface Definitions
 *
 * This module serves as the single source of truth for all TypeScript type
 * definitions across the Slack clone application. It extracts and extends the
 * original inline interfaces from page.tsx (User, Channel, Message) and adds
 * all new data domain interfaces required by the expanded application.
 *
 * Design principles:
 * - Zero imports — this is a pure type definitions file with no runtime dependencies
 * - All interfaces use `export interface` for consistency
 * - All `id` fields are typed as `number` (matching SERIAL PRIMARY KEY in PostgreSQL)
 * - All timestamp fields are typed as `string` (ISO 8601 format from PostgreSQL)
 * - Optional fields use `?` suffix for backward compatibility with existing API responses
 * - Interface extensions (UserProfile extends User, BrowseChannel extends Channel)
 *   avoid duplication while providing narrowed types for specific use cases
 * - No `any` types — strict mode compliance throughout
 */

// =============================================================================
// Core Domain Interfaces (extracted and extended from page.tsx)
// =============================================================================

/**
 * Represents a workspace user.
 *
 * The base fields (id, username, avatar_color) are backward-compatible with
 * the original interface in page.tsx. Extended fields (created_at, status_emoji,
 * status_text, display_name, title) are optional to maintain compatibility
 * with existing API responses that do not include them.
 */
export interface User {
  /** Unique user identifier (SERIAL PRIMARY KEY) */
  id: number;
  /** Unique username for display and identification */
  username: string;
  /** Hex color code for avatar background (e.g., '#EF4444') */
  avatar_color: string;
  /** Timestamp when the user was created (ISO 8601) */
  created_at?: string;
  /** Emoji representing the user's current status (e.g., '🏠') */
  status_emoji?: string;
  /** Text description of the user's current status */
  status_text?: string;
  /** Optional display name (separate from username) */
  display_name?: string;
  /** Job title or role within the organization */
  title?: string;
}

/**
 * Represents a workspace channel.
 *
 * The base fields (id, name, description) are backward-compatible with the
 * original interface in page.tsx. Extended fields support channel browser,
 * sidebar badges, and message previews.
 */
export interface Channel {
  /** Unique channel identifier (SERIAL PRIMARY KEY) */
  id: number;
  /** Channel name (lowercase, hyphenated, unique) */
  name: string;
  /** Channel description or topic */
  description: string;
  /** User ID of the channel creator (FK to users table) */
  created_by?: number;
  /** Timestamp when the channel was created (ISO 8601) */
  created_at?: string;
  /** Display name of the channel creator (joined from users table) */
  creator_name?: string;
  /** Number of members in the channel */
  member_count?: number;
  /** Number of unread messages for the current user */
  unread_count?: number;
  /** Preview text of the most recent message in the channel */
  last_message_preview?: string;
}

/**
 * Aggregated reaction data for display on a message.
 *
 * Groups reactions by emoji with a count and list of user IDs who reacted.
 * Defined before Message because Message references this type.
 */
export interface ReactionSummary {
  /** The emoji used for this reaction (e.g., '👍', '❤️') */
  emoji: string;
  /** Total number of users who added this reaction */
  count: number;
  /** Array of user IDs who added this reaction */
  user_ids: number[];
}

/**
 * Represents a single chat message within a channel.
 *
 * The base fields (id, channel_id, user_id, content, created_at, username,
 * avatar_color) are backward-compatible with the original interface in page.tsx.
 * Extended fields support thread indicators, reactions, and pinned messages.
 */
export interface Message {
  /** Unique message identifier (SERIAL PRIMARY KEY) */
  id: number;
  /** Channel this message belongs to (FK to channels table) */
  channel_id: number;
  /** User who authored this message (FK to users table) */
  user_id: number;
  /** Text content of the message */
  content: string;
  /** Timestamp when the message was sent (ISO 8601) */
  created_at: string;
  /** Username of the message author (joined from users table) */
  username?: string;
  /** Avatar color of the message author (joined from users table) */
  avatar_color?: string;
  /** Number of replies in the message's thread (0 if no thread) */
  thread_reply_count?: number;
  /** Aggregated reaction data grouped by emoji */
  reaction_summary?: ReactionSummary[];
  /** Whether this message is pinned to the channel */
  is_pinned?: boolean;
}

// =============================================================================
// Thread and Reaction Interfaces
// =============================================================================

/**
 * Represents a message thread (a collection of replies to a parent message).
 *
 * Threads are created implicitly when the first reply is added to a message.
 * The thread tracks metadata about the reply chain.
 */
export interface Thread {
  /** Unique thread identifier (SERIAL PRIMARY KEY) */
  id: number;
  /** ID of the original message that started the thread */
  parent_message_id: number;
  /** Channel where the parent message resides */
  channel_id: number;
  /** Total number of replies in this thread */
  reply_count: number;
  /** Timestamp of the most recent reply (ISO 8601) */
  last_reply_at: string;
}

/**
 * Represents a single emoji reaction on a message.
 *
 * Each row represents one user's reaction with one emoji on one message.
 * Multiple reactions by different users with the same emoji are separate rows.
 */
export interface Reaction {
  /** Unique reaction identifier (SERIAL PRIMARY KEY) */
  id: number;
  /** Message this reaction is on (FK to messages table) */
  message_id: number;
  /** User who added this reaction (FK to users table) */
  user_id: number;
  /** The emoji character or shortcode used */
  emoji: string;
  /** Timestamp when the reaction was added (ISO 8601) */
  created_at: string;
}

// =============================================================================
// Direct Message Interfaces
// =============================================================================

/**
 * Represents a direct message conversation between two or more users.
 *
 * A DirectMessage is a conversation container (similar to a channel) that
 * holds DmMessage records. The members array contains the participating users.
 */
export interface DirectMessage {
  /** Unique DM conversation identifier (SERIAL PRIMARY KEY) */
  id: number;
  /** Timestamp when the DM conversation was created (ISO 8601) */
  created_at: string;
  /** Preview text of the most recent message in this conversation */
  last_message_preview?: string;
  /** Number of unread messages for the current user */
  unread_count?: number;
  /** Array of users participating in this DM conversation */
  members: User[];
}

/**
 * Represents a single message within a direct message conversation.
 *
 * Mirrors the structure of channel messages but references a DM conversation
 * instead of a channel.
 */
export interface DmMessage {
  /** Unique message identifier (SERIAL PRIMARY KEY) */
  id: number;
  /** DM conversation this message belongs to (FK to direct_messages table) */
  dm_id: number;
  /** User who authored this message (FK to users table) */
  user_id: number;
  /** Text content of the message */
  content: string;
  /** Timestamp when the message was sent (ISO 8601) */
  created_at: string;
  /** Username of the message author (joined from users table) */
  username?: string;
  /** Avatar color of the message author (joined from users table) */
  avatar_color?: string;
}

// =============================================================================
// File and Saved Item Interfaces
// =============================================================================

/**
 * Represents a file shared within the workspace.
 *
 * Files are associated with both a channel (where they were shared) and a user
 * (who uploaded them). The actual binary content is not stored in this record —
 * only metadata and an optional thumbnail URL.
 */
export interface FileItem {
  /** Unique file identifier (SERIAL PRIMARY KEY) */
  id: number;
  /** Original filename including extension */
  name: string;
  /** MIME type or file category (e.g., 'image/png', 'application/pdf') */
  type: string;
  /** File size in bytes */
  size: number;
  /** Channel where this file was shared (FK to channels table) */
  channel_id: number;
  /** User who uploaded this file (FK to users table) */
  user_id: number;
  /** Timestamp when the file was uploaded (ISO 8601) */
  created_at: string;
  /** URL to a thumbnail preview of the file */
  thumbnail_url?: string;
}

/**
 * Represents a bookmarked/saved item (message or file) for a user.
 *
 * Users can save messages or files for later reference. At least one of
 * message_id or file_id should be set (they are optional individually because
 * a saved item can be either a message or a file, but not both simultaneously).
 */
export interface SavedItem {
  /** Unique saved item identifier (SERIAL PRIMARY KEY) */
  id: number;
  /** User who saved this item (FK to users table) */
  user_id: number;
  /** ID of the saved message (FK to messages table), if applicable */
  message_id?: number;
  /** ID of the saved file (FK to files table), if applicable */
  file_id?: number;
  /** Timestamp when the item was saved (ISO 8601) */
  saved_at: string;
  /** Name of the channel where the saved item originated */
  source_channel?: string;
}

// =============================================================================
// User Status and Profile Interfaces
// =============================================================================

/**
 * Represents a user's current status (emoji + text with optional expiry).
 *
 * User statuses are displayed next to the user's name in the sidebar,
 * message list, and profile panel. Statuses can expire automatically.
 */
export interface UserStatus {
  /** User this status belongs to (FK to users table) */
  user_id: number;
  /** Emoji representing the status (e.g., '🏠', '🤒', '🌴') */
  emoji: string;
  /** Descriptive text for the status (e.g., 'Working from home') */
  text: string;
  /** Timestamp when this status expires and should be cleared (ISO 8601) */
  expiry?: string;
}

/**
 * Extended user profile with full contact and status information.
 *
 * Extends the base User interface with additional fields displayed in the
 * user profile side panel: timezone, email, phone, and full status object.
 * The `title` field is inherited from User.
 */
export interface UserProfile extends User {
  /** User's timezone (e.g., 'America/New_York', 'UTC') */
  timezone?: string;
  /** User's email address */
  email?: string;
  /** User's phone number */
  phone?: string;
  /** Full status object with emoji, text, and optional expiry */
  status?: UserStatus;
}

// =============================================================================
// Workspace and Preferences Interfaces
// =============================================================================

/**
 * Represents workspace-level metadata.
 *
 * Contains information about the Slack workspace displayed in the sidebar
 * header, workspace settings, and administration panels.
 */
export interface Workspace {
  /** Unique workspace identifier (SERIAL PRIMARY KEY) */
  id: number;
  /** Display name of the workspace */
  name: string;
  /** URL to the workspace icon/logo */
  icon_url?: string;
  /** Total number of members in the workspace */
  member_count: number;
  /** Workspace plan tier (e.g., 'free', 'pro', 'business+', 'enterprise') */
  plan: string;
  /** Timestamp when the workspace was created (ISO 8601) */
  created_at: string;
}

/**
 * Represents a user's application preferences and settings.
 *
 * Covers notification configuration, sidebar layout preferences, and
 * visual theme selection. Stored per-user in the user_preferences table.
 */
export interface UserPreferences {
  /** User these preferences belong to (FK to users table) */
  user_id: number;
  /** Notification delivery settings */
  notification_settings: {
    /** Whether desktop notifications are enabled */
    desktop: boolean;
    /** Whether mobile push notifications are enabled */
    mobile: boolean;
    /** Email notification frequency ('instant', 'hourly', 'daily', 'never') */
    email_frequency: string;
    /** Whether all notifications are muted */
    mute_all: boolean;
  };
  /** Sidebar display configuration */
  sidebar_config: {
    /** Whether to show all channels or only joined channels */
    show_all_channels: boolean;
    /** Sort order for sidebar items ('alpha', 'recent', 'priority') */
    sort_order: string;
    /** Array of sidebar section IDs that are collapsed */
    collapsed_sections: string[];
  };
  /** Visual theme identifier ('light', 'dark', 'system', or custom theme name) */
  theme: string;
}

// =============================================================================
// Channel Membership and Mentions
// =============================================================================

/**
 * Represents a user's membership in a channel.
 *
 * Tracks which users belong to which channels, their role within the channel,
 * and when they joined.
 */
export interface ChannelMember {
  /** Channel this membership is for (FK to channels table) */
  channel_id: number;
  /** User who is a member (FK to users table) */
  user_id: number;
  /** User's role in the channel ('member', 'admin', 'owner') */
  role: string;
  /** Timestamp when the user joined the channel (ISO 8601) */
  joined_at: string;
}

/**
 * Represents an @mention of a user in a message.
 *
 * Mentions are extracted from message content and stored separately to
 * enable efficient querying for the activity feed and notification system.
 */
export interface Mention {
  /** Unique mention identifier (SERIAL PRIMARY KEY) */
  id: number;
  /** Message containing the mention (FK to messages table) */
  message_id: number;
  /** User who was mentioned (FK to users table) */
  user_id: number;
  /** Channel where the mention occurred (FK to channels table) */
  channel_id: number;
  /** Timestamp when the mention was created (ISO 8601) */
  created_at: string;
}

// =============================================================================
// Activity and Search Interfaces
// =============================================================================

/**
 * Represents a single item in the activity/mentions feed.
 *
 * Activity items aggregate various notification types (mentions, thread replies,
 * reactions, app notifications) into a unified feed sorted by recency.
 */
export interface ActivityItem {
  /** Unique activity item identifier (SERIAL PRIMARY KEY) */
  id: number;
  /** Type of activity ('mention', 'thread_reply', 'reaction', 'app_notification') */
  type: string;
  /** Related message ID, if applicable (FK to messages table) */
  message_id?: number;
  /** User who triggered the activity (FK to users table) */
  user_id: number;
  /** Channel where the activity occurred, if applicable (FK to channels table) */
  channel_id?: number;
  /** Timestamp when the activity occurred (ISO 8601) */
  created_at: string;
  /** Preview text of the activity content for display in the feed */
  content_preview?: string;
}

/**
 * Represents a single search result item.
 *
 * Search results can be messages, channels, or files. The `type` field
 * discriminates the union, and `item` contains the full object. Highlights
 * contain text fragments with matching terms for display emphasis.
 */
export interface SearchResult {
  /** Discriminator indicating the type of search result */
  type: "message" | "channel" | "file";
  /** The matched item — a Message, Channel, or FileItem depending on type */
  item: Message | Channel | FileItem;
  /** Array of highlighted text fragments containing search term matches */
  highlights?: string[];
}

// =============================================================================
// Pin and Browse Interfaces
// =============================================================================

/**
 * Represents a pinned message within a channel.
 *
 * Pinned messages are surfaced in the channel details panel and provide
 * quick access to important messages. Tracks who pinned the message and when.
 */
export interface PinnedMessage {
  /** ID of the pinned message (FK to messages table) */
  message_id: number;
  /** Channel where the message is pinned (FK to channels table) */
  channel_id: number;
  /** User who pinned the message (FK to users table) */
  pinned_by: number;
  /** Timestamp when the message was pinned (ISO 8601) */
  pinned_at: string;
}

/**
 * Extended channel interface for the channel browser view.
 *
 * Extends the base Channel interface and narrows certain optional fields
 * to required, since the browse view always displays these fields.
 * Specifically, `member_count` and `created_at` become required properties.
 */
export interface BrowseChannel extends Channel {
  /** Number of members in the channel (required for browse view) */
  member_count: number;
  /** Timestamp when the channel was created (required for browse view, ISO 8601) */
  created_at: string;
}

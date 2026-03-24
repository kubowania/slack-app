"use client";

/**
 * MessageBubble — Single Message Rendering Component
 *
 * Renders a single chat message with:
 * - User avatar (via UserAvatar component)
 * - Username and timestamp header
 * - Message text content
 * - Reactions bar (emoji + count for each reaction)
 * - Thread reply indicator (reply count with link)
 * - Hover actions toolbar (react, reply, pin, bookmark, more)
 * - Pinned badge indicator
 *
 * Extracted and enhanced from src/app/page.tsx (lines 199–221).
 * Preserves all original visual patterns (colors, fonts, spacing) while
 * adding new features (reactions, threads, hover actions) as enhancements.
 *
 * CSS dependencies from globals.css:
 * - .message-hover       — applies hover background (var(--slack-hover-bg))
 * - .message-actions      — opacity 0→1 transition on parent hover
 * - .message-hover:hover .message-actions — reveals the actions toolbar
 */

import { useState } from "react";
import type { Message, ReactionSummary } from "@/lib/types";
import UserAvatar from "@/app/components/UserAvatar";
import EmojiPicker from "@/app/components/EmojiPicker";

/* -------------------------------------------------------------------------- */
/*  Props Interface                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Props for the MessageBubble component.
 *
 * Required: `message` — the Message data object to render.
 * Optional callbacks enable parent components to handle user interactions
 * (thread navigation, emoji reactions, user profile viewing).
 */
export interface MessageBubbleProps {
  /** The message data object containing all fields for rendering */
  message: Message;
  /** Called when user clicks "N replies" or the thread reply action button */
  onThreadClick?: (messageId: number) => void;
  /** Called when user clicks an existing reaction emoji badge */
  onReactionClick?: (messageId: number, emoji: string) => void;
  /** Called when user clicks the username or avatar to view profile */
  onUserClick?: (userId: number) => void;
  /** Compact mode reduces spacing — used for thread reply messages */
  compact?: boolean;
  /** Whether to show the hover actions toolbar (defaults to true) */
  showHoverActions?: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Helper Functions                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Formats an ISO 8601 date string into a human-readable time.
 * Extracted from page.tsx lines 110–115 — preserves exact behavior.
 *
 * @param dateStr - ISO 8601 timestamp string from the database
 * @returns Formatted time string (e.g., "2:30 PM", "11:05 AM")
 */
const formatTime = (dateStr: string): string => {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function MessageBubble({
  message,
  onThreadClick,
  onReactionClick,
  onUserClick,
  compact = false,
  showHoverActions = true,
}: MessageBubbleProps) {
  /* ---- Component State ---- */

  /** Tracks mouse hover for showing action buttons and managing reaction picker */
  const [isHovered, setIsHovered] = useState<boolean>(false);

  /** Toggle state for the reaction picker overlay (future: EmojiPicker component) */
  const [showReactionPicker, setShowReactionPicker] = useState<boolean>(false);

  /* ---- Derived Values ---- */

  /** Safe username fallback — prevents crashes on missing data */
  const username: string = message.username || "?";

  /** Safe avatar color fallback */
  const avatarColor: string = message.avatar_color || "#999";

  /** Whether reaction badges should render below the message */
  const hasReactions: boolean =
    Array.isArray(message.reaction_summary) &&
    message.reaction_summary.length > 0;

  /** Whether the thread reply indicator should render */
  const hasThreadReplies: boolean =
    typeof message.thread_reply_count === "number" &&
    message.thread_reply_count > 0;

  /** Whether the pinned badge should display */
  const isPinned: boolean = message.is_pinned === true;

  /** Build human-readable thread reply label ("1 reply" / "N replies") */
  const threadLabel: string = hasThreadReplies
    ? message.thread_reply_count === 1
      ? "1 reply"
      : `${message.thread_reply_count} replies`
    : "";

  /**
   * Container classes.
   * - .message-hover — from globals.css, applies hover background
   * - Compact mode uses smaller gaps (gap-2, py-1) for thread replies
   * - Standard mode uses original-matching gaps (gap-3, py-1.5)
   * - `group` enables Tailwind group-based child selectors
   * - `relative` positions the hover actions toolbar
   */
  const containerClasses: string = compact
    ? "message-hover flex items-start gap-2 px-4 py-1 relative group"
    : "message-hover flex items-start gap-3 px-4 py-1.5 relative group";

  /* ---- Event Handlers ---- */

  /** Show hover state and toolbar on mouse enter */
  const handleMouseEnter = (): void => {
    setIsHovered(true);
  };

  /** Hide hover state, toolbar, and reaction picker on mouse leave */
  const handleMouseLeave = (): void => {
    setIsHovered(false);
    setShowReactionPicker(false);
  };

  /** Handle username click — invokes onUserClick callback */
  const handleUserClick = (): void => {
    onUserClick?.(message.user_id);
  };

  /** Handle keyboard activation on username (Enter or Space) */
  const handleUserKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>): void => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onUserClick?.(message.user_id);
    }
  };

  /** Handle reaction badge click — invokes onReactionClick callback */
  const handleReactionClick = (emoji: string): void => {
    onReactionClick?.(message.id, emoji);
  };

  /** Handle thread reply link click — invokes onThreadClick callback */
  const handleThreadClick = (): void => {
    onThreadClick?.(message.id);
  };

  /** Toggle the reaction picker overlay */
  const handleToggleReactionPicker = (): void => {
    setShowReactionPicker((prev) => !prev);
  };

  /* ---- Render ---- */

  return (
    <div
      className={containerClasses}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* ================================================================== */}
      {/* Avatar — delegates rendering to the UserAvatar component           */}
      {/* Original: w-9 h-9 rounded-md with colored background + initial    */}
      {/* UserAvatar "md" size matches source dimensions exactly             */}
      {/* ================================================================== */}
      <UserAvatar
        username={username}
        avatarColor={avatarColor}
        size={compact ? "sm" : "md"}
        onClick={
          onUserClick ? () => onUserClick(message.user_id) : undefined
        }
      />

      {/* ================================================================== */}
      {/* Content Section — username, timestamp, content, reactions, thread  */}
      {/* ================================================================== */}
      <div className="flex-1 min-w-0">
        {/* ---- Name + Timestamp Row (EXACT from source page.tsx) ---- */}
        <div className="flex items-baseline gap-2">
          <span
            className="font-bold text-gray-900 text-sm hover:underline cursor-pointer"
            onClick={handleUserClick}
            role="button"
            tabIndex={0}
            onKeyDown={handleUserKeyDown}
          >
            {username}
          </span>
          <span className="text-xs text-gray-400">
            {formatTime(message.created_at)}
          </span>

          {/* Pinned badge — small pin icon next to timestamp */}
          {isPinned && (
            <span
              className="text-xs text-yellow-600 ml-1"
              role="img"
              aria-label="Pinned message"
            >
              📌
            </span>
          )}
        </div>

        {/* ---- Message Content (EXACT from source page.tsx) ---- */}
        <p className="text-gray-700 text-sm">{message.content}</p>

        {/* ---- Reactions Bar (NEW — not in source) ---- */}
        {hasReactions && (
          <div
            className="flex flex-wrap gap-1 mt-1"
            role="group"
            aria-label="Message reactions"
          >
            {(message.reaction_summary as ReactionSummary[]).map(
              (reaction: ReactionSummary) => (
                <button
                  key={reaction.emoji}
                  type="button"
                  className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs border border-gray-200 hover:border-[#1164A3] cursor-pointer"
                  onClick={() => handleReactionClick(reaction.emoji)}
                  aria-label={`${reaction.emoji} reaction, ${reaction.count} ${
                    reaction.count === 1 ? "person" : "people"
                  }`}
                >
                  <span aria-hidden="true">{reaction.emoji}</span>
                  <span>{reaction.count}</span>
                </button>
              )
            )}
          </div>
        )}

        {/* ---- Thread Reply Indicator (NEW — not in source) ---- */}
        {hasThreadReplies && (
          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              className="text-xs text-[#1164A3] font-medium hover:underline cursor-pointer"
              onClick={handleThreadClick}
            >
              {threadLabel}
            </button>
          </div>
        )}
      </div>

      {/* ================================================================== */}
      {/* Hover Actions Toolbar (NEW — not in source)                        */}
      {/*                                                                    */}
      {/* Only rendered when hovered AND showHoverActions is true.            */}
      {/* Uses .message-actions CSS class from globals.css for transition:    */}
      {/*   .message-actions { opacity: 0; transition: opacity 0.1s ease; } */}
      {/*   .message-hover:hover .message-actions { opacity: 1; }           */}
      {/* ================================================================== */}
      {showHoverActions && isHovered && (
        <div
          className="message-actions absolute top-0 right-4 flex items-center gap-0.5 bg-white border border-gray-200 rounded shadow-sm"
          role="toolbar"
          aria-label="Message actions"
        >
          {/* React — toggle emoji reaction picker */}
          <button
            type="button"
            className="p-1 rounded hover:bg-gray-100 text-gray-500 text-xs"
            onClick={handleToggleReactionPicker}
            aria-label="Add reaction"
            aria-pressed={showReactionPicker}
          >
            😀
          </button>

          {/* Reply in thread */}
          <button
            type="button"
            className="p-1 rounded hover:bg-gray-100 text-gray-500 text-xs"
            onClick={handleThreadClick}
            aria-label="Reply in thread"
          >
            💬
          </button>

          {/* Pin message (not yet connected to an action flow) */}
          <button
            type="button"
            className="p-1 rounded hover:bg-gray-100 text-gray-400 text-xs"
            aria-label="Pin message"
            aria-disabled="true"
          >
            📌
          </button>

          {/* Bookmark / save for later (not yet connected to an action flow) */}
          <button
            type="button"
            className="p-1 rounded hover:bg-gray-100 text-gray-400 text-xs"
            aria-label="Save for later"
            aria-disabled="true"
          >
            🔖
          </button>

          {/* More actions overflow (not yet connected to an action flow) */}
          <button
            type="button"
            className="p-1 rounded hover:bg-gray-100 text-gray-400 text-xs"
            aria-label="More actions"
            aria-disabled="true"
          >
            ⋯
          </button>
        </div>
      )}

      {/* Emoji Picker overlay — rendered when reaction button is toggled */}
      {showReactionPicker && (
        <div className="absolute top-8 right-4 z-50">
          <EmojiPicker
            isOpen={showReactionPicker}
            onClose={() => setShowReactionPicker(false)}
            onEmojiSelect={(emoji: string) => {
              handleReactionClick(emoji);
              setShowReactionPicker(false);
            }}
            position="bottom"
          />
        </div>
      )}
    </div>
  );
}

"use client";

/**
 * ThreadPanel — Right-side Thread Reply Panel Component
 *
 * Renders a slide-in panel on the right side of the main content area showing
 * threaded replies to a selected parent message. Creates a three-column layout
 * (sidebar + main content + thread panel) when open.
 *
 * Features:
 * - Header with "Thread" title, reply count, channel reference, and close button
 * - Parent message display at the top (via MessageBubble component)
 * - Reply count divider
 * - Scrollable list of threaded replies (compact MessageBubble instances)
 * - Reply input at the bottom (via MessageInput component)
 * - 3-second polling for new replies (matching established polling pattern)
 * - Auto-scroll to bottom on new replies
 * - Loading state indicator during initial fetch
 * - Participant avatar indicators in the thread header
 *
 * Color palette (from Slack design tokens):
 *   #1164A3 — reply count text, focus ring (active channel blue)
 *   #007A5A — send button green
 *   bg-white — panel background
 *   border-gray-200 — separator borders
 *
 * CSS dependency from globals.css:
 *   .thread-panel-enter — slide-in animation (translateX 100% → 0)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import type { Message } from "@/lib/types";
import MessageBubble from "@/app/components/MessageBubble";
import MessageInput from "@/app/components/MessageInput";
import UserAvatar from "@/app/components/UserAvatar";

/* -------------------------------------------------------------------------- */
/*  Props Interface                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Props for the ThreadPanel component.
 *
 * @property parentMessage - The root message whose thread is displayed
 * @property isOpen - Controls visibility of the panel
 * @property onClose - Callback invoked when the user closes the panel
 * @property currentUserId - Optional current user ID for sending replies
 */
export interface ThreadPanelProps {
  /** The parent message whose thread replies are shown */
  parentMessage: Message;
  /** Whether the thread panel is visible */
  isOpen: boolean;
  /** Callback invoked when the user clicks the close button */
  onClose: () => void;
  /** Optional current user ID for sending thread replies */
  currentUserId?: number;
  /** Optional channel or DM name displayed in the thread header ("in #channel") */
  channelName?: string;
}

/* -------------------------------------------------------------------------- */
/*  Helper: Deduplicate participant avatars from replies                       */
/* -------------------------------------------------------------------------- */

/**
 * Extracts unique participants from replies for display in the header.
 * Returns up to 3 unique participants by user_id, preserving order of
 * first appearance.
 */
function getUniqueParticipants(
  replies: Message[],
  maxCount: number = 3
): { user_id: number; username: string; avatar_color: string }[] {
  const seen = new Set<number>();
  const result: { user_id: number; username: string; avatar_color: string }[] =
    [];
  for (const reply of replies) {
    if (seen.has(reply.user_id)) continue;
    seen.add(reply.user_id);
    result.push({
      user_id: reply.user_id,
      username: reply.username || "?",
      avatar_color: reply.avatar_color || "#999",
    });
    if (result.length >= maxCount) break;
  }
  return result;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function ThreadPanel({
  parentMessage,
  isOpen,
  onClose,
  currentUserId,
  channelName,
}: ThreadPanelProps) {
  /* ---- State ---- */

  /** Thread replies fetched from the API */
  const [replies, setReplies] = useState<Message[]>([]);

  /** Whether the initial fetch is in progress */
  const [loading, setLoading] = useState<boolean>(false);

  /** Fallback user ID fetched from /api/users when currentUserId is not provided */
  const [fetchedUserId, setFetchedUserId] = useState<number | null>(null);

  /** Ref for auto-scrolling to the bottom of the replies list */
  const repliesEndRef = useRef<HTMLDivElement>(null);

  /* ---- Derived Values ---- */

  /** Effective user ID: prefer the prop, fall back to fetched user */
  const effectiveUserId: number | null = currentUserId ?? fetchedUserId;

  /** Stable parent message ID for dependency arrays */
  const parentMessageId: number | undefined = parentMessage?.id;

  /** Channel ID from the parent message for display context */
  const parentChannelId: number | undefined = parentMessage?.channel_id;

  /** Reply count from the parent message or from the loaded replies array */
  const replyCount: number =
    replies.length > 0
      ? replies.length
      : parentMessage?.thread_reply_count ?? 0;

  /** Unique participants for the header avatar row */
  const participants = getUniqueParticipants(replies);

  /* ---- Fetch fallback user when no currentUserId prop is supplied ---- */

  useEffect(() => {
    if (currentUserId !== undefined && currentUserId !== null) return;
    let cancelled = false;
    fetch("/api/users")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch users");
        return r.json();
      })
      .then((data: { id: number }[]) => {
        if (!cancelled && data.length > 0) {
          setFetchedUserId(data[0].id);
        }
      })
      .catch(() => {
        /* Silently handle — reply sending will be disabled */
      });
    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  /* ---- Memoized fetch replies (mirrors source page.tsx polling pattern) ---- */

  const fetchReplies = useCallback(() => {
    if (!parentMessageId) return;
    fetch(`/api/messages/${parentMessageId}/thread`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch thread");
        return r.json();
      })
      .then((data: Message[] | { parent: Message; replies: Message[] }) => {
        /* Handle both array and { parent, replies } response shapes */
        if (Array.isArray(data)) {
          setReplies(data);
        } else if (data && data.replies) {
          setReplies(data.replies);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [parentMessageId]);

  /* ---- Initial fetch when panel opens or parent message changes ---- */

  useEffect(() => {
    if (isOpen && parentMessageId) {
      setLoading(true);
      setReplies([]);
      fetchReplies();
    }
  }, [isOpen, parentMessageId, fetchReplies]);

  /* ---- 3-second polling for new replies (established pattern) ---- */

  useEffect(() => {
    if (!isOpen || !parentMessageId) return;
    const interval = setInterval(fetchReplies, 3000);
    return () => clearInterval(interval);
  }, [isOpen, parentMessageId, fetchReplies]);

  /* ---- Auto-scroll to bottom on new replies ---- */

  useEffect(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies]);

  /* ---- Send reply handler ---- */

  const handleSendReply = useCallback(
    async (content: string) => {
      if (!content.trim() || !parentMessageId || !effectiveUserId) return;
      try {
        const response = await fetch(
          `/api/messages/${parentMessageId}/thread`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: effectiveUserId,
              content: content.trim(),
            }),
          }
        );
        if (!response.ok) throw new Error("Failed to send reply");
        /* Immediately refresh the replies list */
        fetchReplies();
      } catch {
        /* Silently handle send errors — the UI remains stable */
      }
    },
    [parentMessageId, effectiveUserId, fetchReplies]
  );

  /* ---- Handle keyboard shortcut for closing (Escape) ---- */

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  /* ---- Don't render if not open ---- */

  if (!isOpen) return null;

  /* ---- Render ---- */

  return (
    <aside
      className="w-96 border-l border-gray-200 bg-white flex flex-col h-full thread-panel-enter"
      role="complementary"
      aria-label="Thread panel"
    >
      {/* ================================================================== */}
      {/* Thread Header                                                       */}
      {/* ================================================================== */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
        <div className="flex items-center min-w-0">
          <h2 className="text-sm font-bold text-gray-900">Thread</h2>
          {replyCount > 0 && (
            <span className="text-xs text-gray-500 ml-2">
              {replyCount} {replyCount === 1 ? "reply" : "replies"}
            </span>
          )}
          {(channelName || parentChannelId !== undefined) && (
            <span className="text-xs text-gray-400 ml-2 truncate">
              in #{channelName || "channel"}
            </span>
          )}
        </div>

        {/* Participant avatars — up to 3 unique reply authors */}
        {participants.length > 0 && (
          <div
            className="flex items-center -space-x-1 mr-2"
            aria-label="Thread participants"
          >
            {participants.map((p) => (
              <UserAvatar
                key={p.user_id}
                username={p.username}
                avatarColor={p.avatar_color}
                size="sm"
              />
            ))}
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          type="button"
          aria-label="Close thread panel"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M4 4l8 8M12 4l-8 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* ================================================================== */}
      {/* Parent Message                                                      */}
      {/* ================================================================== */}
      <div className="border-b border-gray-200 px-4 py-3 shrink-0">
        <MessageBubble message={parentMessage} showHoverActions={false} />
      </div>

      {/* ================================================================== */}
      {/* Reply Count Divider                                                 */}
      {/* ================================================================== */}
      {replies.length > 0 && (
        <div className="text-xs text-[#1164A3] font-medium px-4 py-2 border-b border-gray-100 shrink-0">
          {replies.length} {replies.length === 1 ? "reply" : "replies"}
        </div>
      )}

      {/* ================================================================== */}
      {/* Replies List (scrollable)                                           */}
      {/* ================================================================== */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {loading ? (
          /* Loading state — pulsing skeleton placeholders */
          <div className="flex flex-col gap-3 py-2" aria-busy="true">
            <div className="flex items-start gap-2 animate-pulse">
              <div className="w-6 h-6 rounded-md bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-24" />
                <div className="h-3 bg-gray-200 rounded w-48" />
              </div>
            </div>
            <div className="flex items-start gap-2 animate-pulse">
              <div className="w-6 h-6 rounded-md bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-20" />
                <div className="h-3 bg-gray-200 rounded w-36" />
              </div>
            </div>
          </div>
        ) : replies.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p className="text-sm">No replies yet</p>
            <p className="text-xs mt-1">Be the first to reply</p>
          </div>
        ) : (
          /* Reply list — each reply in compact MessageBubble */
          replies.map((reply) => (
            <MessageBubble
              key={reply.id}
              message={reply}
              compact
              showHoverActions={false}
            />
          ))
        )}
        <div ref={repliesEndRef} />
      </div>

      {/* ================================================================== */}
      {/* Reply Input                                                         */}
      {/* ================================================================== */}
      <div className="shrink-0">
        <MessageInput
          channelName="thread"
          onSendMessage={handleSendReply}
          placeholder="Reply..."
          compact
          disabled={effectiveUserId === null}
        />
      </div>
    </aside>
  );
}

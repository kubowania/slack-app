"use client";

/**
 * ThreadPanel — Right-side Thread Reply Panel Component
 *
 * Renders a slide-in panel on the right side of the main content area showing
 * threaded replies to a selected parent message. Creates a three-column layout
 * (sidebar + main content + thread panel) when open.
 *
 * Features:
 * - Header with "Thread" title and close button
 * - Parent message display at the top
 * - Reply count divider
 * - Scrollable list of threaded replies
 * - Reply input at the bottom
 * - 3-second polling for new replies (matching established polling pattern)
 * - Auto-scroll to bottom on new replies
 *
 * Color palette (from Slack design tokens):
 *   #1164A3 — reply count text (active channel blue)
 *   bg-white — panel background
 *   border-gray-200 — separator borders
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import MessageBubble from "@/app/components/MessageBubble";
import MessageInput from "@/app/components/MessageInput";
import type { Message } from "@/lib/types";

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
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function ThreadPanel({
  parentMessage,
  isOpen,
  onClose,
  currentUserId,
}: ThreadPanelProps) {
  /* ---- State ---- */
  const [replies, setReplies] = useState<Message[]>([]);
  const [fetchedUserId, setFetchedUserId] = useState<number | null>(null);
  const repliesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Resolve the effective user ID: prefer the prop, fall back to the first
   * user fetched from /api/users. useMemo avoids the synchronous-setState-
   * in-effect lint violation.
   */
  const effectiveUserId = useMemo(
    () => currentUserId ?? fetchedUserId,
    [currentUserId, fetchedUserId]
  );

  /* ---- Fetch fallback user when no currentUserId prop is supplied ---- */
  useEffect(() => {
    if (currentUserId) return;
    fetch("/api/users")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch users");
        return r.json();
      })
      .then((data: { id: number }[]) => {
        if (data.length > 0) setFetchedUserId(data[0].id);
      })
      .catch(() => {
        // Silently handle — reply sending will be disabled
      });
  }, [currentUserId]);

  /* ---- Memoized fetch replies (mirrors source page.tsx polling pattern) ---- */
  const parentMessageId = parentMessage?.id;
  const fetchReplies = useCallback(() => {
    if (!parentMessageId) return;
    fetch(`/api/messages/${parentMessageId}/thread`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch thread");
        return r.json();
      })
      .then((data: Message[] | { parent: Message; replies: Message[] }) => {
        if (Array.isArray(data)) {
          setReplies(data);
        } else if (data && data.replies) {
          setReplies(data.replies);
        }
      })
      .catch(() => {
        // Silently handle fetch errors
      });
  }, [parentMessageId]);

  /* ---- Initial fetch when parent message changes ---- */
  useEffect(() => {
    if (isOpen && parentMessage?.id) {
      fetchReplies();
    }
  }, [isOpen, parentMessage?.id, fetchReplies]);

  /* ---- 3-second polling for new replies (established pattern) ---- */
  useEffect(() => {
    if (!isOpen || !parentMessage?.id) return;
    const interval = setInterval(fetchReplies, 3000);
    return () => clearInterval(interval);
  }, [isOpen, parentMessage?.id, fetchReplies]);

  /* ---- Auto-scroll to bottom on new replies ---- */
  useEffect(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies]);

  /* ---- Send reply handler ---- */
  const handleSendReply = async (content: string) => {
    if (!content.trim() || !parentMessageId || !effectiveUserId) return;

    try {
      await fetch(`/api/messages/${parentMessageId}/thread`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: effectiveUserId, content }),
      });
      fetchReplies();
    } catch {
      // Silently handle send errors
    }
  };

  /* ---- Don't render if not open ---- */
  if (!isOpen) return null;

  /* ---- Render ---- */
  return (
    <aside className="w-[400px] border-l border-gray-200 bg-white flex flex-col h-full thread-panel-enter">
      {/* ================================================================ */}
      {/* Thread Header                                                     */}
      {/* ================================================================ */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
        <h2 className="text-lg font-bold text-gray-900">Thread</h2>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          type="button"
          aria-label="Close thread panel"
        >
          <span className="text-xl leading-none" aria-hidden="true">✕</span>
        </button>
      </div>

      {/* ================================================================ */}
      {/* Parent Message                                                    */}
      {/* ================================================================ */}
      <div className="px-4 py-4 border-b border-gray-200 shrink-0">
        <MessageBubble message={parentMessage} showHoverActions={false} />
      </div>

      {/* ================================================================ */}
      {/* Reply Count Divider                                               */}
      {/* ================================================================ */}
      {replies.length > 0 && (
        <div className="px-4 py-2 text-xs text-[#1164A3] font-medium border-b border-gray-100 shrink-0">
          {replies.length} {replies.length === 1 ? "reply" : "replies"}
        </div>
      )}

      {/* ================================================================ */}
      {/* Replies List (scrollable)                                         */}
      {/* ================================================================ */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {replies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p className="text-sm">No replies yet</p>
            <p className="text-xs mt-1">Be the first to reply</p>
          </div>
        ) : (
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

      {/* ================================================================ */}
      {/* Reply Input                                                       */}
      {/* ================================================================ */}
      <div className="shrink-0">
        <MessageInput
          channelName="thread"
          onSendMessage={handleSendReply}
          placeholder="Reply..."
          compact
        />
      </div>
    </aside>
  );
}

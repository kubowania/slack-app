"use client";

/**
 * ThreadPage — Dedicated Full-Page Thread View
 *
 * Renders a complete thread view for viewing and replying to a specific parent
 * message's thread. This is the full-page thread experience used for narrow
 * viewports where the three-column layout (sidebar + main + thread panel) is
 * not feasible.
 *
 * Route: /(workspace)/thread/[id]
 * - [id] is the parent message ID whose thread replies are displayed
 *
 * Features:
 * - Parent message displayed prominently at top
 * - Reply count divider between parent and replies
 * - Scrollable list of threaded replies with compact MessageBubble rendering
 * - Reply input at the bottom for composing new thread replies
 * - 3-second polling for real-time reply updates (matching source page.tsx)
 * - Auto-scroll to bottom on new replies (matching source page.tsx)
 * - Back/close navigation to return to previous page
 *
 * Data Flow:
 * - GET /api/messages/{id}/thread → fetches thread data
 * - POST /api/messages/{id}/thread → sends new reply
 * - GET /api/users → fetches current user (first user default)
 *
 * Patterns preserved from src/app/page.tsx:
 * - useState hooks for state management
 * - useCallback for memoized fetch function
 * - 3-second polling interval with setInterval/clearInterval cleanup
 * - Auto-scroll via useRef + scrollIntoView({ behavior: "smooth" })
 * - use() hook for unwrapping async route params (Next.js 16 + React 19)
 */

import { use, useState, useEffect, useRef, useCallback } from "react";
import { useRouter, notFound } from "next/navigation";
import MessageBubble from "@/app/components/MessageBubble";
import MessageInput from "@/app/components/MessageInput";
import { useWorkspace } from "@/app/providers";
import type { Message } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/*  Props Interface                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Page props for the thread view route.
 * In Next.js 16 App Router, page params are async — typed as Promise.
 * Client components must use React 19's use() hook to unwrap them.
 */
interface ThreadPageProps {
  params: Promise<{ id: string }>;
}

/* -------------------------------------------------------------------------- */
/*  Page Component                                                            */
/* -------------------------------------------------------------------------- */

export default function ThreadPage({ params }: ThreadPageProps) {
  /* ==== Route Parameter Extraction (Next.js 16 + React 19 pattern) ==== */
  /* In client components, use React 19 use() hook — NOT await.           */
  const { id } = use(params);

  /** Validate route parameter is numeric — prevents SQL errors from invalid URLs */
  const numericId = Number(id);
  if (isNaN(numericId)) {
    notFound();
  }
  const messageId = id;

  /* ==== Navigation ==== */
  const router = useRouter();

  /* ==== Shared State from WorkspaceProvider ==== */

  /**
   * Consume the shared currentUser from WorkspaceProvider via useWorkspace().
   * This ensures Sidebar user-switching propagates to thread reply sending —
   * fixing the state fragmentation from the monolith decomposition.
   */
  const { currentUser } = useWorkspace();

  /* ==== State ==== */

  /** The parent message whose thread is being viewed */
  const [parentMessage, setParentMessage] = useState<Message | null>(null);

  /** Thread reply messages displayed in the scrollable list */
  const [replies, setReplies] = useState<Message[]>([]);

  /** Loading state while initial thread data is being fetched */
  const [loading, setLoading] = useState(true);

  /* ==== Auto-Scroll Ref (matches source page.tsx line 36) ==== */

  /** Invisible anchor element at the bottom of replies list for smooth scroll */
  const repliesEndRef = useRef<HTMLDivElement>(null);

  /* ==== Unified Thread Fetch (single reusable function) ==== */

  /**
   * Fetches both the parent message and thread replies from the API.
   * The API returns `{ parent: Message | null, replies: Message[] }`.
   *
   * This single function is used for both:
   * 1. Initial data fetch on mount (sets loading to false when done)
   * 2. 3-second polling for real-time reply updates
   * 3. Manual refresh after sending a reply
   *
   * Consolidates the previously duplicated fetch logic into one function,
   * eliminating code duplication and the fabricated parent fallback.
   */
  const fetchThread = useCallback(() => {
    if (!messageId) return;
    fetch(`/api/messages/${messageId}/thread`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch thread");
        return r.json();
      })
      .then((data: { parent: Message | null; replies: Message[] }) => {
        if (data.parent) {
          setParentMessage(data.parent);
        }
        setReplies(data.replies || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [messageId]);

  /* ==== Initial Data Fetch on Mount ==== */
  useEffect(() => {
    fetchThread();
  }, [fetchThread]);

  /* ==== 3-Second Polling (CRITICAL — mirrors source lines 67-71) ==== */
  /* Established polling pattern: exactly 3000ms interval with cleanup   */
  useEffect(() => {
    if (!messageId) return;
    const interval = setInterval(fetchThread, 3000);
    return () => clearInterval(interval);
  }, [messageId, fetchThread]);

  /* ==== Auto-Scroll on New Replies (mirrors source lines 73-76) ==== */
  useEffect(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies]);

  /* ==== Event Handlers ==== */

  /**
   * Sends a reply to the thread via POST /api/messages/{id}/thread.
   * Mirrors the sendMessage pattern from source page.tsx lines 78-89.
   * After successful send, refreshes the replies list immediately.
   */
  const handleSendReply = async (content: string) => {
    if (!content.trim() || !messageId || !currentUser) return;
    try {
      await fetch(`/api/messages/${messageId}/thread`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: currentUser.id, content }),
      });
      fetchThread();
    } catch {
      /* Silently handle send errors — user can retry */
    }
  };

  /**
   * Navigates back to the previous page in browser history.
   * Used by both the back arrow and the close (X) button in the header.
   */
  const handleClose = () => {
    router.back();
  };

  /* ==== JSX Render ==== */
  return (
    <div className="flex flex-col h-full bg-white">
      {/* ================================================================ */}
      {/* Thread Header — back arrow, title, close button                  */}
      {/* ================================================================ */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 shrink-0">
        {/* Left section: back arrow + title */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 mr-3"
            aria-label="Go back"
          >
            <span className="text-lg" aria-hidden="true">
              ←
            </span>
          </button>
          <h2 className="text-lg font-bold text-gray-900">Thread</h2>
        </div>

        {/* Right section: close button */}
        <button
          type="button"
          onClick={handleClose}
          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          aria-label="Close thread"
        >
          <span className="text-lg" aria-hidden="true">
            ✕
          </span>
        </button>
      </div>

      {/* ================================================================ */}
      {/* Loading State                                                     */}
      {/* ================================================================ */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400 text-sm">Loading thread...</p>
        </div>
      )}

      {/* ================================================================ */}
      {/* Thread Content (visible when loading is complete)                 */}
      {/* ================================================================ */}
      {!loading && (
        <>
          {/* ---- Parent Message Section ---- */}
          {parentMessage && (
            <div className="px-6 py-4 border-b border-gray-200">
              <MessageBubble
                message={parentMessage}
                showHoverActions={false}
              />
            </div>
          )}

          {/* ---- Replies Count Divider ---- */}
          {/* Uses Slack active channel blue (#1164A3) for reply count text */}
          {replies.length > 0 && (
            <div className="px-6 py-2 text-xs text-[#1164A3] font-medium border-b border-gray-100">
              {replies.length} {replies.length === 1 ? "reply" : "replies"}
            </div>
          )}

          {/* ---- Replies List (scrollable) ---- */}
          {/* flex-1 overflow-y-auto fills remaining space with scroll    */}
          {/* px-6 py-4 matches source message list padding (page.tsx)    */}
          {replies.length > 0 ? (
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {replies.map((reply) => (
                <MessageBubble
                  key={reply.id}
                  message={reply}
                  compact
                  showHoverActions={false}
                />
              ))}
              {/* Auto-scroll anchor at the bottom of replies */}
              <div ref={repliesEndRef} />
            </div>
          ) : (
            /* ---- Empty Thread State ---- */
            parentMessage && (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <p className="text-sm">No replies yet</p>
                <p className="text-xs mt-1">Be the first to reply</p>
              </div>
            )
          )}

          {/* ---- Reply Input (fixed at bottom) ---- */}
          {/* Uses MessageInput in compact mode with thread-specific placeholder */}
          <MessageInput
            channelName="thread"
            onSendMessage={handleSendReply}
            placeholder="Reply..."
            compact
          />
        </>
      )}
    </div>
  );
}

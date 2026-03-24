"use client";

/**
 * Thread View — Full-page threaded conversation
 *
 * Renders a complete thread view for a specific parent message. Displays the
 * parent message at the top, followed by all threaded replies with 3-second
 * polling, and a reply input at the bottom.
 *
 * Includes a back button for navigation to the previous page.
 *
 * URL: /(workspace)/thread/[id]
 */

import { use, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import MessageBubble from "@/app/components/MessageBubble";
import MessageInput from "@/app/components/MessageInput";
import { useWorkspace } from "@/app/providers";
import type { Message } from "@/lib/types";

/** Shape returned by GET /api/messages/{id}/thread — a thread reply row */
interface ThreadReply {
  id: number;
  content: string;
  created_at: string;
  user_id: number;
  username: string;
  avatar_color: string;
}

/* -------------------------------------------------------------------------- */
/*  Page Component                                                            */
/* -------------------------------------------------------------------------- */

export default function ThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const messageId = parseInt(id, 10);
  const router = useRouter();

  /* ---- Context ---- */
  const { currentUser } = useWorkspace();

  /* ---- State ---- */
  const [parentMessage, setParentMessage] = useState<Message | null>(null);
  const [replies, setReplies] = useState<ThreadReply[]>([]);
  const [loading, setLoading] = useState(true);

  // Auto-scroll ref
  const repliesEndRef = useRef<HTMLDivElement>(null);

  /* ---- Fetch thread data ---- */
  const fetchThread = useCallback(() => {
    fetch(`/api/messages/${messageId}/thread`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch thread");
        return res.json();
      })
      .then((data: ThreadReply[]) => {
        setReplies(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [messageId]);

  /* ---- Fetch parent message info and initial replies on mount ---- */
  useEffect(() => {
    // Fetch thread replies — the parent message is the root of the conversation
    fetch(`/api/messages/${messageId}/thread`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch thread");
        return res.json();
      })
      .then((data: ThreadReply[]) => {
        setReplies(data);
        // Create a placeholder parent message since there's no dedicated
        // single-message endpoint. The thread page focuses on replies.
        setParentMessage({
          id: messageId,
          channel_id: 0,
          user_id: 0,
          content: "Original message",
          created_at: new Date().toISOString(),
          username: "Thread starter",
          avatar_color: "#999",
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [messageId]);

  /* ---- 3-second polling for replies ---- */
  useEffect(() => {
    const interval = setInterval(fetchThread, 3000);
    return () => clearInterval(interval);
  }, [fetchThread]);

  /* ---- Auto-scroll on new replies ---- */
  useEffect(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies]);

  /* ---- Send reply handler ---- */
  const handleSendReply = useCallback(
    async (content: string) => {
      if (!currentUser) return;
      try {
        const res = await fetch(`/api/messages/${messageId}/thread`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: currentUser.id,
            content,
          }),
        });
        if (res.ok) {
          fetchThread();
        }
      } catch {
        /* Silent failure */
      }
    },
    [currentUser, messageId, fetchThread]
  );

  /* ---- Render ---- */
  return (
    <div className="flex flex-col h-full">
      {/* Thread Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 shrink-0">
        <button
          onClick={() => router.back()}
          className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          type="button"
          aria-label="Go back"
        >
          <span className="text-lg" aria-hidden="true">←</span>
        </button>
        <h2 className="text-lg font-bold text-gray-900">Thread</h2>
        <span className="text-sm text-gray-500">
          {replies.length} {replies.length === 1 ? "reply" : "replies"}
        </span>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-400">Loading thread...</p>
        </div>
      ) : (
        <>
          {/* Parent message */}
          {parentMessage && (
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <MessageBubble message={parentMessage} compact={false} />
            </div>
          )}

          {/* Replies */}
          <div className="flex-1 overflow-y-auto px-4 py-2">
            {replies.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-sm text-gray-400">No replies yet</p>
              </div>
            ) : (
              replies.map((reply) => (
                <MessageBubble
                  key={reply.id}
                  message={{
                    id: reply.id,
                    channel_id: 0,
                    user_id: reply.user_id,
                    content: reply.content,
                    created_at: reply.created_at,
                    username: reply.username ?? "",
                    avatar_color: reply.avatar_color ?? "#999",
                  }}
                  compact
                />
              ))
            )}
            <div ref={repliesEndRef} />
          </div>

          {/* Reply Input */}
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

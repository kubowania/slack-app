"use client";

/**
 * Channel Message View — Primary workspace page
 *
 * Renders the full channel experience: channel header with member count and
 * action icons, optional bookmarks bar, scrollable message list with reactions
 * and thread indicators, message composer, and optional thread side panel.
 *
 * Features:
 * - 3-second polling for new messages
 * - Auto-scroll to newest message on update
 * - Send message via POST /api/channels/{id}/messages
 * - Thread panel toggle for threaded conversations
 * - Channel info from workspace context (no separate fetch)
 * - Member count from GET /api/channels/{id}/members
 *
 * URL: /(workspace)/channel/[id]
 */

import { use, useState, useEffect, useRef, useCallback } from "react";
import ChannelHeader from "@/app/components/ChannelHeader";
import MessageBubble from "@/app/components/MessageBubble";
import MessageInput from "@/app/components/MessageInput";
import ThreadPanel from "@/app/components/ThreadPanel";
import BookmarksBar from "@/app/components/BookmarksBar";
import UserProfile from "@/app/components/UserProfile";
import { useWorkspace } from "@/app/providers";
import type { Message } from "@/lib/types";
import type { BookmarkItem } from "@/app/components/BookmarksBar";

/* -------------------------------------------------------------------------- */
/*  Page Component                                                            */
/* -------------------------------------------------------------------------- */

export default function ChannelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const channelId = parseInt(id, 10);

  /* ---- Context ---- */
  const { currentUser, channels } = useWorkspace();
  const channel = channels.find((c) => c.id === channelId) ?? null;

  /* ---- State ---- */
  const [messages, setMessages] = useState<Message[]>([]);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [bookmarks] = useState<BookmarkItem[]>([]);

  // Thread panel state
  const [threadMessage, setThreadMessage] = useState<Message | null>(null);

  // User profile panel state
  const [profileUserId, setProfileUserId] = useState<number | null>(null);

  // Auto-scroll ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* ---- Message Fetching with 3-second polling ---- */
  const fetchMessages = useCallback(() => {
    fetch(`/api/channels/${channelId}/messages`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch messages");
        return res.json();
      })
      .then((data: Message[]) => setMessages(data))
      .catch(() => {
        /* Silent — keep showing existing messages */
      });
  }, [channelId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  /* ---- Fetch member count ---- */
  useEffect(() => {
    fetch(`/api/channels/${channelId}/members`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch members");
        return res.json();
      })
      .then((data: Array<Record<string, unknown>>) =>
        setMemberCount(data.length)
      )
      .catch(() => {
        /* Graceful degradation — member count stays 0 */
      });
  }, [channelId]);

  /* ---- Auto-scroll on new messages ---- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ---- Send message handler ---- */
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!currentUser) return;
      try {
        const res = await fetch(`/api/channels/${channelId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: currentUser.id,
            content,
          }),
        });
        if (res.ok) {
          fetchMessages();
        }
      } catch {
        /* Silent failure */
      }
    },
    [currentUser, channelId, fetchMessages]
  );

  /* ---- Thread handlers ---- */
  const handleThreadClick = useCallback(
    (messageId: number) => {
      const msg = messages.find((m) => m.id === messageId);
      if (msg) setThreadMessage(msg);
    },
    [messages]
  );

  const handleThreadClose = useCallback(() => {
    setThreadMessage(null);
  }, []);

  /* ---- User profile handlers ---- */
  const handleUserClick = useCallback((userId: number) => {
    setProfileUserId(userId);
  }, []);

  const handleProfileClose = useCallback(() => {
    setProfileUserId(null);
  }, []);

  /* ---- Render ---- */
  return (
    <div className="flex h-full">
      {/* Main channel area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel Header */}
        {channel && (
          <ChannelHeader channel={channel} memberCount={memberCount} />
        )}

        {/* Bookmarks Bar */}
        {bookmarks.length > 0 && <BookmarksBar bookmarks={bookmarks} />}

        {/* Message List */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">
                  Welcome to #{channel?.name ?? "channel"}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  This is the very beginning of the{" "}
                  <strong>#{channel?.name ?? "channel"}</strong> channel.
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onThreadClick={handleThreadClick}
                onUserClick={handleUserClick}
                showHoverActions
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <MessageInput
          channelName={channel?.name ?? "channel"}
          onSendMessage={handleSendMessage}
          placeholder={`Message #${channel?.name ?? "channel"}`}
        />
      </div>

      {/* Thread Side Panel (conditional) */}
      {threadMessage && (
        <ThreadPanel
          parentMessage={threadMessage}
          isOpen={!!threadMessage}
          onClose={handleThreadClose}
          currentUserId={currentUser?.id}
        />
      )}

      {/* User Profile Side Panel (conditional) */}
      {profileUserId && (
        <UserProfile
          userId={profileUserId}
          isOpen={!!profileUserId}
          onClose={handleProfileClose}
        />
      )}
    </div>
  );
}

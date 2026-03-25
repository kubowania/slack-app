"use client";

/**
 * Channel Message View — Primary workspace page route
 *
 * Renders the full channel chat experience within the (workspace) route group.
 * The persistent sidebar is provided by the parent (workspace)/layout.tsx.
 *
 * Features:
 * - Channel header with name and description
 * - Bookmarks bar (currently empty, ready for future bookmarks)
 * - Scrollable message list with avatar, username, timestamp, content
 * - Message composer with send functionality
 * - Thread side panel for threaded conversations
 * - 3-second polling for near-real-time message updates
 * - Auto-scroll to newest message on update
 *
 * Data flow:
 * 1. Fetches channel details from GET /api/channels
 * 2. Fetches current user from GET /api/users (first user as default)
 * 3. Fetches messages from GET /api/channels/{id}/messages
 * 4. Polls for new messages every 3 seconds
 * 5. Sends messages via POST /api/channels/{id}/messages
 *
 * Route: /channel/[id] (within (workspace) route group — no URL segment added)
 *
 * Color palette (Slack design tokens):
 *   bg-white — content area background
 *   #007A5A — send button green (via MessageInput)
 *   #1164A3 — active channel blue / focus ring (via MessageInput)
 *   border-gray-200 — separator borders
 */

import { use, useState, useEffect, useRef, useCallback } from "react";
import { notFound } from "next/navigation";
import ChannelHeader from "@/app/components/ChannelHeader";
import MessageBubble from "@/app/components/MessageBubble";
import MessageInput from "@/app/components/MessageInput";
import ThreadPanel from "@/app/components/ThreadPanel";
import BookmarksBar from "@/app/components/BookmarksBar";
import { useWorkspace } from "@/app/providers";
import type { Message, Channel } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/*  Props Interface                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Next.js 16 App Router page props.
 * In Next.js 16+, route params are delivered as a Promise that must be
 * unwrapped with React 19's use() hook in client components.
 */
interface ChannelPageProps {
  params: Promise<{ id: string }>;
}

/* -------------------------------------------------------------------------- */
/*  Page Component                                                            */
/* -------------------------------------------------------------------------- */

/**
 * ChannelPage — The most important page route in the workspace.
 *
 * Replicates and replaces the original monolithic SlackClone component
 * (src/app/page.tsx, 248 lines) by consuming decomposed shared components:
 * ChannelHeader, MessageBubble, MessageInput, ThreadPanel, BookmarksBar.
 *
 * Layout structure:
 * ┌────────────────────────────────────────────────────────┬──────────────┐
 * │ Main Content Column                                    │ Thread Panel │
 * │ ┌────────────────────────────────────────────────────┐ │ (optional)   │
 * │ │ ChannelHeader (# channel-name | description)      │ │              │
 * │ ├────────────────────────────────────────────────────┤ │              │
 * │ │ BookmarksBar (currently empty)                     │ │              │
 * │ ├────────────────────────────────────────────────────┤ │              │
 * │ │ Message List (scrollable, px-6 py-4)              │ │              │
 * │ │   MessageBubble × N                               │ │              │
 * │ │   <auto-scroll anchor>                            │ │              │
 * │ ├────────────────────────────────────────────────────┤ │              │
 * │ │ MessageInput (Message #channel-name)              │ │              │
 * │ └────────────────────────────────────────────────────┘ │              │
 * └────────────────────────────────────────────────────────┴──────────────┘
 */
export default function ChannelPage({ params }: ChannelPageProps) {
  /* ==== Route Parameter Extraction ==== */

  /**
   * Unwrap the async params Promise using React 19's use() hook.
   * CRITICAL: In Next.js 16 App Router, page params are Promise<{ id: string }>.
   * Client components MUST use use() (NOT await) to unwrap them.
   */
  const { id } = use(params);

  /** Validate route parameter is numeric — prevents SQL errors from invalid URLs */
  const numericId = Number(id);
  if (isNaN(numericId)) {
    notFound();
  }
  const channelId = id;

  /* ==== Shared State from WorkspaceProvider ==== */

  /**
   * Consume the shared currentUser from WorkspaceProvider via useWorkspace().
   * This ensures Sidebar user-switching propagates to message sending —
   * fixing the regression from the monolith decomposition where each page
   * independently fetched /api/users and ignored Sidebar user changes.
   */
  const { currentUser } = useWorkspace();

  /* ==== State Management ==== */

  /** The current channel object (name, description, etc.) fetched from /api/channels */
  const [channel, setChannel] = useState<Channel | null>(null);

  /** Messages for this channel fetched from /api/channels/{id}/messages */
  const [messages, setMessages] = useState<Message[]>([]);

  /** The parent message of the currently open thread panel (null = closed) */
  const [activeThread, setActiveThread] = useState<Message | null>(null);

  /** Invisible div at the bottom of message list for smooth auto-scroll anchor */
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* ==== Data Fetching ==== */

  /**
   * Fetch channel details on mount and when channelId changes.
   * Finds the matching channel from the full channel list by numeric ID.
   */
  useEffect(() => {
    fetch("/api/channels")
      .then((r) => r.json())
      .then((data: Channel[]) => {
        const found = data.find((ch) => ch.id === Number(channelId));
        if (found) setChannel(found);
      })
      .catch(() => {
        /* Graceful degradation — channel header remains hidden */
      });
  }, [channelId]);

  /**
   * Memoized message fetching function.
   * Uses channelId from route params (not from channel state) to ensure
   * stable dependencies for the polling effect.
   */
  const fetchMessages = useCallback(() => {
    if (!channelId) return;
    fetch(`/api/channels/${channelId}/messages`)
      .then((r) => r.json())
      .then((data: Message[]) => setMessages(data))
      .catch(() => {
        /* Graceful degradation — keep showing existing messages */
      });
  }, [channelId]);

  /**
   * Initial message fetch when channelId changes.
   * Triggers immediately, then polling takes over.
   */
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  /**
   * 3-second polling for near-real-time message updates.
   * CRITICAL: Must use exactly 3000ms interval and clean up on unmount.
   * Matches the established polling pattern from the original SlackClone.
   */
  useEffect(() => {
    if (!channelId) return;
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [channelId, fetchMessages]);

  /**
   * Auto-scroll to the bottom of the message list when new messages arrive.
   * Uses smooth scrolling for a polished user experience.
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ==== Event Handlers ==== */

  /**
   * Send a message to the current channel via POST /api/channels/{id}/messages.
   * Validates input, sends the request, and immediately refetches messages.
   * The MessageInput component handles clearing its own text state.
   */
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !channelId || !currentUser) return;
    try {
      await fetch(`/api/channels/${channelId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: currentUser.id, content }),
      });
      fetchMessages();
    } catch {
      /* Graceful degradation — message not sent, no user-visible error */
    }
  };

  /**
   * Open the thread panel for a specific message.
   * Finds the parent message by ID from the current messages array
   * and sets it as the active thread.
   */
  const handleThreadClick = (messageId: number) => {
    const parentMsg = messages.find((m) => m.id === messageId);
    if (parentMsg) setActiveThread(parentMsg);
  };

  /**
   * Close the thread panel by clearing the active thread state.
   */
  const handleCloseThread = () => {
    setActiveThread(null);
  };

  /* ==== Render ==== */

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Main Content Column — channel header, messages, and input */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Channel Header — shows # channel-name and description */}
        {channel && <ChannelHeader channel={channel} />}

        {/* Bookmarks Bar — currently empty, renders nothing when no bookmarks */}
        <BookmarksBar bookmarks={[]} />

        {/* Message List — scrollable container with Slack-standard padding */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onThreadClick={handleThreadClick}
            />
          ))}
          {/* Auto-scroll anchor — invisible element at the bottom of the list */}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input — rendered only when channel is loaded */}
        {channel && (
          <MessageInput
            channelName={channel.name}
            onSendMessage={handleSendMessage}
          />
        )}
      </div>

      {/* Thread Panel — slides in from the right when a thread is active */}
      {activeThread && (
        <ThreadPanel
          parentMessage={activeThread}
          isOpen={!!activeThread}
          onClose={handleCloseThread}
          currentUserId={currentUser?.id}
          channelName={channel?.name}
        />
      )}
    </div>
  );
}

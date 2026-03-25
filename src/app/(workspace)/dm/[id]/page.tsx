"use client";

/**
 * DM Conversation View Page — Direct Message conversation interface
 *
 * Renders a DM conversation view similar to the channel view
 * (src/app/(workspace)/channel/[id]/page.tsx) but adapted for DM conversations:
 * - DM-specific header showing participant names without # prefix
 * - DM-specific API endpoints (/api/dms/[id]/messages)
 * - DM participant name derivation excluding the current user
 * - No BookmarksBar (DMs don't have bookmarks)
 *
 * Features:
 * - Fetches DM conversation metadata from GET /api/dms
 * - Fetches DM messages from GET /api/dms/{id}/messages with 3-second polling
 * - Sends messages via POST /api/dms/{id}/messages
 * - Auto-scroll to newest message on updates
 * - Thread panel support for threaded replies within DMs
 * - Uses ChannelHeader with dmParticipantName prop for DM-specific rendering
 *
 * Route: /dm/[id] (within (workspace) route group — no URL segment added)
 *
 * Layout structure:
 * ┌──────────────────────────────────────────────────────┬──────────────┐
 * │ Main Content Column                                  │ Thread Panel │
 * │ ┌──────────────────────────────────────────────────┐ │ (optional)   │
 * │ │ ChannelHeader (participant name, no # prefix)    │ │              │
 * │ ├──────────────────────────────────────────────────┤ │              │
 * │ │ Message List (scrollable, px-6 py-4)            │ │              │
 * │ │   MessageBubble × N                             │ │              │
 * │ │   <auto-scroll anchor>                          │ │              │
 * │ ├──────────────────────────────────────────────────┤ │              │
 * │ │ MessageInput (Message [participant name])        │ │              │
 * │ └──────────────────────────────────────────────────┘ │              │
 * └──────────────────────────────────────────────────────┴──────────────┘
 */

import { use, useState, useEffect, useRef, useCallback } from "react";
import { notFound } from "next/navigation";
import ChannelHeader from "@/app/components/ChannelHeader";
import MessageBubble from "@/app/components/MessageBubble";
import MessageInput from "@/app/components/MessageInput";
import ThreadPanel from "@/app/components/ThreadPanel";
import { useWorkspace } from "@/app/providers";
import type { Message, DmMessage, DirectMessage } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/*  Props Interface                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Next.js 16 App Router page props.
 * In Next.js 16+, route params are delivered as a Promise that must be
 * unwrapped with React 19's use() hook in client components.
 */
interface DmPageProps {
  params: Promise<{ id: string }>;
}

/* -------------------------------------------------------------------------- */
/*  Page Component                                                            */
/* -------------------------------------------------------------------------- */

/**
 * DmPage — Direct Message conversation view page.
 *
 * Mirrors the architecture of the channel page but uses DM-specific
 * API endpoints and header display. Key differences from channel page:
 * 1. Uses /api/dms/${dmId}/messages instead of /api/channels/${channelId}/messages
 * 2. Fetches DM info from /api/dms instead of /api/channels
 * 3. Shows participant name(s) in header instead of # channel-name
 * 4. No BookmarksBar (DMs don't have bookmarks)
 * 5. Placeholder shows "Message [participant name]" instead of "Message #channel"
 */
export default function DmPage({ params }: DmPageProps) {
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
  const dmId = id;

  /* ==== Shared State from WorkspaceProvider ==== */

  /**
   * Consume the shared currentUser from WorkspaceProvider via useWorkspace().
   * This ensures Sidebar user-switching propagates to DM message sending —
   * fixing the regression from the monolith decomposition.
   */
  const { currentUser } = useWorkspace();

  /* ==== State Management ==== */

  /** DM conversation metadata including participant info (names, avatars) */
  const [dmInfo, setDmInfo] = useState<DirectMessage | null>(null);

  /**
   * Messages for this DM conversation fetched from /api/dms/{id}/messages.
   * Uses DmMessage type (with dm_id field) instead of Message (which has
   * channel_id) since DM messages belong to DM conversations, not channels.
   */
  const [messages, setMessages] = useState<DmMessage[]>([]);

  /** The parent message of the currently open thread panel (null = closed) */
  const [activeThread, setActiveThread] = useState<Message | null>(null);

  /** Invisible div at the bottom of message list for smooth auto-scroll anchor */
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* ==== Data Fetching ==== */

  /**
   * Fetch DM conversation info on mount and when dmId changes.
   * Finds the matching DM from the full DM list by numeric ID.
   */
  useEffect(() => {
    fetch("/api/dms")
      .then((r) => r.json())
      .then((data: DirectMessage[]) => {
        const found = data.find((dm) => dm.id === Number(dmId));
        if (found) setDmInfo(found);
      })
      .catch(() => {
        /* Graceful degradation — DM header falls back to "Direct Message" */
      });
  }, [dmId]);

  /**
   * Memoized message fetching function.
   * Uses dmId from route params to ensure stable dependencies for polling.
   * KEY DIFFERENCE from channel page: Uses /api/dms/${dmId}/messages
   */
  const fetchMessages = useCallback(() => {
    if (!dmId) return;
    fetch(`/api/dms/${dmId}/messages`)
      .then((r) => r.json())
      .then((data: DmMessage[]) => setMessages(data))
      .catch(() => {
        /* Graceful degradation — keep showing existing messages */
      });
  }, [dmId]);

  /**
   * Initial message fetch when dmId changes.
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
    if (!dmId) return;
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [dmId, fetchMessages]);

  /**
   * Auto-scroll to the bottom of the message list when new messages arrive.
   * Uses smooth scrolling for a polished user experience.
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ==== Event Handlers ==== */

  /**
   * Send a message to the current DM via POST /api/dms/{id}/messages.
   * Validates input, sends the request, and immediately refetches messages.
   * The MessageInput component handles clearing its own text state.
   */
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !dmId || !currentUser) return;
    try {
      await fetch(`/api/dms/${dmId}/messages`, {
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
   * Finds the parent message by ID from the current DmMessage array,
   * adapts it to a Message for ThreadPanel compatibility, and sets it
   * as the active thread.
   */
  const handleThreadClick = (messageId: number) => {
    const parentMsg = messages.find((m) => m.id === messageId);
    if (parentMsg) setActiveThread(dmMessageToMessage(parentMsg));
  };

  /**
   * Close the thread panel by clearing the active thread state.
   */
  const handleCloseThread = () => {
    setActiveThread(null);
  };

  /* ==== Type Adapter ==== */

  /**
   * Adapts a DmMessage (with dm_id) to a Message (with channel_id) for
   * rendering through MessageBubble which expects the Message interface.
   * Since MessageBubble does not access channel_id at runtime, using 0
   * as a placeholder is safe and semantically correct (DM messages don't
   * belong to channels).
   */
  const dmMessageToMessage = (dm: DmMessage): Message => ({
    id: dm.id,
    channel_id: 0,
    user_id: dm.user_id,
    content: dm.content,
    created_at: dm.created_at,
    username: dm.username,
    avatar_color: dm.avatar_color,
  });

  /* ==== Helper Functions ==== */

  /**
   * Derives the DM participant name from DM info, excluding the current user.
   *
   * Logic:
   * 1. If no DM info or no members, return "Direct Message" fallback
   * 2. Filter out the current user from the members list
   * 3. If filtering removes all members (self-DM), fall back to first member
   * 4. Join remaining member names with commas for group DMs
   * 5. Prefer display_name over username when available
   */
  const getDmParticipantName = (): string => {
    if (!dmInfo || !dmInfo.members || dmInfo.members.length === 0) {
      return "Direct Message";
    }
    /* Filter out the current user to show the other participant(s) */
    const otherMembers = currentUser
      ? dmInfo.members.filter((m) => m.id !== currentUser.id)
      : dmInfo.members;
    if (otherMembers.length === 0) {
      return dmInfo.members[0]?.username || "Direct Message";
    }
    return otherMembers.map((m) => m.display_name || m.username).join(", ");
  };

  /* ==== Render ==== */

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Main Content Column — DM header, messages, and input */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* DM Header — shows participant name WITHOUT # prefix */}
        <ChannelHeader
          channel={{
            id: Number(dmId),
            name: getDmParticipantName(),
            description: "",
          }}
          dmParticipantName={getDmParticipantName()}
        />

        {/* Message List — scrollable container with Slack-standard padding */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={dmMessageToMessage(msg)}
              onThreadClick={handleThreadClick}
            />
          ))}
          {/* Auto-scroll anchor — invisible element at the bottom of the list */}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input — placeholder uses participant name, not # channel-name */}
        <MessageInput
          channelName={getDmParticipantName()}
          onSendMessage={handleSendMessage}
          placeholder={`Message ${getDmParticipantName()}`}
        />
      </div>

      {/* Thread Panel — slides in from the right when a thread is active */}
      {activeThread && (
        <ThreadPanel
          parentMessage={activeThread}
          isOpen={!!activeThread}
          onClose={handleCloseThread}
          currentUserId={currentUser?.id}
          channelName={getDmParticipantName()}
        />
      )}
    </div>
  );
}

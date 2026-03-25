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
import UserProfile from "@/app/components/UserProfile";
import HuddleOverlay from "@/app/components/HuddleOverlay";
import ModalDialog from "@/app/components/ModalDialog";
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

  /** Whether the channel fetch completed but no matching channel was found (404 state) */
  const [channelNotFound, setChannelNotFound] = useState<boolean>(false);

  /** Messages for this channel fetched from /api/channels/{id}/messages */
  const [messages, setMessages] = useState<Message[]>([]);

  /** The parent message of the currently open thread panel (null = closed) */
  const [activeThread, setActiveThread] = useState<Message | null>(null);

  /** User ID for the open user profile panel (null = closed) */
  const [profileUserId, setProfileUserId] = useState<number | null>(null);

  /** Whether the huddle overlay is visible */
  const [huddleOpen, setHuddleOpen] = useState<boolean>(false);

  /** Whether the channel details panel is visible */
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);

  /** Whether the invite members modal is visible */
  const [inviteModalOpen, setInviteModalOpen] = useState<boolean>(false);

  /** Invisible div at the bottom of message list for smooth auto-scroll anchor */
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* ==== Data Fetching ==== */

  /**
   * Fetch channel details on mount and when channelId changes.
   * Finds the matching channel from the full channel list by numeric ID.
   */
  useEffect(() => {
    let cancelled = false;
    fetch("/api/channels")
      .then((r) => r.json())
      .then((data: Channel[]) => {
        if (cancelled) return;
        const found = data.find((ch) => ch.id === Number(channelId));
        if (found) {
          setChannel(found);
          setChannelNotFound(false);
        } else {
          setChannel(null);
          setChannelNotFound(true);
        }
      })
      .catch(() => {
        if (cancelled) return;
        /* Graceful degradation — show channel not found on fetch failure */
        setChannel(null);
        setChannelNotFound(true);
      });
    return () => { cancelled = true; };
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

  /**
   * Toggle an emoji reaction on a message for the current user.
   *
   * Checks whether the current user has already reacted with the given emoji:
   * - If yes → sends DELETE /api/messages/{id}/reactions to remove the reaction
   * - If no  → sends POST  /api/messages/{id}/reactions to add the reaction
   *
   * After the API call completes, refetches the full message list to update
   * reaction counts and user lists in the UI.
   *
   * QA Issue #3: This handler was previously not wired to MessageBubble's
   * onReactionClick prop, making existing reaction badges non-interactive.
   */
  const handleReactionClick = async (messageId: number, emoji: string) => {
    if (!currentUser) return;

    // Determine if the current user already reacted with this emoji
    const msg = messages.find((m) => m.id === messageId);
    const existingReaction = msg?.reaction_summary?.find(
      (r) => r.emoji === emoji
    );
    const hasReacted = existingReaction?.users?.some(
      (u) => u.id === currentUser.id
    );

    try {
      if (hasReacted) {
        // Remove the existing reaction
        await fetch(`/api/messages/${messageId}/reactions`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emoji, user_id: currentUser.id }),
        });
      } else {
        // Add a new reaction
        await fetch(`/api/messages/${messageId}/reactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emoji, user_id: currentUser.id }),
        });
      }
      // Refresh messages to show updated reaction counts
      fetchMessages();
    } catch {
      /* Graceful degradation — reaction toggle failed silently */
    }
  };

  /** Open the user profile side panel for a given user ID */
  const handleUserClick = (userId: number) => {
    setProfileUserId(userId);
  };

  /** Close the user profile side panel */
  const handleCloseProfile = () => {
    setProfileUserId(null);
  };

  /** Toggle channel details panel */
  const handleDetailsClick = () => {
    setDetailsOpen((prev) => !prev);
  };

  /** Toggle huddle overlay */
  const handleHuddleToggle = () => {
    setHuddleOpen((prev) => !prev);
  };

  /** Toggle invite members modal */
  const handleInviteToggle = () => {
    setInviteModalOpen((prev) => !prev);
  };

  /* ==== Render ==== */

  /* Channel Not Found — display user-friendly error state instead of blank area */
  if (channelNotFound) {
    return (
      <div className="flex flex-1 h-full overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center bg-white">
          <span className="text-5xl mb-4" role="img" aria-label="Channel not found">
            🔍
          </span>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Channel not found
          </h2>
          <p className="text-sm text-gray-500 text-center max-w-sm">
            The channel you&apos;re looking for doesn&apos;t exist or may have been
            deleted. Try selecting a channel from the sidebar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Main Content Column — channel header, messages, and input */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Channel Header — shows # channel-name and description */}
        {channel && (
          <ChannelHeader
            channel={channel}
            onDetailsClick={handleDetailsClick}
          />
        )}

        {/* Bookmarks Bar — currently empty, renders nothing when no bookmarks */}
        <BookmarksBar bookmarks={[]} />

        {/* Message List — scrollable container with Slack-standard padding */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onThreadClick={handleThreadClick}
              onReactionClick={handleReactionClick}
              onUserClick={handleUserClick}
              showHoverActions
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

        {/* Footer toolbar with huddle and invite buttons */}
        <div className="flex items-center gap-2 px-4 py-2 border-t border-gray-100">
          <button
            type="button"
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 rounded hover:bg-gray-100 transition-colors"
            onClick={handleHuddleToggle}
            data-testid="huddle-button"
            aria-label="Start a huddle"
          >
            🎧 Huddle
          </button>
          <button
            type="button"
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 rounded hover:bg-gray-100 transition-colors"
            onClick={handleInviteToggle}
            data-testid="invite-members-button"
            aria-label="Invite members"
          >
            👤+ Invite
          </button>
        </div>
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

      {/* User Profile Panel — slides in when a user avatar is clicked */}
      {profileUserId !== null && (
        <UserProfile
          userId={profileUserId}
          isOpen={profileUserId !== null}
          onClose={handleCloseProfile}
        />
      )}

      {/* Channel Details Panel — right sidebar with channel info */}
      {detailsOpen && channel && (
        <aside
          className="w-80 border-l border-gray-200 bg-white flex flex-col h-full thread-panel-enter"
          data-testid="channel-details-panel"
          role="complementary"
          aria-label="Channel details"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h2 className="text-sm font-bold text-gray-900">
              # {channel.name}
            </h2>
            <button
              onClick={handleDetailsClick}
              className="p-1 rounded hover:bg-gray-100 text-gray-400"
              type="button"
              aria-label="Close details"
            >
              ✕
            </button>
          </div>
          <div className="flex border-b border-gray-200">
            <button
              type="button"
              className="flex-1 px-4 py-2 text-xs font-medium text-[#1164A3] border-b-2 border-[#1164A3]"
              data-testid="details-tab-members"
            >
              Members
            </button>
            <button
              type="button"
              className="flex-1 px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-700"
              data-testid="details-tab-pins"
            >
              Pins
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {channel.description && (
              <p className="text-sm text-gray-600 mb-4">
                {channel.description}
              </p>
            )}
            <p className="text-xs text-gray-400">
              Channel details are loaded here.
            </p>
          </div>
        </aside>
      )}

      {/* Huddle Overlay — floating bottom-right overlay */}
      <HuddleOverlay
        isOpen={huddleOpen}
        onClose={() => setHuddleOpen(false)}
        channelName={channel?.name}
      />

      {/* Invite Members Modal */}
      <ModalDialog
        isOpen={inviteModalOpen}
        title="Invite Members"
        onClose={handleInviteToggle}
      >
        <div data-testid="modal-dialog">
            <p className="text-sm text-gray-600 mb-4">
              Invite people to <strong>#{channel?.name}</strong>
            </p>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              placeholder="Search for people to invite..."
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                className="px-4 py-2 text-sm text-gray-600 rounded hover:bg-gray-100"
                onClick={handleInviteToggle}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm text-white bg-[#007A5A] rounded hover:bg-[#006549]"
                onClick={handleInviteToggle}
              >
                Send Invites
              </button>
            </div>
          </div>
      </ModalDialog>
    </div>
  );
}

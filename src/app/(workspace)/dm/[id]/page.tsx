"use client";

/**
 * Direct Message Conversation View
 *
 * Renders a 1:1 or group DM conversation with the same layout pattern as the
 * channel view but using DM-specific API endpoints and a participant-based
 * header instead of a channel name header.
 *
 * Features:
 * - Fetches DM conversation metadata from /api/dms
 * - Fetches DM messages from GET /api/dms/{id}/messages with 3-second polling
 * - Sends messages via POST /api/dms/{id}/messages
 * - Auto-scroll to newest message
 * - Uses ChannelHeader with dmParticipantName prop for DM-specific rendering
 *
 * URL: /(workspace)/dm/[id]
 */

import { use, useState, useEffect, useRef, useCallback } from "react";
import ChannelHeader from "@/app/components/ChannelHeader";
import MessageBubble from "@/app/components/MessageBubble";
import MessageInput from "@/app/components/MessageInput";
import { useWorkspace } from "@/app/providers";
import type { DmMessage, DirectMessage } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/*  Page Component                                                            */
/* -------------------------------------------------------------------------- */

export default function DmPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const dmId = parseInt(id, 10);

  /* ---- Context ---- */
  const { currentUser } = useWorkspace();

  /* ---- State ---- */
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [dmInfo, setDmInfo] = useState<DirectMessage | null>(null);

  // Auto-scroll ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* ---- Fetch DM info to get participant names ---- */
  useEffect(() => {
    fetch("/api/dms")
      .then((res) => {
        if (!res.ok) throw new Error("DM list fetch failed");
        return res.json();
      })
      .then((data: DirectMessage[]) => {
        const found = data.find((dm) => dm.id === dmId);
        if (found) setDmInfo(found);
      })
      .catch(() => {
        /* Silent */
      });
  }, [dmId]);

  /* ---- Message Fetching with 3-second polling ---- */
  const fetchMessages = useCallback(() => {
    fetch(`/api/dms/${dmId}/messages`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch DM messages");
        return res.json();
      })
      .then((data: DmMessage[]) => setMessages(data))
      .catch(() => {
        /* Silent */
      });
  }, [dmId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  /* ---- Auto-scroll on new messages ---- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ---- Send message handler ---- */
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!currentUser) return;
      try {
        const res = await fetch(`/api/dms/${dmId}/messages`, {
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
    [currentUser, dmId, fetchMessages]
  );

  /* ---- Derive participant name for header ---- */
  const participantName = dmInfo?.members
    ? dmInfo.members.map((m) => m.username).join(", ")
    : "Direct Message";

  /* ---- Synthesize a channel object for ChannelHeader ---- */
  const channelForHeader = {
    id: dmId,
    name: participantName,
    description: "",
    created_at: "",
  };

  /* ---- Render ---- */
  return (
    <div className="flex flex-col h-full">
      {/* Header with DM participant name */}
      <ChannelHeader
        channel={channelForHeader}
        dmParticipantName={participantName}
      />

      {/* Message List */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">
                {participantName}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                This is the very beginning of your direct message conversation.
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={{
                id: message.id,
                channel_id: dmId,
                user_id: message.user_id,
                content: message.content,
                created_at: message.created_at,
                username: message.username ?? "",
                avatar_color: message.avatar_color ?? "#999",
              }}
              showHoverActions
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput
        channelName={participantName}
        onSendMessage={handleSendMessage}
        placeholder={`Message ${participantName}`}
      />
    </div>
  );
}

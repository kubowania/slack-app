"use client";

/**
 * DmListPage — Direct Messages Listing View
 *
 * Renders the full list of DM conversations for the workspace, acting as the
 * landing page when users click "DMs" in the sidebar navigation. Each DM
 * conversation displays participant names/avatars, last message preview, and
 * message count. Clicking a conversation navigates to the DM detail view.
 *
 * Route: /(workspace)/dm
 *
 * This page resolves the sidebar dead-link issue where navigating to "/dm"
 * previously resulted in a 404 because only "/dm/[id]" existed.
 *
 * Data Flow:
 * - GET /api/dms → fetches all DM conversations with members and last message
 *
 * Patterns:
 * - Tailwind CSS utility classes matching Slack design tokens
 * - Slack color palette (#3F0E40, #1164A3, #007A5A)
 * - Client-side data fetching with loading/empty states
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import UserAvatar from "@/app/components/UserAvatar";

/* -------------------------------------------------------------------------- */
/*  Local Types                                                               */
/* -------------------------------------------------------------------------- */

/** DM member shape as returned by /api/dms endpoint */
interface DmMember {
  id: number;
  username: string;
  avatar_color: string;
}

/** DM conversation shape as returned by /api/dms endpoint */
interface DmConversation {
  id: number;
  created_by: number;
  is_group: boolean;
  created_at: string;
  last_message_preview: string | null;
  message_count: number;
  members: DmMember[];
}

/* -------------------------------------------------------------------------- */
/*  Page Component                                                            */
/* -------------------------------------------------------------------------- */

export default function DmListPage() {
  /* ==== State ==== */

  /** All DM conversations fetched from the API */
  const [dms, setDms] = useState<DmConversation[]>([]);

  /** Loading state during initial fetch */
  const [loading, setLoading] = useState(true);

  /* ==== Data Fetching ==== */

  useEffect(() => {
    fetch("/api/dms")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch DMs");
        return res.json();
      })
      .then((data: DmConversation[]) => {
        setDms(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  /* ==== Helper — Build display name from DM members ==== */

  /**
   * Generates a human-readable conversation name from the member list.
   * For 1:1 DMs, shows the other participant's name.
   * For group DMs, shows comma-separated names (up to 3) with overflow indicator.
   */
  const getConversationName = (members: DmMember[]): string => {
    if (members.length === 0) return "Direct Message";
    if (members.length <= 3) {
      return members.map((m) => m.username).join(", ");
    }
    const shown = members.slice(0, 3).map((m) => m.username).join(", ");
    return `${shown} +${members.length - 3}`;
  };

  /* ==== JSX Render ==== */

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ================================================================ */}
      {/* Page Header                                                       */}
      {/* ================================================================ */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 shrink-0">
        <h1 className="text-lg font-bold text-gray-900">
          Direct Messages
        </h1>
        <span className="text-xs text-gray-400">
          {dms.length} {dms.length === 1 ? "conversation" : "conversations"}
        </span>
      </div>

      {/* ================================================================ */}
      {/* Loading State                                                     */}
      {/* ================================================================ */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400 text-sm">Loading conversations...</p>
        </div>
      )}

      {/* ================================================================ */}
      {/* Empty State                                                       */}
      {/* ================================================================ */}
      {!loading && dms.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
          <span className="text-4xl mb-3" aria-hidden="true">💬</span>
          <p className="text-sm font-medium">No direct messages yet</p>
          <p className="text-xs mt-1">
            Start a conversation from the sidebar
          </p>
        </div>
      )}

      {/* ================================================================ */}
      {/* DM Conversations List                                             */}
      {/* ================================================================ */}
      {!loading && dms.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          {dms.map((dm) => (
            <Link
              key={dm.id}
              href={`/dm/${dm.id}`}
              className="flex items-center px-6 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 group"
            >
              {/* Participant Avatars — stack up to 2 for 1:1, show first for group */}
              <div className="flex -space-x-2 mr-3 shrink-0">
                {dm.members.slice(0, 2).map((member) => (
                  <UserAvatar
                    key={member.id}
                    username={member.username}
                    avatarColor={member.avatar_color}
                    size="md"
                  />
                ))}
                {dm.members.length > 2 && (
                  <div className="w-9 h-9 rounded-md bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 border-2 border-white">
                    +{dm.members.length - 2}
                  </div>
                )}
              </div>

              {/* Conversation Details */}
              <div className="flex-1 min-w-0">
                {/* Conversation Name */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    {getConversationName(dm.members)}
                  </span>
                  {dm.is_group && (
                    <span className="text-xs text-gray-400 ml-2 shrink-0">
                      Group
                    </span>
                  )}
                </div>

                {/* Last Message Preview */}
                {dm.last_message_preview && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {dm.last_message_preview}
                  </p>
                )}

                {/* Message Count */}
                {dm.message_count > 0 && (
                  <span className="text-xs text-gray-400 mt-0.5">
                    {dm.message_count} {dm.message_count === 1 ? "message" : "messages"}
                  </span>
                )}
              </div>

              {/* Navigation Arrow (visible on hover) */}
              <span
                className="text-gray-300 group-hover:text-gray-500 ml-2 shrink-0 transition-colors"
                aria-hidden="true"
              >
                →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

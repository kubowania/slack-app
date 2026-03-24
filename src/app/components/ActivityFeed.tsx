"use client";

/**
 * ActivityFeed — Activity/Mentions Feed Component
 *
 * Displays a unified activity feed showing mentions, thread replies, reactions,
 * and other notifications in the Slack Clone workspace. Consumed by the
 * (workspace)/activity/page.tsx route.
 *
 * Features:
 * - Fetches activity items from GET /api/activity on mount
 * - Polls for new activity every 30 seconds (lighter cadence than messages)
 * - Client-side filtering by activity type (All, Mentions, Threads, Reactions)
 * - Date grouping with "Today", "Yesterday", and full-date headers
 * - Relative timestamps ("2m", "1h", "Yesterday")
 * - Unread indicator for recent activities (CSS class from globals.css)
 * - Empty state with bell icon when no activities exist
 * - Slack-native color palette (#1164A3 active, #F8F8F8 hover, #E01E5A badges)
 */

import { useState, useEffect } from "react";
import type { ActivityItem, User, Message } from "@/lib/types";
import UserAvatar from "@/app/components/UserAvatar";

/* ========================================================================== */
/*  Exported Props Interface                                                  */
/* ========================================================================== */

/**
 * Props for the ActivityFeed component.
 *
 * @property currentUserId — The ID of the currently active user. Used to
 * personalize activity descriptions (e.g., "mentioned you"). Optional because
 * the app operates without authentication and the user may not be selected yet.
 */
export interface ActivityFeedProps {
  currentUserId?: number;
}

/* ========================================================================== */
/*  Local Types                                                               */
/* ========================================================================== */

/** Discriminated filter values for the activity feed tab bar */
type FilterType = "all" | "mentions" | "threads" | "reactions";

/** Minimal channel info used for display in activity descriptions */
interface ChannelInfo {
  id: number;
  name: string;
}

/** A date-grouped batch of activity items for rendering */
interface ActivityGroup {
  label: string;
  items: ActivityItem[];
}

/**
 * Content preview type derived from Message for type-safe preview rendering.
 * Activity items reference message content for mention and thread reply previews.
 */
type MessageContent = Message["content"];

/* ========================================================================== */
/*  Constants                                                                 */
/* ========================================================================== */

/** Filter tab configuration for the horizontal filter bar */
const FILTER_TABS: ReadonlyArray<{ label: string; value: FilterType }> = [
  { label: "All", value: "all" },
  { label: "Mentions", value: "mentions" },
  { label: "Threads", value: "threads" },
  { label: "Reactions", value: "reactions" },
] as const;

/** Maps filter tab values to ActivityItem.type string values */
const ACTIVITY_TYPE_FOR_FILTER: Record<Exclude<FilterType, "all">, string> = {
  mentions: "mention",
  threads: "thread_reply",
  reactions: "reaction",
};

/** Polling interval for new activity items (30 seconds) */
const POLL_INTERVAL_MS = 30_000;

/** Activities created within this many hours are treated as unread */
const UNREAD_THRESHOLD_HOURS = 1;

/* ========================================================================== */
/*  Helper Functions                                                          */
/* ========================================================================== */

/**
 * Truncates message content for preview display in activity descriptions.
 * Uses the MessageContent type (derived from Message) for type safety.
 *
 * @param content - The full message content string
 * @param maxLen  - Maximum character length before truncation (default 140)
 * @returns Truncated content with ellipsis, or original if short enough
 */
function truncatePreview(content: MessageContent, maxLen: number = 140): string {
  if (content.length <= maxLen) {
    return content;
  }
  return content.slice(0, maxLen - 3) + "...";
}

/**
 * Formats a date string into a human-readable relative time.
 *
 * @param dateStr - ISO 8601 date string
 * @returns Relative time string: "just now", "2m", "1h", "Yesterday", "3d", or "Jan 5"
 */
function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMs < 0) {
    return "just now";
  }
  if (diffSec < 60) {
    return "just now";
  }
  if (diffMin < 60) {
    return `${diffMin}m`;
  }
  if (diffHr < 24) {
    return `${diffHr}h`;
  }
  if (diffDay === 1) {
    return "Yesterday";
  }
  if (diffDay < 7) {
    return `${diffDay}d`;
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Returns a date group label for an activity item's timestamp.
 * Used to group activities under "Today", "Yesterday", or a full date.
 *
 * @param dateStr - ISO 8601 date string
 * @returns Group label string
 */
function getDateGroupLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86_400_000);
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (dateDay.getTime() === today.getTime()) {
    return "Today";
  }
  if (dateDay.getTime() === yesterday.getTime()) {
    return "Yesterday";
  }
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/**
 * Groups an array of ActivityItem objects by their date label.
 * Maintains insertion order so that the most recent group appears first
 * (assumes input is sorted by descending created_at).
 *
 * @param activities - Flat array of activity items, sorted by recency
 * @returns Array of ActivityGroup objects, each containing a label and items
 */
function groupActivitiesByDate(activities: ActivityItem[]): ActivityGroup[] {
  const groupMap = new Map<string, ActivityItem[]>();

  for (const activity of activities) {
    const label = getDateGroupLabel(activity.created_at);
    const existing = groupMap.get(label);
    if (existing) {
      existing.push(activity);
    } else {
      groupMap.set(label, [activity]);
    }
  }

  return Array.from(groupMap.entries()).map(([label, items]) => ({
    label,
    items,
  }));
}

/**
 * Determines whether an activity item should be marked as "unread"
 * based on its recency. Activities within UNREAD_THRESHOLD_HOURS are unread.
 *
 * @param dateStr      - ISO 8601 date string of the activity
 * @param thresholdHrs - Number of hours within which activities are "unread"
 * @returns true if the activity is within the threshold
 */
function isRecentActivity(dateStr: string, thresholdHrs: number): boolean {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  return diffMs >= 0 && diffMs < thresholdHrs * 60 * 60 * 1000;
}

/* ========================================================================== */
/*  Bell Icon (SVG for empty state)                                           */
/* ========================================================================== */

/**
 * Inline SVG bell icon for the empty state display.
 * Uses currentColor for monochrome fill, sized via CSS.
 */
function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-16 h-16 text-gray-300"
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

/* ========================================================================== */
/*  ActivityFeed Component                                                    */
/* ========================================================================== */

export default function ActivityFeed({ currentUserId }: ActivityFeedProps) {
  /* ---- State ---- */
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>("all");
  const [users, setUsers] = useState<User[]>([]);
  const [channels, setChannels] = useState<ChannelInfo[]>([]);

  /* ---- Data Fetching on Mount + Polling ---- */
  useEffect(() => {
    let mounted = true;

    /**
     * Fetches activity items, users (for avatar info), and channels
     * (for channel name display) in parallel on mount.
     */
    async function fetchInitialData(): Promise<void> {
      try {
        const [activityRes, usersRes, channelsRes] = await Promise.all([
          fetch("/api/activity"),
          fetch("/api/users"),
          fetch("/api/channels"),
        ]);

        if (!mounted) return;

        const [activityData, usersData, channelsData] = await Promise.all([
          activityRes.ok ? activityRes.json() : [],
          usersRes.ok ? usersRes.json() : [],
          channelsRes.ok ? channelsRes.json() : [],
        ]);

        if (!mounted) return;

        setActivities(Array.isArray(activityData) ? activityData : []);
        setUsers(Array.isArray(usersData) ? usersData : []);
        setChannels(Array.isArray(channelsData) ? channelsData : []);
      } catch {
        /* Gracefully handle network errors — the feed will show empty state */
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchInitialData();

    /* Poll for new activity items every 30 seconds */
    const pollInterval = setInterval(() => {
      fetch("/api/activity")
        .then((res) => (res.ok ? res.json() : []))
        .then((data: unknown) => {
          if (mounted && Array.isArray(data)) {
            setActivities(data as ActivityItem[]);
          }
        })
        .catch(() => {
          /* Silent failure — next poll will retry */
        });
    }, POLL_INTERVAL_MS);

    /* Cleanup: cancel polling and prevent state updates after unmount */
    return () => {
      mounted = false;
      clearInterval(pollInterval);
    };
  }, []);

  /* ---- Lookup Maps ---- */
  const userMap = new Map<number, User>(users.map((u) => [u.id, u]));
  const channelMap = new Map<number, ChannelInfo>(
    channels.map((c) => [c.id, c])
  );

  /* ---- Client-Side Filtering ---- */
  const filteredActivities: ActivityItem[] =
    filter === "all"
      ? activities
      : activities.filter((a) => {
          const expectedType =
            ACTIVITY_TYPE_FOR_FILTER[filter as Exclude<FilterType, "all">];
          return expectedType ? a.type === expectedType : true;
        });

  /* ---- Date Grouping ---- */
  const groups: ActivityGroup[] = groupActivitiesByDate(filteredActivities);
  const hasActivities =
    groups.length > 0 && groups.some((g) => g.items.length > 0);

  /* ---- Activity Description Renderer ---- */

  /**
   * Builds the descriptive JSX for a single activity item based on its type.
   * Uses userMap and channelMap for enrichment, truncatePreview for content
   * length management, and currentUserId to personalize descriptions
   * (e.g., "mentioned you" vs "mentioned someone").
   */
  function renderActivityDescription(activity: ActivityItem): React.ReactNode {
    const user = userMap.get(activity.user_id);
    const displayName = user?.username ?? "Someone";
    const channel =
      activity.channel_id !== undefined
        ? channelMap.get(activity.channel_id)
        : undefined;
    const channelName = channel?.name ?? "a channel";
    const preview = activity.content_preview
      ? truncatePreview(activity.content_preview)
      : "";
    /* Personalise description when the activity targets the current user */
    const isOwnActivity =
      currentUserId !== undefined && activity.user_id === currentUserId;

    switch (activity.type) {
      case "mention":
        return (
          <div>
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-gray-900">{displayName}</span>
              {" mentioned you in "}
              <span className="font-semibold text-gray-900">
                #{channelName}
              </span>
            </p>
            {preview && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {preview}
              </p>
            )}
          </div>
        );

      case "thread_reply":
        return (
          <div>
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-gray-900">{displayName}</span>
              {" replied to a thread in "}
              <span className="font-semibold text-gray-900">
                #{channelName}
              </span>
            </p>
            {preview && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {preview}
              </p>
            )}
          </div>
        );

      case "reaction":
        return (
          <div>
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-gray-900">{displayName}</span>
              {isOwnActivity
                ? " reacted to a message in "
                : " reacted to your message in "}
              <span className="font-semibold text-gray-900">
                #{channelName}
              </span>
              {preview && <span className="ml-1">{preview}</span>}
            </p>
          </div>
        );

      case "channel_join":
        return (
          <div>
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-gray-900">{displayName}</span>
              {" joined "}
              <span className="font-semibold text-gray-900">
                #{channelName}
              </span>
            </p>
          </div>
        );

      default:
        return (
          <div>
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-gray-900">{displayName}</span>
              {preview ? `: ${preview}` : " performed an action"}
            </p>
          </div>
        );
    }
  }

  /* ---- Loading State ---- */
  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Activity</h2>
          <p className="text-sm text-gray-500">
            Catch up on mentions, reactions, and replies
          </p>
        </div>

        {/* Loading skeleton */}
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-500">Loading activity...</p>
        </div>
      </div>
    );
  }

  /* ---- Main Render ---- */
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">Activity</h2>
        <p className="text-sm text-gray-500">
          Catch up on mentions, reactions, and replies
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-1 px-6 py-2 border-b border-gray-200">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setFilter(tab.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === tab.value
                ? "bg-[#1164A3] text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Activity List or Empty State */}
      {hasActivities ? (
        <div className="flex-1 overflow-y-auto slack-scrollbar">
          {groups.map((group) => (
            <div key={group.label}>
              {/* Date group header */}
              <div className="px-6 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
                {group.label}
              </div>

              {/* Activity items within this date group */}
              {group.items.map((activity) => {
                const activityUser = userMap.get(activity.user_id);
                const isUnread = isRecentActivity(
                  activity.created_at,
                  UNREAD_THRESHOLD_HOURS
                );

                return (
                  <div
                    key={activity.id}
                    className={`activity-item px-6 py-3 border-b border-gray-100 flex items-start gap-3 hover:bg-gray-50 ${
                      isUnread ? "activity-item-unread" : ""
                    }`}
                  >
                    {/* Left: User Avatar */}
                    <UserAvatar
                      username={activityUser?.username ?? "?"}
                      avatarColor={activityUser?.avatar_color ?? "#808080"}
                      size="sm"
                    />

                    {/* Center: Activity description */}
                    <div className="flex-1 min-w-0">
                      {renderActivityDescription(activity)}
                    </div>

                    {/* Right: Relative timestamp */}
                    <span className="text-xs text-gray-400 whitespace-nowrap shrink-0 pt-0.5">
                      {formatRelativeTime(activity.created_at)}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        /* Empty state — no activities match the current filter */
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <BellIcon />
          <h3 className="text-lg font-semibold text-gray-700 mt-4">
            You&apos;re all caught up!
          </h3>
          <p className="text-sm text-gray-500 mt-2 max-w-xs">
            {filter === "all"
              ? "When someone mentions you or replies to your messages, it will show up here."
              : `No ${filter} to show right now. Check back later!`}
          </p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import type { BrowseChannel } from "@/lib/types";

/**
 * Props interface for the ChannelBrowser component.
 *
 * Provides an optional callback to notify parent components when a user
 * selects (joins or navigates to) a channel from the browse list.
 */
export interface ChannelBrowserProps {
  /** Optional callback invoked when a channel is selected by the user */
  onChannelSelect?: (channelId: number) => void;
}

/** Available sort options for the channel browser */
type SortOption = "name" | "members" | "created";

/**
 * Formats a date string into a short, human-readable date format.
 *
 * @param dateStr - ISO 8601 date string from the API
 * @returns Formatted date like "Jan 15, 2024"
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Formats a member count into a concise display string.
 *
 * @param count - Number of members in the channel
 * @returns Formatted string like "42 members" or "1 member"
 */
function formatMemberCount(count: number): string {
  if (count === 1) {
    return "1 member";
  }
  return `${count} member${count !== 1 ? "s" : ""}`;
}

/**
 * Sorts an array of BrowseChannel objects by the specified sort option.
 *
 * @param channels - Array of channels to sort
 * @param sortBy - Sort criterion: "name" (alphabetical), "members" (descending), or "created" (newest first)
 * @returns A new sorted array (does not mutate the input)
 */
function sortChannels(
  channels: BrowseChannel[],
  sortBy: SortOption
): BrowseChannel[] {
  const sorted = [...channels];
  switch (sortBy) {
    case "name":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "members":
      sorted.sort((a, b) => b.member_count - a.member_count);
      break;
    case "created":
      sorted.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      break;
  }
  return sorted;
}

/**
 * ChannelBrowser — Browse and discover public channels in the workspace.
 *
 * Renders a full-page channel browser view matching the Slack web app's
 * "Browse Channels" screen. Features include:
 * - Fetches all browsable channels from GET /api/channels/browse on mount
 * - Real-time client-side search filtering by channel name and description
 * - Sortable by name (A–Z), most members, or newest
 * - Channel rows display name, description, member count, creator, and creation date
 * - Join/Joined action buttons per channel row
 * - Empty state with helpful messaging when no channels match the search
 * - Comprehensive loading and error states
 *
 * @param props - ChannelBrowserProps with optional onChannelSelect callback
 * @returns The rendered channel browser UI
 */
export default function ChannelBrowser({
  onChannelSelect,
}: ChannelBrowserProps) {
  /** All channels fetched from the API */
  const [channels, setChannels] = useState<BrowseChannel[]>([]);
  /** Current search/filter query string */
  const [searchQuery, setSearchQuery] = useState<string>("");
  /** Whether the initial data fetch is in progress */
  const [loading, setLoading] = useState<boolean>(true);
  /** Current sort option */
  const [sortBy, setSortBy] = useState<SortOption>("name");
  /** Set of channel IDs the user has "joined" in the current session */
  const [joinedChannels, setJoinedChannels] = useState<Set<number>>(
    new Set()
  );
  /** Error message if the API fetch fails */
  const [error, setError] = useState<string>("");

  /* Fetch all browsable channels on component mount */
  useEffect(() => {
    let cancelled = false;

    async function fetchChannels(): Promise<void> {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/channels/browse");
        if (!response.ok) {
          throw new Error(
            `Failed to fetch channels (HTTP ${response.status})`
          );
        }
        const data: BrowseChannel[] = await response.json();
        if (!cancelled) {
          setChannels(data);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Failed to load channels";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchChannels();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Handles joining a channel — adds the channel to the local joined set
   * and invokes the optional onChannelSelect callback.
   */
  function handleJoinChannel(channelId: number): void {
    setJoinedChannels((prev) => {
      const next = new Set(prev);
      next.add(channelId);
      return next;
    });
    if (onChannelSelect) {
      onChannelSelect(channelId);
    }
  }

  /**
   * Handles clicking on a channel row — invokes onChannelSelect if provided.
   */
  function handleChannelClick(channelId: number): void {
    if (onChannelSelect) {
      onChannelSelect(channelId);
    }
  }

  /* Compute filtered and sorted channel list */
  const query = searchQuery.trim().toLowerCase();
  const filteredChannels = channels.filter((channel) => {
    if (query === "") {
      return true;
    }
    const nameMatch = channel.name.toLowerCase().includes(query);
    const descMatch = (channel.description || "")
      .toLowerCase()
      .includes(query);
    return nameMatch || descMatch;
  });
  const displayChannels = sortChannels(filteredChannels, sortBy);

  /* Render loading skeleton */
  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white" role="status">
        {/* Header skeleton */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-24 bg-gray-100 rounded animate-pulse mt-2" />
        </div>
        {/* Search bar skeleton */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-200">
          <div className="flex-1 h-9 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-9 w-36 bg-gray-100 rounded-lg animate-pulse" />
        </div>
        {/* Channel list skeletons */}
        <div className="flex-1 overflow-y-auto">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="px-6 py-4 border-b border-gray-100 flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-64 bg-gray-100 rounded animate-pulse mt-2" />
                <div className="h-3 w-32 bg-gray-100 rounded animate-pulse mt-1" />
              </div>
              <div className="h-8 w-16 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* Render error state */
  if (error) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-900">Browse Channels</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 text-sm">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 text-sm text-[#1164A3] border border-[#1164A3] rounded hover:bg-[#1164A3] hover:text-white transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ── Header ── */}
      <header className="px-6 py-4 border-b border-gray-200">
        <h1 className="text-lg font-bold text-gray-900">Browse Channels</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {channels.length === 0
            ? "No channels available"
            : channels.length === 1
              ? "1 channel"
              : `${channels.length} channels`}
        </p>
      </header>

      {/* ── Search and Sort Bar ── */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-200">
        <label htmlFor="channel-search" className="sr-only">
          Search channels
        </label>
        <input
          id="channel-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search channels"
          className="flex-1 px-4 py-2 bg-gray-100 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#1164A3] focus:border-transparent"
        />
        <label htmlFor="channel-sort" className="sr-only">
          Sort channels
        </label>
        <select
          id="channel-sort"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="px-3 py-2 bg-gray-100 rounded-lg border border-gray-300 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#1164A3] focus:border-transparent cursor-pointer"
        >
          <option value="name">A–Z</option>
          <option value="members">Most members</option>
          <option value="created">Newest</option>
        </select>
      </div>

      {/* ── Channel List ── */}
      <div className="flex-1 overflow-y-auto" role="list" aria-label="Channels">
        {displayChannels.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <svg
              className="w-12 h-12 text-gray-300 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <p className="text-sm text-gray-500 font-medium">
              No channels found
            </p>
            {searchQuery.trim() !== "" && (
              <p className="text-sm text-gray-400 mt-1">
                No channels match &ldquo;{searchQuery.trim()}&rdquo;
              </p>
            )}
            <p className="text-sm text-[#1164A3] mt-3 cursor-pointer hover:underline">
              Create a new channel
            </p>
          </div>
        ) : (
          displayChannels.map((channel) => {
            const isJoined = joinedChannels.has(channel.id);
            return (
              <div
                key={channel.id}
                role="listitem"
                className="px-6 py-4 border-b border-gray-100 hover:bg-[#F8F8F8] cursor-pointer flex items-start justify-between gap-4 transition-colors"
                onClick={() => handleChannelClick(channel.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleChannelClick(channel.id);
                  }
                }}
                tabIndex={0}
              >
                {/* Channel info (left side) */}
                <div className="flex-1 min-w-0">
                  {/* Row 1: Channel name + member count badge + creation date */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 text-sm">
                      <span className="text-gray-500 font-normal">#</span>{" "}
                      {channel.name}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full inline-flex items-center whitespace-nowrap">
                      {formatMemberCount(channel.member_count)}
                    </span>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(channel.created_at)}
                    </span>
                  </div>

                  {/* Row 2: Channel description (truncated to 1 line) */}
                  {channel.description ? (
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {channel.description}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 italic truncate mt-1">
                      No description
                    </p>
                  )}

                  {/* Row 3: Creator info */}
                  {channel.creator_name && (
                    <p className="text-xs text-gray-400 mt-1">
                      Created by {channel.creator_name}
                    </p>
                  )}
                </div>

                {/* Action button (right side) */}
                <div className="shrink-0 self-center">
                  {isJoined ? (
                    <span className="inline-flex items-center px-3 py-1 text-sm text-gray-400 border border-gray-300 rounded select-none">
                      Joined
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinChannel(channel.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                        }
                      }}
                      className="inline-flex items-center px-3 py-1 text-sm text-[#1164A3] border border-[#1164A3] rounded hover:bg-[#1164A3] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1164A3] focus-visible:ring-offset-2"
                    >
                      Join
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

"use client";

/**
 * PeopleDirectory — People/Member Directory Page Component
 *
 * Renders a workspace member directory with search filtering, user avatars,
 * display names, titles, statuses, and availability indicators. Matches the
 * Slack web app "People" view layout.
 *
 * Consumed by: src/app/(workspace)/people/page.tsx
 *
 * Data source: GET /api/users
 * Filtering: Client-side by username, display_name, and title
 */

import { useState, useEffect } from "react";
import type { User, UserStatus } from "@/lib/types";
import UserAvatar from "@/app/components/UserAvatar";

/* -------------------------------------------------------------------------- */
/*  Props Interface                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Props for the PeopleDirectory component.
 *
 * @property onUserClick — Optional callback invoked when a user row is clicked,
 *   receiving the user's numeric ID. Used by parent pages to open user profile
 *   panels or navigate to DM conversations.
 */
export interface PeopleDirectoryProps {
  onUserClick?: (userId: number) => void;
}

/* -------------------------------------------------------------------------- */
/*  Magnifying Glass SVG Icon                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Inline SVG magnifying glass icon for the search input.
 * Uses currentColor so it inherits the parent's text color.
 */
function SearchIcon() {
  return (
    <svg
      className="w-4 h-4 text-gray-400 shrink-0"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Helper: Extract user status as a structured object                        */
/* -------------------------------------------------------------------------- */

/**
 * Extracts the status fields from a User object and returns them as a
 * structured UserStatus-compatible shape, or null if the user has no status.
 * This bridges the optional status fields on User with the required-field
 * UserStatus interface for consistent rendering.
 */
function extractUserStatus(
  user: User,
): Pick<UserStatus, "status_emoji" | "status_text"> | null {
  if (user.status_emoji) {
    return {
      status_emoji: user.status_emoji,
      status_text: user.status_text ?? "",
    };
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/*  Helper: Deterministic presence assignment (mock)                          */
/* -------------------------------------------------------------------------- */

/**
 * Deterministically assign an online/away presence status based on the user's
 * ID. This is purely cosmetic mock logic — in a production app, presence would
 * come from the server.
 */
function getPresenceStatus(userId: number): "online" | "away" | "offline" {
  const mod = userId % 3;
  if (mod === 0) return "online";
  if (mod === 1) return "away";
  return "offline";
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function PeopleDirectory({
  onUserClick,
}: PeopleDirectoryProps) {
  /* ---------------------------------------------------------------------- */
  /*  State                                                                  */
  /* ---------------------------------------------------------------------- */

  /** Full user list fetched from the API */
  const [users, setUsers] = useState<User[]>([]);

  /** Current search query entered by the user */
  const [searchQuery, setSearchQuery] = useState<string>("");

  /** Whether the initial data fetch is in progress */
  const [loading, setLoading] = useState<boolean>(true);

  /** Error message if the fetch fails */
  const [error, setError] = useState<string>("");

  /* ---------------------------------------------------------------------- */
  /*  Data Fetching                                                          */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    async function fetchUsers(): Promise<void> {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/users");
        if (!response.ok) {
          throw new Error(`Failed to fetch users: ${response.status}`);
        }
        const data: User[] = await response.json();
        if (!cancelled) {
          setUsers(data);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "An unknown error occurred";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------------------------------------------------------------------- */
  /*  Client-side search filtering                                           */
  /* ---------------------------------------------------------------------- */

  const filteredUsers: User[] = (() => {
    if (searchQuery.trim().length === 0) {
      return users;
    }

    const lowerQuery = searchQuery.toLowerCase();

    return users.filter((user) => {
      const matchesUsername = user.username
        .toLowerCase()
        .includes(lowerQuery);

      const matchesDisplayName = user.display_name
        ? user.display_name.toLowerCase().includes(lowerQuery)
        : false;

      const matchesTitle = user.title
        ? user.title.toLowerCase().includes(lowerQuery)
        : false;

      return matchesUsername || matchesDisplayName || matchesTitle;
    });
  })();

  /* ---------------------------------------------------------------------- */
  /*  Event Handlers                                                         */
  /* ---------------------------------------------------------------------- */

  /**
   * Handles click on a user row. Invokes the parent-provided callback
   * if present. Uses a button wrapper for accessibility.
   */
  function handleUserClick(userId: number): void {
    if (onUserClick) {
      onUserClick(userId);
    }
  }

  /**
   * Handles search input change — updates query state for real-time filtering.
   */
  function handleSearchChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ): void {
    setSearchQuery(event.target.value);
  }

  /* ---------------------------------------------------------------------- */
  /*  Render: Loading State                                                  */
  /* ---------------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* Header skeleton */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
        {/* Search skeleton */}
        <div className="px-6 py-3 border-b border-gray-200">
          <div className="h-9 w-full bg-gray-100 rounded-lg animate-pulse" />
        </div>
        {/* Row skeletons */}
        <div className="flex-1 overflow-y-auto">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-6 py-3 border-b border-gray-100"
            >
              <div className="w-9 h-9 bg-gray-200 rounded-md animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /*  Render: Error State                                                    */
  /* ---------------------------------------------------------------------- */

  if (error) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">People</h2>
        </div>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <p className="text-sm text-red-600 font-medium">
              Failed to load people directory
            </p>
            <p className="text-xs text-gray-500 mt-1">{error}</p>
            <button
              type="button"
              className="mt-3 px-4 py-2 text-sm text-white bg-[#1164A3] rounded hover:bg-[#0e5a94] transition-colors"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /*  Render: Empty Workspace (no users at all)                              */
  /* ---------------------------------------------------------------------- */

  if (users.length === 0) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">People</h2>
        </div>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <span className="text-4xl" role="img" aria-label="People">
              👥
            </span>
            <p className="text-sm font-medium text-gray-700 mt-3">
              No members yet
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Members will appear here once they join the workspace.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /*  Render: Main Content                                                   */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ---------------------------------------------------------------- */}
      {/*  Header                                                          */}
      {/* ---------------------------------------------------------------- */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <h2 className="text-lg font-bold text-gray-900">People</h2>
          <span className="text-sm text-gray-500 ml-2">
            {users.length} {users.length === 1 ? "member" : "members"}
          </span>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/*  Search Bar                                                      */}
      {/* ---------------------------------------------------------------- */}
      <div className="px-6 py-3 border-b border-gray-200">
        <div className="relative flex items-center">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <SearchIcon />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search people"
            className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#1164A3] focus:border-transparent"
            aria-label="Search people"
          />
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/*  User List                                                       */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex-1 overflow-y-auto">
        {filteredUsers.length === 0 ? (
          /* Empty search results */
          <div className="flex items-center justify-center h-full px-6">
            <div className="text-center">
              <span className="text-3xl" role="img" aria-label="No results">
                🔍
              </span>
              <p className="text-sm font-medium text-gray-700 mt-3">
                No people found
              </p>
              <p className="text-xs text-gray-500 mt-1">
                No results match &ldquo;{searchQuery}&rdquo;. Try a different
                search term.
              </p>
            </div>
          </div>
        ) : (
          filteredUsers.map((user) => {
            const displayName = user.display_name || user.username;
            const presenceStatus = getPresenceStatus(user.id);

            return (
              <button
                key={user.id}
                type="button"
                className="flex items-center gap-4 px-6 py-3 border-b border-gray-100 hover:bg-[#F8F8F8] cursor-pointer w-full text-left transition-colors"
                onClick={() => handleUserClick(user.id)}
                aria-label={`View profile of ${displayName}`}
              >
                {/* Avatar */}
                <UserAvatar
                  username={user.username}
                  avatarColor={user.avatar_color}
                  size="md"
                  status={presenceStatus}
                />

                {/* User info — center column */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-gray-900 text-sm truncate">
                      {displayName}
                    </span>
                    {user.display_name && user.display_name !== user.username && (
                      <span className="text-xs text-gray-500 truncate">
                        @{user.username}
                      </span>
                    )}
                  </div>
                  {user.title && (
                    <p className="text-sm text-gray-600 truncate mt-0.5">
                      {user.title}
                    </p>
                  )}
                </div>

                {/* Right side — status + message action */}
                <div className="flex items-center gap-3 shrink-0">
                  {/* Status emoji + text (extracted via UserStatus type) */}
                  {(() => {
                    const status = extractUserStatus(user);
                    if (!status) return null;
                    return (
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <span role="img" aria-label="Status emoji">
                          {status.status_emoji}
                        </span>
                        {status.status_text && (
                          <span className="max-w-[120px] truncate">
                            {status.status_text}
                          </span>
                        )}
                      </span>
                    );
                  })()}

                  {/* Message action indicator — outer button provides interactive semantics */}
                  <span
                    className="text-sm text-[#1164A3] hover:underline whitespace-nowrap"
                    aria-label={`Message ${displayName}`}
                  >
                    Message
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

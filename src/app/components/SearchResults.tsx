"use client";

import { useState, useEffect, useCallback } from "react";
import type { SearchResult, Message, Channel, FileItem, User } from "@/lib/types";
import UserAvatar from "@/app/components/UserAvatar";

/**
 * Props for the SearchResults component.
 * initialQuery allows pre-populating the search field from URL params or parent state.
 */
export interface SearchResultsProps {
  initialQuery?: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const TABS = [
  { id: "messages", label: "Messages" },
  { id: "files", label: "Files" },
  { id: "channels", label: "Channels" },
  { id: "people", label: "People" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/** Mock recent search suggestions shown when the query is empty. */
const RECENT_SEARCHES: string[] = [
  "project update",
  "meeting notes",
  "deployment schedule",
  "quarterly review",
  "design system",
];

/* ------------------------------------------------------------------ */
/*  Helper Functions                                                  */
/* ------------------------------------------------------------------ */

/**
 * Wraps occurrences of `query` inside `text` with highlighted <mark> tags.
 * Returns plain text when query is empty or no matches are found.
 */
function highlightSearchTerms(
  text: string,
  query: string,
): React.ReactNode {
  const trimmed = query.trim();
  if (!trimmed) return text;

  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  if (parts.length <= 1) return text;

  const lowerQuery = trimmed.toLowerCase();

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === lowerQuery ? (
          <mark key={i} className="bg-yellow-200 px-0.5 rounded">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

/** Formats an ISO date string to a short time representation. */
function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Formats an ISO date string to a short date representation. */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Converts a raw byte count to a human-readable file-size string. */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/** Returns an emoji icon representing the given file type string. */
function getFileTypeIcon(fileType: string): string {
  const t = fileType.toLowerCase();
  if (/image|png|jpe?g|gif|svg|webp/.test(t)) return "🖼️";
  if (/pdf/.test(t)) return "📄";
  if (/doc|word|rtf/.test(t)) return "📝";
  if (/xls|sheet|csv/.test(t)) return "📊";
  if (/code|js|ts|py|rb|java|json|html|css/.test(t)) return "💻";
  if (/zip|tar|gz|rar|7z/.test(t)) return "📦";
  if (/video|mp4|mov|avi|webm/.test(t)) return "🎥";
  if (/audio|mp3|wav|ogg/.test(t)) return "🎵";
  return "📎";
}

/* ------------------------------------------------------------------ */
/*  Skeleton Loader                                                   */
/* ------------------------------------------------------------------ */

function SkeletonCard() {
  return (
    <div className="px-6 py-3 border-b border-gray-100 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-md bg-gray-200 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-3 w-20 bg-gray-200 rounded" />
            <div className="h-3 w-14 bg-gray-100 rounded" />
          </div>
          <div className="h-3 w-full bg-gray-200 rounded mb-1.5" />
          <div className="h-3 w-3/4 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Per-Type Result Renderers                                         */
/* ------------------------------------------------------------------ */

/** Renders a single message search result with avatar, author, time, and highlighted content. */
function MessageResult({
  message,
  query,
}: {
  message: Message;
  query: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <UserAvatar
        username={message.username || "?"}
        avatarColor={message.avatar_color || "#999"}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-gray-900 text-sm">
            {message.username || "Unknown"}
          </span>
          <span className="text-xs text-gray-400">
            {formatTime(message.created_at)}
          </span>
        </div>
        <p className="text-gray-700 text-sm mt-0.5 break-words">
          {highlightSearchTerms(message.content, query)}
        </p>
        <span className="text-xs text-gray-400 mt-1 inline-block">
          in&nbsp;#{message.channel_id}
        </span>
      </div>
    </div>
  );
}

/** Renders a single file search result with type icon, name, metadata, and size. */
function FileResult({
  file,
  query,
}: {
  file: FileItem;
  query: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-md bg-gray-100 flex items-center justify-center text-lg shrink-0">
        {getFileTypeIcon(file.file_type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 text-sm truncate">
          {highlightSearchTerms(file.name, query)}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-gray-500 capitalize">
            {file.file_type}
          </span>
          <span className="text-xs text-gray-300" aria-hidden="true">
            ·
          </span>
          <span className="text-xs text-gray-500">
            {formatFileSize(file.file_size)}
          </span>
          {file.created_at && (
            <>
              <span className="text-xs text-gray-300" aria-hidden="true">
                ·
              </span>
              <span className="text-xs text-gray-400">
                {formatDate(file.created_at)}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Renders a single channel search result with # prefix, name, description, and member count. */
function ChannelResult({
  channel,
  query,
}: {
  channel: Channel;
  query: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-md bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-500 shrink-0">
        #
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-gray-900 text-sm">
            {highlightSearchTerms(channel.name, query)}
          </span>
          {channel.member_count != null && (
            <span className="text-xs text-gray-400">
              {channel.member_count}{" "}
              {channel.member_count === 1 ? "member" : "members"}
            </span>
          )}
        </div>
        {channel.description && (
          <p className="text-sm text-gray-600 truncate mt-0.5">
            {highlightSearchTerms(channel.description, query)}
          </p>
        )}
      </div>
    </div>
  );
}

/** Renders a single people search result with avatar, display name, title, and status. */
function PeopleResult({ user }: { user: User }) {
  return (
    <div className="flex items-center gap-3">
      <UserAvatar
        username={user.username}
        avatarColor={user.avatar_color}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-gray-900 text-sm">
            {user.display_name || user.username}
          </span>
          {user.display_name && (
            <span className="text-xs text-gray-400">@{user.username}</span>
          )}
        </div>
        {user.title && (
          <p className="text-sm text-gray-600 truncate">{user.title}</p>
        )}
        {(user.status_emoji || user.status_text) && (
          <p className="text-xs text-gray-500 mt-0.5">
            {user.status_emoji && (
              <span className="mr-1">{user.status_emoji}</span>
            )}
            {user.status_text || ""}
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                    */
/* ------------------------------------------------------------------ */

export default function SearchResults({
  initialQuery = "",
}: SearchResultsProps) {
  /* ---- state ---- */
  const [query, setQuery] = useState<string>(initialQuery);
  const [activeTab, setActiveTab] = useState<TabId>("messages");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [peopleResults, setPeopleResults] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [recentSearches] = useState<string[]>(RECENT_SEARCHES);

  /* ---- memoised search ---- */
  const performSearch = useCallback(
    async (searchQuery: string): Promise<void> => {
      const trimmed = searchQuery.trim();
      if (!trimmed) {
        setResults([]);
        setPeopleResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        if (activeTab === "people") {
          const res = await fetch(
            `/api/users?search=${encodeURIComponent(trimmed)}`,
          );
          if (res.ok) {
            const data: User[] = await res.json();
            setPeopleResults(data);
          } else {
            setPeopleResults([]);
          }
        } else {
          const res = await fetch(
            `/api/search?query=${encodeURIComponent(trimmed)}&type=${activeTab}`,
          );
          if (res.ok) {
            const data: SearchResult[] = await res.json();
            setResults(data);
          } else {
            setResults([]);
          }
        }
      } catch {
        setResults([]);
        setPeopleResults([]);
      } finally {
        setLoading(false);
      }
    },
    [activeTab],
  );

  /* ---- debounced search on query/tab change ---- */
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [query, performSearch]);

  /* ---- derived state ---- */
  const hasResults =
    activeTab === "people" ? peopleResults.length > 0 : results.length > 0;

  /* ---- render helpers ---- */
  const renderResults = (): React.ReactNode => {
    /* loading skeleton */
    if (loading) {
      return (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      );
    }

    /* initial empty state — show recent searches */
    if (!query.trim()) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <div className="text-4xl mb-4" aria-hidden="true">
            🔍
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            Search your workspace
          </h3>
          <p className="text-sm text-gray-500 text-center max-w-sm">
            Find messages, files, channels, and people
          </p>
          {recentSearches.length > 0 && (
            <div className="mt-6 w-full max-w-sm">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Recent Searches
              </h4>
              <div className="flex flex-col">
                {recentSearches.map((search) => (
                  <button
                    key={search}
                    type="button"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded text-left"
                    onClick={() => setQuery(search)}
                  >
                    <span className="text-gray-400 text-xs" aria-hidden="true">
                      🕐
                    </span>
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    /* no results for current query */
    if (!hasResults) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <div className="text-4xl mb-4" aria-hidden="true">
            🔍
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            No results found for &ldquo;{query}&rdquo;
          </h3>
          <p className="text-sm text-gray-500 text-center max-w-sm">
            Try different keywords or check your spelling
          </p>
        </div>
      );
    }

    /* people tab — render from dedicated people state */
    if (activeTab === "people") {
      return peopleResults.map((user) => (
        <div
          key={user.id}
          className="px-6 py-3 border-b border-gray-100 hover:bg-[#F8F8F8] cursor-pointer transition-colors"
        >
          <PeopleResult user={user} />
        </div>
      ));
    }

    /* messages / files / channels — render from SearchResult array */
    return results.map((result, index) => (
      <div
        key={`${result.type}-${result.item.id}-${index}`}
        className="px-6 py-3 border-b border-gray-100 hover:bg-[#F8F8F8] cursor-pointer transition-colors"
      >
        {result.type === "message" && (
          <MessageResult message={result.item as Message} query={query} />
        )}
        {result.type === "file" && (
          <FileResult file={result.item as FileItem} query={query} />
        )}
        {result.type === "channel" && (
          <ChannelResult channel={result.item as Channel} query={query} />
        )}
      </div>
    ));
  };

  /* ---- main JSX ---- */
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Search Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="relative">
          <span
            className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none"
            aria-hidden="true"
          >
            🔍
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages, files, and more..."
            autoFocus={!initialQuery}
            className="w-full pl-10 pr-10 py-2 text-sm bg-gray-100 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1164A3] focus:border-transparent outline-none"
            aria-label="Search"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <nav
        className="flex gap-1 px-6 py-2 border-b border-gray-200"
        aria-label="Search result filters"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            aria-pressed={activeTab === tab.id}
            className={
              activeTab === tab.id
                ? "bg-[#1164A3] text-white rounded px-3 py-1 text-sm font-medium"
                : "text-gray-600 hover:bg-gray-100 rounded px-3 py-1 text-sm"
            }
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto">{renderResults()}</div>
    </div>
  );
}

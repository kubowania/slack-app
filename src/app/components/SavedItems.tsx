"use client";

/**
 * SavedItems — Saved/Bookmarked Items Page Component
 *
 * Displays bookmarked messages and files matching the Slack web app
 * "Saved Items" / "Later" view. Consumed by the workspace saved page route.
 *
 * Features:
 * - Fetches saved items from GET /api/saved on mount
 * - Filter tabs: All | Messages | Files
 * - Optimistic unsave via DELETE /api/saved with rollback on error
 * - Renders saved messages with UserAvatar, username, timestamp, content, source channel
 * - Renders saved files with type icon, filename, size, source channel, date
 * - Empty state when no saved items exist
 * - Loading skeleton state during initial fetch
 */

import { useState, useEffect } from "react";
import type { SavedItem, Message, FileItem } from "@/lib/types";
import UserAvatar from "@/app/components/UserAvatar";

/* -------------------------------------------------------------------------- */
/*  Props interface (exported for consumer type-checking)                      */
/* -------------------------------------------------------------------------- */

export interface SavedItemsProps {
  /** The ID of the current user viewing saved items. */
  currentUserId?: number;
}

/* -------------------------------------------------------------------------- */
/*  Enriched saved item type for API response with embedded data              */
/* -------------------------------------------------------------------------- */

/**
 * The API enriches each SavedItem with its associated message or file data
 * so the component can render full previews without additional fetches.
 */
interface EnrichedSavedItem extends SavedItem {
  /** Embedded message data when the saved item is a bookmarked message. */
  message?: Pick<Message, "content" | "username" | "avatar_color" | "created_at">;
  /** Embedded file data when the saved item is a bookmarked file. */
  file_item?: Pick<FileItem, "name" | "file_type" | "file_size">;
}

/* -------------------------------------------------------------------------- */
/*  Filter tab configuration                                                  */
/* -------------------------------------------------------------------------- */

type FilterValue = "all" | "messages" | "files";

interface FilterTab {
  label: string;
  value: FilterValue;
}

const FILTER_TABS: FilterTab[] = [
  { label: "All", value: "all" },
  { label: "Messages", value: "messages" },
  { label: "Files", value: "files" },
];

/* -------------------------------------------------------------------------- */
/*  Helper functions                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Format a file size in bytes to a human-readable string (KB / MB / GB).
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Format an ISO 8601 date string to a relative or absolute time display.
 */
function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Returns an emoji icon representing the file type category.
 */
function getFileTypeIcon(fileType: string): string {
  const type = fileType.toLowerCase();
  if (type.includes("image") || type === "png" || type === "jpg" || type === "jpeg" || type === "gif" || type === "svg") return "🖼️";
  if (type.includes("pdf")) return "📄";
  if (type.includes("spreadsheet") || type === "csv" || type === "xlsx" || type === "xls") return "📊";
  if (type.includes("document") || type === "doc" || type === "docx") return "📝";
  if (type.includes("presentation") || type === "ppt" || type === "pptx") return "📊";
  if (type.includes("code") || type === "js" || type === "ts" || type === "py" || type === "json" || type === "html" || type === "css") return "💻";
  if (type.includes("video") || type === "mp4" || type === "mov") return "🎥";
  if (type.includes("audio") || type === "mp3" || type === "wav") return "🎵";
  if (type.includes("zip") || type.includes("archive") || type === "tar" || type === "gz") return "📦";
  if (type.includes("markdown") || type === "md") return "📝";
  return "📎";
}

/**
 * Returns a Tailwind background color class for the file type icon container.
 */
function getFileTypeColor(fileType: string): string {
  const type = fileType.toLowerCase();
  if (type.includes("image") || type === "png" || type === "jpg" || type === "jpeg" || type === "gif" || type === "svg") return "bg-blue-100";
  if (type.includes("pdf")) return "bg-red-100";
  if (type.includes("spreadsheet") || type === "csv" || type === "xlsx") return "bg-green-100";
  if (type.includes("document") || type === "doc" || type === "docx") return "bg-blue-100";
  if (type.includes("code") || type === "js" || type === "ts" || type === "py") return "bg-gray-100";
  if (type.includes("video") || type === "mp4") return "bg-purple-100";
  if (type.includes("audio") || type === "mp3") return "bg-yellow-100";
  return "bg-gray-100";
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function SavedItems({ currentUserId }: SavedItemsProps) {
  /* ----- State ---------------------------------------------------------- */
  const [savedItems, setSavedItems] = useState<EnrichedSavedItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<FilterValue>("all");

  /* ----- Data Fetching -------------------------------------------------- */
  useEffect(() => {
    let cancelled = false;

    /* Skip fetching until currentUserId is available to prevent 400 responses */
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    async function fetchSavedItems(): Promise<void> {
      setLoading(true);
      try {
        const url = `/api/saved?user_id=${currentUserId}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch saved items: ${response.status}`);
        }
        const data: EnrichedSavedItem[] = await response.json();
        if (!cancelled) {
          setSavedItems(data);
        }
      } catch {
        /* Gracefully handle fetch errors — show empty state */
        if (!cancelled) {
          setSavedItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchSavedItems();

    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  /* ----- Client-Side Filtering ------------------------------------------ */
  const filteredItems = savedItems.filter((item) => {
    if (filter === "all") return true;
    if (filter === "messages") return item.message_id != null;
    if (filter === "files") return item.file_id != null;
    return true;
  });

  /* ----- Unsave (Optimistic) -------------------------------------------- */
  async function handleUnsave(itemId: number): Promise<void> {
    /* Optimistic removal — take a snapshot for rollback */
    const previousItems = [...savedItems];
    setSavedItems((prev) => prev.filter((item) => item.id !== itemId));

    try {
      const response = await fetch("/api/saved", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId }),
      });
      if (!response.ok) {
        throw new Error(`Failed to unsave item: ${response.status}`);
      }
    } catch {
      /* Rollback on error */
      setSavedItems(previousItems);
    }
  }

  /* ----- Item Counts for Header ----------------------------------------- */
  const totalCount = savedItems.length;
  const messageCount = savedItems.filter((i) => i.message_id != null).length;
  const fileCount = savedItems.filter((i) => i.file_id != null).length;

  function getFilterCount(filterValue: FilterValue): number {
    if (filterValue === "all") return totalCount;
    if (filterValue === "messages") return messageCount;
    if (filterValue === "files") return fileCount;
    return 0;
  }

  /* ----- Render --------------------------------------------------------- */
  return (
    <div className="flex flex-col h-full bg-white">
      {/* ================================================================= */}
      {/* Header                                                            */}
      {/* ================================================================= */}
      <header className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-gray-900">Saved Items</h1>
          {!loading && (
            <span className="text-sm text-gray-500">
              {totalCount} {totalCount === 1 ? "item" : "items"}
            </span>
          )}
        </div>
      </header>

      {/* ================================================================= */}
      {/* Filter Tabs                                                       */}
      {/* ================================================================= */}
      <nav
        className="flex items-center gap-1 px-6 py-2 border-b border-gray-200"
        aria-label="Saved items filter"
      >
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setFilter(tab.value)}
            className={
              filter === tab.value
                ? "bg-[#1164A3] text-white rounded px-3 py-1 text-sm font-medium"
                : "text-gray-600 hover:bg-gray-100 rounded px-3 py-1 text-sm"
            }
            aria-current={filter === tab.value ? "true" : undefined}
          >
            {tab.label}
            <span className="ml-1 text-xs opacity-75">
              ({getFilterCount(tab.value)})
            </span>
          </button>
        ))}
      </nav>

      {/* ================================================================= */}
      {/* Content Area                                                      */}
      {/* ================================================================= */}
      <div className="flex-1 overflow-y-auto">
        {/* Loading Skeleton */}
        {loading && (
          <div className="px-6 py-4" role="status" aria-label="Loading saved items">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 py-3 border-b border-gray-100 animate-pulse"
              >
                <div className="w-6 h-6 rounded-md bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                  <div className="h-2 bg-gray-100 rounded w-1/4" />
                </div>
                <div className="w-5 h-5 rounded bg-gray-200 shrink-0" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <span className="text-5xl mb-4" role="img" aria-label="Bookmark">
              🔖
            </span>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              {filter === "all"
                ? "No saved items yet"
                : filter === "messages"
                  ? "No saved messages"
                  : "No saved files"}
            </h2>
            <p className="text-sm text-gray-500 text-center max-w-xs">
              Save messages and files to find them later. Click the bookmark icon
              on any message or file to save it here.
            </p>
          </div>
        )}

        {/* Saved Items List */}
        {!loading && filteredItems.length > 0 && (
          <ul className="divide-y divide-gray-100" role="list">
            {filteredItems.map((item) => (
              <li key={item.id}>
                {item.message_id != null && item.message ? (
                  /* ------------------------------------------------------ */
                  /* Saved Message Card                                     */
                  /* ------------------------------------------------------ */
                  <div className="flex items-start gap-3 px-6 py-3 hover:bg-[#F8F8F8] group transition-colors">
                    {/* Avatar */}
                    <UserAvatar
                      username={item.message.username ?? "?"}
                      avatarColor={item.message.avatar_color ?? "#999999"}
                      size="sm"
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Name + timestamp row */}
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-gray-900 text-sm truncate">
                          {item.message.username ?? "Unknown"}
                        </span>
                        <span className="text-xs text-gray-400 shrink-0">
                          {formatTimestamp(item.message.created_at)}
                        </span>
                      </div>

                      {/* Message content preview (truncated) */}
                      <p className="text-sm text-gray-700 truncate mt-0.5">
                        {item.message.content}
                      </p>

                      {/* Source channel */}
                      {item.source_channel && (
                        <span className="text-xs text-gray-400 mt-0.5 inline-block">
                          in #{item.source_channel}
                        </span>
                      )}
                    </div>

                    {/* Unsave Button */}
                    <button
                      type="button"
                      onClick={() => handleUnsave(item.id)}
                      className="shrink-0 p-1.5 rounded text-[#E01E5A] hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                      aria-label={`Remove saved message from ${item.message.username ?? "unknown"}`}
                    >
                      {/* Filled bookmark SVG icon */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-5 h-5"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 2c-1.716 0-3.408.106-5.07.31C3.806 2.45 3 3.414 3 4.517V17.25a.75.75 0 001.075.676L10 15.082l5.925 2.844A.75.75 0 0017 17.25V4.517c0-1.103-.806-2.068-1.93-2.207A41.403 41.403 0 0010 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                ) : item.file_id != null && item.file_item ? (
                  /* ------------------------------------------------------ */
                  /* Saved File Card                                        */
                  /* ------------------------------------------------------ */
                  <div className="flex items-center gap-3 px-6 py-3 hover:bg-[#F8F8F8] group transition-colors">
                    {/* File type icon */}
                    <div
                      className={`w-8 h-8 rounded flex items-center justify-center text-base shrink-0 ${getFileTypeColor(item.file_item.file_type)}`}
                    >
                      {getFileTypeIcon(item.file_item.file_type)}
                    </div>

                    {/* File info */}
                    <div className="flex-1 min-w-0">
                      {/* Filename */}
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {item.file_item.name}
                      </p>

                      {/* File metadata */}
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500 uppercase">
                          {item.file_item.file_type}
                        </span>
                        <span className="text-xs text-gray-300">•</span>
                        <span className="text-xs text-gray-500">
                          {formatFileSize(item.file_item.file_size)}
                        </span>
                      </div>

                      {/* Source channel + saved date */}
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.source_channel && (
                          <span className="text-xs text-gray-400">
                            in #{item.source_channel}
                          </span>
                        )}
                        <span className="text-xs text-gray-300">•</span>
                        <span className="text-xs text-gray-400">
                          Saved {formatTimestamp(item.saved_at)}
                        </span>
                      </div>
                    </div>

                    {/* Unsave Button */}
                    <button
                      type="button"
                      onClick={() => handleUnsave(item.id)}
                      className="shrink-0 p-1.5 rounded text-[#E01E5A] hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                      aria-label={`Remove saved file ${item.file_item.name}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-5 h-5"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 2c-1.716 0-3.408.106-5.07.31C3.806 2.45 3 3.414 3 4.517V17.25a.75.75 0 001.075.676L10 15.082l5.925 2.844A.75.75 0 0017 17.25V4.517c0-1.103-.806-2.068-1.93-2.207A41.403 41.403 0 0010 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                ) : (
                  /* ------------------------------------------------------ */
                  /* Fallback: Saved item without embedded data              */
                  /* ------------------------------------------------------ */
                  <div className="flex items-center gap-3 px-6 py-3 hover:bg-[#F8F8F8] group transition-colors">
                    <div className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center text-gray-500 text-xs shrink-0">
                      ?
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-500">Saved item</p>
                      {item.source_channel && (
                        <span className="text-xs text-gray-400">
                          in #{item.source_channel}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUnsave(item.id)}
                      className="shrink-0 p-1.5 rounded text-[#E01E5A] hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                      aria-label="Remove saved item"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-5 h-5"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 2c-1.716 0-3.408.106-5.07.31C3.806 2.45 3 3.414 3 4.517V17.25a.75.75 0 001.075.676L10 15.082l5.925 2.844A.75.75 0 0017 17.25V4.517c0-1.103-.806-2.068-1.93-2.207A41.403 41.403 0 0010 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

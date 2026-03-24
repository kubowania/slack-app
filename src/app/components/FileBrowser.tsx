"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { FileItem } from "@/lib/types";

/**
 * Props for the FileBrowser component.
 *
 * @property channelId - Optional channel ID to filter files by a specific channel.
 *   When provided, only files shared in that channel are displayed.
 *   When omitted, all workspace files are shown.
 */
export interface FileBrowserProps {
  channelId?: number;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Converts a byte count into a human-readable file size string.
 * Handles bytes, KB, MB, and GB with one decimal place for sizes >= 1 KB.
 *
 * @param bytes - File size in bytes (non-negative integer)
 * @returns Formatted string (e.g., "0 B", "512 B", "1.2 KB", "3.5 MB", "1.1 GB")
 */
function formatFileSize(bytes: number): string {
  if (bytes < 0) {
    return "0 B";
  }
  if (bytes === 0) {
    return "0 B";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Returns an emoji icon representing the given file type category.
 *
 * @param fileType - File type string from the FileItem (e.g., "pdf", "image", "code")
 * @returns Emoji string for the file type
 */
function getFileTypeIcon(fileType: string): string {
  const normalized = fileType.toLowerCase();
  if (
    normalized === "image" ||
    normalized === "png" ||
    normalized === "jpg" ||
    normalized === "jpeg" ||
    normalized === "gif" ||
    normalized === "svg" ||
    normalized === "webp"
  ) {
    return "📷";
  }
  if (normalized === "pdf") {
    return "📄";
  }
  if (
    normalized === "document" ||
    normalized === "doc" ||
    normalized === "docx" ||
    normalized === "txt" ||
    normalized === "markdown" ||
    normalized === "md"
  ) {
    return "📝";
  }
  if (
    normalized === "spreadsheet" ||
    normalized === "xls" ||
    normalized === "xlsx" ||
    normalized === "csv"
  ) {
    return "📊";
  }
  if (
    normalized === "code" ||
    normalized === "js" ||
    normalized === "ts" ||
    normalized === "jsx" ||
    normalized === "tsx" ||
    normalized === "py" ||
    normalized === "html" ||
    normalized === "css" ||
    normalized === "json"
  ) {
    return "💻";
  }
  return "📎";
}

/**
 * Returns a Tailwind background color class string for the file type icon container.
 *
 * @param fileType - File type string from the FileItem
 * @returns Tailwind utility class for the icon background color
 */
function getFileTypeColor(fileType: string): string {
  const normalized = fileType.toLowerCase();
  if (
    normalized === "image" ||
    normalized === "png" ||
    normalized === "jpg" ||
    normalized === "jpeg" ||
    normalized === "gif" ||
    normalized === "svg" ||
    normalized === "webp"
  ) {
    return "bg-blue-100 text-blue-600";
  }
  if (normalized === "pdf") {
    return "bg-red-100 text-red-600";
  }
  if (
    normalized === "document" ||
    normalized === "doc" ||
    normalized === "docx" ||
    normalized === "txt" ||
    normalized === "markdown" ||
    normalized === "md"
  ) {
    return "bg-blue-100 text-blue-700";
  }
  if (
    normalized === "spreadsheet" ||
    normalized === "xls" ||
    normalized === "xlsx" ||
    normalized === "csv"
  ) {
    return "bg-green-100 text-green-600";
  }
  if (
    normalized === "code" ||
    normalized === "js" ||
    normalized === "ts" ||
    normalized === "jsx" ||
    normalized === "tsx" ||
    normalized === "py" ||
    normalized === "html" ||
    normalized === "css" ||
    normalized === "json"
  ) {
    return "bg-gray-100 text-gray-600";
  }
  return "bg-gray-100 text-gray-500";
}

/**
 * Maps a file type string to one of the filter categories used by the filter tabs.
 *
 * @param fileType - File type string from the FileItem
 * @returns One of "images" | "pdfs" | "documents" | "code" | "other"
 */
function getFileCategory(fileType: string): string {
  const normalized = fileType.toLowerCase();
  if (
    normalized === "image" ||
    normalized === "png" ||
    normalized === "jpg" ||
    normalized === "jpeg" ||
    normalized === "gif" ||
    normalized === "svg" ||
    normalized === "webp"
  ) {
    return "images";
  }
  if (normalized === "pdf") {
    return "pdfs";
  }
  if (
    normalized === "document" ||
    normalized === "doc" ||
    normalized === "docx" ||
    normalized === "txt" ||
    normalized === "markdown" ||
    normalized === "md"
  ) {
    return "documents";
  }
  if (
    normalized === "code" ||
    normalized === "js" ||
    normalized === "ts" ||
    normalized === "jsx" ||
    normalized === "tsx" ||
    normalized === "py" ||
    normalized === "html" ||
    normalized === "css" ||
    normalized === "json"
  ) {
    return "code";
  }
  return "other";
}

/**
 * Formats an ISO 8601 date string into a compact, human-readable date representation.
 *
 * @param dateStr - ISO 8601 timestamp string
 * @returns Formatted date string (e.g., "Jan 15, 2024")
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Returns a human-readable label for a file type value.
 *
 * @param fileType - File type string from the FileItem
 * @returns Capitalized label (e.g., "Image", "PDF", "Document")
 */
function getFileTypeLabel(fileType: string): string {
  const normalized = fileType.toLowerCase();
  if (
    normalized === "image" ||
    normalized === "png" ||
    normalized === "jpg" ||
    normalized === "jpeg" ||
    normalized === "gif" ||
    normalized === "svg" ||
    normalized === "webp"
  ) {
    return "Image";
  }
  if (normalized === "pdf") {
    return "PDF";
  }
  if (
    normalized === "document" ||
    normalized === "doc" ||
    normalized === "docx" ||
    normalized === "txt" ||
    normalized === "markdown" ||
    normalized === "md"
  ) {
    return "Document";
  }
  if (
    normalized === "spreadsheet" ||
    normalized === "xls" ||
    normalized === "xlsx" ||
    normalized === "csv"
  ) {
    return "Spreadsheet";
  }
  if (
    normalized === "code" ||
    normalized === "js" ||
    normalized === "ts" ||
    normalized === "jsx" ||
    normalized === "tsx" ||
    normalized === "py" ||
    normalized === "html" ||
    normalized === "css" ||
    normalized === "json"
  ) {
    return "Code";
  }
  return fileType.charAt(0).toUpperCase() + fileType.slice(1);
}

// =============================================================================
// Filter Tab Configuration
// =============================================================================

/** Filter tab definitions for the file type filter bar */
const FILTER_TABS: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Images", value: "images" },
  { label: "PDFs", value: "pdfs" },
  { label: "Documents", value: "documents" },
  { label: "Code", value: "code" },
];

/** Sort option definitions for the sort dropdown */
const SORT_OPTIONS: { label: string; value: string }[] = [
  { label: "Date", value: "date" },
  { label: "Name", value: "name" },
  { label: "Type", value: "type" },
  { label: "Size", value: "size" },
];

// =============================================================================
// FileBrowser Component
// =============================================================================

/**
 * FileBrowser — Page component for browsing workspace files.
 *
 * Displays shared files across the workspace with type-based icons, metadata
 * (name, type tag, uploader, channel, date, size), and supports both list and
 * grid view modes. Includes filtering by file type and sorting by multiple fields.
 *
 * Consumed by `src/app/(workspace)/files/page.tsx`.
 *
 * @param props - FileBrowserProps with optional channelId filter
 * @returns React element rendering the file browser UI
 */
export default function FileBrowser({ channelId }: FileBrowserProps) {
  // ---------------------------------------------------------------------------
  // Component State
  // ---------------------------------------------------------------------------

  /** Array of files fetched from the API */
  const [files, setFiles] = useState<FileItem[]>([]);

  /** Whether the initial data fetch is in progress */
  const [loading, setLoading] = useState<boolean>(true);

  /** Current display mode: "list" for row layout, "grid" for card layout */
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  /** Active sort field — one of "date", "name", "type", "size" */
  const [sortBy, setSortBy] = useState<string>("date");

  /** Active file type filter — one of "all", "images", "pdfs", "documents", "code" */
  const [filterType, setFilterType] = useState<string>("all");

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function fetchFiles(): Promise<void> {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (channelId !== undefined) {
          params.set("channel_id", String(channelId));
        }
        const queryString = params.toString();
        const url = queryString ? `/api/files?${queryString}` : "/api/files";
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch files: ${response.status}`);
        }
        const data: FileItem[] = await response.json();
        if (!cancelled) {
          setFiles(data);
        }
      } catch {
        if (!cancelled) {
          setFiles([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchFiles();

    return () => {
      cancelled = true;
    };
  }, [channelId, filterType]);

  // ---------------------------------------------------------------------------
  // Derived Data: Filtering and Sorting
  // ---------------------------------------------------------------------------

  /** Files after applying the active type filter */
  const filteredFiles: FileItem[] =
    filterType === "all"
      ? files
      : files.filter(
          (file) => getFileCategory(file.file_type) === filterType
        );

  /** Files after filtering AND sorting by the active sort field */
  const sortedFiles: FileItem[] = [...filteredFiles].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "type":
        return a.file_type.localeCompare(b.file_type);
      case "size":
        return b.file_size - a.file_size;
      case "date":
      default:
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
  });

  // ---------------------------------------------------------------------------
  // Render: Loading State
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* Header skeleton */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
        {/* Loading rows skeleton */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="flex items-center gap-4 py-3 border-b border-gray-100"
            >
              <div className="w-10 h-10 bg-gray-200 rounded animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Main Component
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ===================================================================
          Header: Title + View Mode Toggle
          =================================================================== */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Files</h1>

        {/* View mode toggle buttons */}
        <div className="flex items-center gap-1">
          {/* List view button */}
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded transition-colors ${
              viewMode === "list"
                ? "bg-gray-200 text-gray-900"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            }`}
            aria-label="List view"
            aria-pressed={viewMode === "list"}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="2"
                y="3"
                width="14"
                height="2"
                rx="0.5"
                fill="currentColor"
              />
              <rect
                x="2"
                y="8"
                width="14"
                height="2"
                rx="0.5"
                fill="currentColor"
              />
              <rect
                x="2"
                y="13"
                width="14"
                height="2"
                rx="0.5"
                fill="currentColor"
              />
            </svg>
          </button>

          {/* Grid view button */}
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded transition-colors ${
              viewMode === "grid"
                ? "bg-gray-200 text-gray-900"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            }`}
            aria-label="Grid view"
            aria-pressed={viewMode === "grid"}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="2"
                y="2"
                width="6"
                height="6"
                rx="1"
                fill="currentColor"
              />
              <rect
                x="10"
                y="2"
                width="6"
                height="6"
                rx="1"
                fill="currentColor"
              />
              <rect
                x="2"
                y="10"
                width="6"
                height="6"
                rx="1"
                fill="currentColor"
              />
              <rect
                x="10"
                y="10"
                width="6"
                height="6"
                rx="1"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* ===================================================================
          Filter / Sort Bar
          =================================================================== */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-gray-200">
        {/* File type filter tabs */}
        <div className="flex items-center gap-1" role="tablist" aria-label="Filter by file type">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={filterType === tab.value}
              onClick={() => setFilterType(tab.value)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                filterType === tab.value
                  ? "bg-[#1164A3] text-white font-medium"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="file-sort-select"
            className="text-sm text-gray-500"
          >
            Sort by:
          </label>
          <select
            id="file-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm text-gray-700 bg-white border border-gray-300 rounded px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-[#1164A3] focus-visible:border-transparent"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ===================================================================
          Content Area
          =================================================================== */}
      {sortedFiles.length === 0 ? (
        /* ----- Empty State ----- */
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <div className="text-5xl mb-4" aria-hidden="true">
            📁
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            No files shared yet
          </h2>
          <p className="text-sm text-gray-500 max-w-xs">
            {filterType !== "all"
              ? `No ${filterType} files found. Try a different filter or share some files.`
              : "Files shared in channels will appear here. Share a file to get started."}
          </p>
        </div>
      ) : viewMode === "list" ? (
        /* ----- List View ----- */
        <div className="flex-1 overflow-y-auto">
          {sortedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-4 px-6 py-3 border-b border-gray-100 hover:bg-[#F8F8F8] cursor-pointer transition-colors"
            >
              {/* File type icon */}
              <div
                className={`w-10 h-10 rounded flex items-center justify-center text-lg shrink-0 ${getFileTypeColor(
                  file.file_type
                )}`}
                aria-hidden="true"
              >
                {getFileTypeIcon(file.file_type)}
              </div>

              {/* File info: name, type tag, uploader */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {file.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-block px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-600">
                    {getFileTypeLabel(file.file_type)}
                  </span>
                  <span className="text-xs text-gray-400">
                    Uploaded by user #{file.uploaded_by}
                  </span>
                </div>
              </div>

              {/* Metadata: channel, date, size */}
              <div className="flex items-center gap-4 shrink-0 text-right">
                <span className="text-xs text-gray-500">
                  #{file.channel_id}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDate(file.created_at)}
                </span>
                <span className="text-xs text-gray-500 font-medium w-16 text-right">
                  {formatFileSize(file.file_size)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ----- Grid View ----- */
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-4 gap-4">
            {sortedFiles.map((file) => (
              <div
                key={file.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              >
                {/* Thumbnail / placeholder area */}
                {file.thumbnail_url ? (
                  <div className="aspect-video bg-gray-50 relative overflow-hidden">
                    <Image
                      src={file.thumbnail_url}
                      alt={`Preview of ${file.name}`}
                      className="object-cover"
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div
                    className={`aspect-video flex items-center justify-center text-3xl ${getFileTypeColor(
                      file.file_type
                    )}`}
                    aria-hidden="true"
                  >
                    {getFileTypeIcon(file.file_type)}
                  </div>
                )}

                {/* File name + metadata */}
                <div className="p-3">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {file.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-block px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-600">
                      {getFileTypeLabel(file.file_type)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatFileSize(file.file_size)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(file.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

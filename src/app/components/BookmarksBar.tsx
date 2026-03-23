"use client";

/**
 * BookmarksBar — Channel bookmarks bar component displayed below the channel header.
 *
 * Renders pinned links, documents, files, and canvases as horizontally-scrollable
 * bookmark chips with type-based icons. Supports adding new bookmarks and clicking
 * existing ones. Conditionally renders only when bookmarks exist or an add handler
 * is provided.
 */

// ---------------------------------------------------------------------------
// Exported Interfaces
// ---------------------------------------------------------------------------

/** Represents a single bookmark item in the bookmarks bar. */
export interface BookmarkItem {
  /** Unique identifier for the bookmark. */
  id: number;
  /** Display title shown on the bookmark chip. */
  title: string;
  /** Optional URL the bookmark points to (links, external resources). */
  url?: string;
  /** Bookmark content type — determines the default icon displayed. */
  type: "link" | "file" | "document" | "canvas";
  /** Optional custom icon (emoji) override. When provided, replaces the type-based default icon. */
  icon?: string;
}

/** Props accepted by the BookmarksBar component. */
export interface BookmarksBarProps {
  /** Array of bookmark items to display. */
  bookmarks: BookmarkItem[];
  /** Callback invoked when a bookmark chip is clicked. */
  onBookmarkClick?: (bookmark: BookmarkItem) => void;
  /** Callback invoked when the "Add bookmark" action is triggered. When absent, the add button is hidden. */
  onAddBookmark?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the default emoji icon for a given bookmark type.
 * If the bookmark provides a custom `icon`, that takes precedence (handled in render).
 */
function getDefaultIcon(type: BookmarkItem["type"]): string {
  switch (type) {
    case "link":
      return "🔗";
    case "file":
      return "📄";
    case "document":
      return "📝";
    case "canvas":
      return "🎨";
    default: {
      // Exhaustive check — ensures every type case is handled.
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * BookmarksBar renders a horizontal bar of bookmark chips below the channel header.
 *
 * Visibility rules:
 * - If there are bookmarks → render the bar with all bookmark chips.
 * - If there are no bookmarks but `onAddBookmark` is provided → render an empty-state placeholder.
 * - If there are no bookmarks and no `onAddBookmark` → render nothing (null).
 */
export default function BookmarksBar({
  bookmarks,
  onBookmarkClick,
  onAddBookmark,
}: BookmarksBarProps) {
  const hasBookmarks = bookmarks.length > 0;

  // Nothing to render when there are no bookmarks and no add action.
  if (!hasBookmarks && !onAddBookmark) {
    return null;
  }

  return (
    <div
      className="flex items-center gap-2 px-6 py-1.5 border-b border-gray-200 bg-white overflow-x-auto flex-nowrap"
      role="toolbar"
      aria-label="Channel bookmarks"
    >
      {/* ---- Bookmark chips ---- */}
      {bookmarks.map((bookmark) => {
        const icon = bookmark.icon || getDefaultIcon(bookmark.type);

        return (
          <button
            key={bookmark.id}
            type="button"
            onClick={() => onBookmarkClick?.(bookmark)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded border border-gray-200 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
            title={bookmark.url || bookmark.title}
            aria-label={`Bookmark: ${bookmark.title}`}
          >
            {/* Icon */}
            <span className="text-base leading-none" aria-hidden="true">
              {icon}
            </span>

            {/* Title — truncated when exceeding 150px */}
            <span className="max-w-[150px] truncate">{bookmark.title}</span>
          </button>
        );
      })}

      {/* ---- Add bookmark button ---- */}
      {onAddBookmark && (
        <button
          type="button"
          onClick={onAddBookmark}
          className="flex items-center gap-1 px-2.5 py-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded text-sm cursor-pointer shrink-0 transition-colors"
          aria-label="Add a bookmark"
        >
          <span className="text-base leading-none" aria-hidden="true">
            +
          </span>
          {!hasBookmarks && (
            <span className="text-sm text-gray-400">Add a bookmark</span>
          )}
        </button>
      )}
    </div>
  );
}

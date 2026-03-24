"use client";

import type { Channel } from "@/lib/types";

/**
 * Props interface for the ChannelHeader component.
 *
 * Defines the data and callback properties used by the channel header bar.
 * The header supports two display modes:
 * - Channel mode (default): Shows "# channel-name" with an optional description/topic
 * - DM mode (when `dmParticipantName` is provided): Shows the participant's name without a hash prefix
 *
 * Action icon buttons (search, pin, details) are rendered conditionally —
 * each button only appears when its corresponding click handler is provided.
 */
export interface ChannelHeaderProps {
  /** The channel data object containing name, description, and other metadata */
  channel: Channel;
  /** Number of members in the channel (displayed as a badge in the right section) */
  memberCount?: number;
  /** Callback invoked when the search icon button is clicked */
  onSearchClick?: () => void;
  /** Callback invoked when the pin icon button is clicked */
  onPinClick?: () => void;
  /** Callback invoked when the channel details (info) icon button is clicked */
  onDetailsClick?: () => void;
  /** When true, indicates this header is displayed in a thread/reply context */
  isThread?: boolean;
  /** For DM views: the participant's display name (replaces "# channel-name" with the name) */
  dmParticipantName?: string;
}

/**
 * SVG icon: Magnifying glass for search.
 * Monochrome icon using currentColor for inherited text color.
 */
function SearchIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
      aria-hidden="true"
    >
      <circle cx="8.5" cy="8.5" r="5.5" />
      <line x1="13" y1="13" x2="18" y2="18" />
    </svg>
  );
}

/**
 * SVG icon: Pin/thumbtack for pinned messages.
 * Monochrome icon using currentColor for inherited text color.
 */
function PinIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-4 h-4"
      aria-hidden="true"
    >
      <path d="M13.56 2.44a1.5 1.5 0 0 0-2.12 0L8.5 5.38 6.12 3a1 1 0 0 0-1.41 0L3 4.71a1 1 0 0 0 0 1.41l2.38 2.38-2.94 2.94a1.5 1.5 0 0 0 0 2.12l.71.71a1.5 1.5 0 0 0 2.12 0l2.94-2.94 2.38 2.38a1 1 0 0 0 1.41 0l1.71-1.71a1 1 0 0 0 0-1.41l-2.38-2.38 2.94-2.94a1.5 1.5 0 0 0 0-2.12l-.71-.71Z" />
    </svg>
  );
}

/**
 * SVG icon: Information circle for channel details panel.
 * Monochrome icon using currentColor for inherited text color.
 */
function InfoIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-4 h-4"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM9.25 10a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0V10Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * SVG icon: Person silhouette for member count display.
 * Monochrome icon using currentColor for inherited text color.
 */
function PersonIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-4 h-4"
      aria-hidden="true"
    >
      <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-7 9a7 7 0 1 1 14 0H3Z" />
    </svg>
  );
}

/**
 * ChannelHeader — Channel/DM header bar component.
 *
 * Renders the top bar of a channel or DM view, extracted and enhanced from
 * the original monolithic SlackClone component in page.tsx (lines 184–196).
 *
 * Layout structure:
 * ┌──────────────────────────────────────────────────────────────────┐
 * │ [Left Section]                                [Right Section]   │
 * │  # channel-name | Topic description            👤 3  🔍 📌 ℹ️  │
 * └──────────────────────────────────────────────────────────────────┘
 *
 * The left section displays the channel name (with # prefix for channels,
 * or the participant name for DMs) and an optional description/topic.
 *
 * The right section shows an optional member count badge and action icon
 * buttons for search, pinned messages, and channel details — each rendered
 * only when its corresponding callback handler prop is provided.
 *
 * Preserves the exact Tailwind CSS classes from the source:
 * - Container: px-6 py-3 border-b border-gray-200 flex items-center
 * - Channel name: text-lg font-bold text-gray-900
 * - Description: text-sm text-gray-500
 */
export default function ChannelHeader({
  channel,
  memberCount,
  onSearchClick,
  onPinClick,
  onDetailsClick,
  isThread = false,
  dmParticipantName,
}: ChannelHeaderProps) {
  /**
   * Determine the display name for the header.
   * - DM mode: use dmParticipantName directly (no # prefix)
   * - Thread mode: show "Thread" or fall back to channel name
   * - Channel mode (default): prefix with "# "
   */
  const displayName = dmParticipantName
    ? dmParticipantName
    : isThread
      ? `Thread in # ${channel.name}`
      : `# ${channel.name}`;

  /**
   * Determine whether to show the # prefix styling.
   * DM participant names do not get the # prefix.
   */
  const isDmView = Boolean(dmParticipantName);

  /** Safely access the channel description, defaulting to empty string */
  const description = channel.description || "";

  /** Check if any right-section elements should be rendered */
  const hasRightSection =
    memberCount !== undefined || onSearchClick || onPinClick || onDetailsClick;

  return (
    <header
      className="px-6 py-3 border-b border-gray-200 flex items-center justify-between"
      role="banner"
      aria-label={
        isDmView
          ? `Direct message with ${dmParticipantName}`
          : `Channel ${channel.name}`
      }
    >
      {/* Left Section: Channel/DM name and description */}
      <div className="flex items-center gap-2 min-w-0">
        <h2 className="text-lg font-bold text-gray-900 whitespace-nowrap">
          {displayName}
        </h2>
        {description && !isThread && (
          <span
            className="text-sm text-gray-500 truncate max-w-md"
            title={description}
          >
            | {description}
          </span>
        )}
      </div>

      {/* Right Section: Member count badge and action icon buttons */}
      {hasRightSection && (
        <div className="flex items-center gap-2 shrink-0">
          {/* Member count badge */}
          {memberCount !== undefined && (
            <button
              type="button"
              className="flex items-center gap-1 text-sm text-gray-500 hover:bg-gray-100 px-2 py-1 rounded cursor-pointer transition-colors"
              onClick={onDetailsClick}
              aria-label={`${memberCount} ${memberCount === 1 ? "member" : "members"}`}
            >
              <PersonIcon />
              <span>{memberCount}</span>
            </button>
          )}

          {/* Search icon button */}
          {onSearchClick && (
            <button
              type="button"
              className="p-2 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              onClick={onSearchClick}
              aria-label="Search in channel"
            >
              <SearchIcon />
            </button>
          )}

          {/* Pin icon button */}
          {onPinClick && (
            <button
              type="button"
              className="p-2 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              onClick={onPinClick}
              aria-label="View pinned messages"
            >
              <PinIcon />
            </button>
          )}

          {/* Channel details icon button */}
          {onDetailsClick && (
            <button
              type="button"
              className="p-2 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              onClick={onDetailsClick}
              aria-label="View channel details"
            >
              <InfoIcon />
            </button>
          )}
        </div>
      )}
    </header>
  );
}

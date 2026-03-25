"use client";

/**
 * UserAvatar — Reusable atomic avatar component for the Slack Clone application.
 *
 * Renders a colored square with the user's initial letter, supporting three
 * size variants (sm / md / lg) and an optional status indicator dot
 * (online / away / dnd / offline).
 *
 * This is the most foundational UI component — imported by nearly every other
 * component in the library (Sidebar, MessageBubble, ThreadPanel, UserProfile,
 * PeopleDirectory, ActivityFeed, HuddleOverlay, SavedItems, SearchResults).
 *
 * The "md" size exactly matches the original inline avatar in page.tsx:
 *   w-9 h-9 rounded-md text-sm font-bold text-white
 */

/* -------------------------------------------------------------------------- */
/*  Props interface                                                           */
/* -------------------------------------------------------------------------- */

interface UserAvatarProps {
  /** The user's display name — first character is shown as the avatar initial. */
  username: string;
  /** CSS hex color for the avatar background (e.g. "#4A154B"). */
  avatarColor: string;
  /**
   * Size variant for the avatar square.
   *  - sm  → 24 × 24 px — compact lists, thread replies
   *  - md  → 36 × 36 px — message bubbles (default, matches source)
   *  - lg  → 80 × 80 px — user profile panel
   */
  size?: "sm" | "md" | "lg";
  /**
   * Optional presence status shown as a small dot at the bottom-right corner.
   *  - online  → solid green dot   (#2BAC76)
   *  - away    → hollow grey ring  (#DDDDDD)
   *  - dnd     → solid red dot     (#E01E5A)
   *  - offline → no dot rendered
   */
  status?: "online" | "away" | "offline" | "dnd";
  /** Optional click handler — when provided the avatar renders as a button target. */
  onClick?: () => void;
  /** Additional Tailwind class names to merge onto the outermost wrapper. */
  className?: string;
}

/* -------------------------------------------------------------------------- */
/*  Size → Tailwind class mapping                                             */
/* -------------------------------------------------------------------------- */

const SIZE_CLASSES: Record<NonNullable<UserAvatarProps["size"]>, string> = {
  sm: "w-6 h-6 text-xs",      // 24 px
  md: "w-9 h-9 text-sm",      // 36 px — EXACT match to source page.tsx
  lg: "w-20 h-20 text-2xl",   // 80 px
};

/* -------------------------------------------------------------------------- */
/*  Status dot — position & size per avatar size                              */
/* -------------------------------------------------------------------------- */

const STATUS_DOT_POSITION: Record<
  NonNullable<UserAvatarProps["size"]>,
  string
> = {
  sm: "-bottom-0.5 -right-0.5 w-2 h-2",
  md: "-bottom-0.5 -right-0.5 w-2.5 h-2.5",
  lg: "-bottom-1 -right-1 w-4 h-4",
};

/**
 * Tailwind classes for the coloured fill of the status dot.
 * "online" and "away" also apply the corresponding utility class from
 * globals.css (.status-online / .status-away) which carry their own
 * background/border values.  We layer Tailwind size overrides on top so
 * the dot scales with the avatar.
 */
const STATUS_APPEARANCE: Record<
  Exclude<NonNullable<UserAvatarProps["status"]>, "offline">,
  string
> = {
  online: "bg-[#2BAC76] border-2 border-white",
  away: "bg-transparent border-2 border-[#DDDDDD]",
  dnd: "bg-[#E01E5A] border-2 border-white",
};

/**
 * CSS class names from globals.css used for status indicators.
 * These provide the base styling; Tailwind utilities above handle size.
 */
const STATUS_CSS_CLASS: Record<string, string> = {
  online: "status-online",
  away: "status-away",
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function UserAvatar({
  username,
  avatarColor,
  size = "md",
  status,
  onClick,
  className,
}: UserAvatarProps) {
  /* Derive initial letter — gracefully fall back to "?" for empty strings */
  const initial: string =
    username && username.length > 0 ? username[0].toUpperCase() : "?";

  /* Determine whether the status dot should render */
  const showStatusDot: boolean =
    status !== undefined && status !== "offline";

  /* Build the interactive wrapper classes */
  const wrapperClasses: string = [
    "relative inline-flex shrink-0",
    onClick ? "cursor-pointer" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  /* Build the inner avatar square classes — matches source exactly for md */
  const avatarClasses: string = [
    "rounded-md flex items-center justify-center text-white font-bold shrink-0",
    SIZE_CLASSES[size],
  ].join(" ");

  /* Build status dot classes when visible */
  const dotClasses: string | null =
    showStatusDot && status && status !== "offline"
      ? [
          "absolute rounded-full",
          STATUS_DOT_POSITION[size],
          STATUS_APPEARANCE[status],
          STATUS_CSS_CLASS[status] ?? "",
        ]
          .filter(Boolean)
          .join(" ")
      : null;

  /* Render as a <button> when interactive, otherwise a plain <div> */
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={wrapperClasses}
      onClick={onClick}
      aria-label={
        onClick
          ? `View profile of ${username || "unknown user"}`
          : undefined
      }
      data-testid="user-avatar"
    >
      {/* Avatar square with coloured background and initial letter */}
      <div
        className={avatarClasses}
        style={{ backgroundColor: avatarColor }}
        aria-hidden="true"
      >
        {initial}
      </div>

      {/* Status indicator dot — positioned at the bottom-right corner */}
      {showStatusDot && dotClasses && (
        <span
          className={dotClasses}
          role="img"
          aria-label={`Status: ${status}`}
        />
      )}
    </Tag>
  );
}

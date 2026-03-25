"use client";

/**
 * UserProfile — User Profile Side Panel Component
 *
 * Renders a slide-in panel on the right side of the main content area showing
 * detailed information about a selected user. The panel slides in from the
 * right using the `thread-panel-enter` CSS class (defined in globals.css).
 *
 * Features:
 * - Fetches full user profile from GET /api/users/{userId}
 * - Displays large avatar using UserAvatar component (lg size = w-20 h-20)
 * - Shows display name, @username, and job title/role
 * - Status section with emoji + text display
 * - StatusSelector for editing status directly from the profile
 * - Action buttons: Message and Huddle
 * - Contact information: email (link color), phone, timezone, local time
 * - Skeleton loading state with pulsing gray rectangles
 * - Handles missing optional fields gracefully (conditional rendering)
 *
 * Color palette (Slack design tokens):
 *   bg-white        — panel background
 *   #1164A3         — link color for email
 *   border-gray-200 — separator borders
 *   gray palette    — text hierarchy (900 / 600 / 500 / 400)
 *
 * Panel width: w-80 (320px)
 * Animation: thread-panel-enter (slideInRight from globals.css)
 */

import { useState, useEffect } from "react";
import type { UserProfile as UserProfileType, UserStatus } from "@/lib/types";
import UserAvatar from "@/app/components/UserAvatar";
import StatusSelector from "@/app/components/StatusSelector";

/* -------------------------------------------------------------------------- */
/*  Props Interface                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Props for the UserProfile side panel component.
 *
 * @property userId - The ID of the user whose profile is displayed
 * @property isOpen - Controls visibility of the panel (renders null when false)
 * @property onClose - Callback invoked when the user clicks the close button
 */
export interface UserProfileProps {
  /** The ID of the user to display */
  userId: number;
  /** Whether the profile panel is visible */
  isOpen: boolean;
  /** Callback invoked when the panel is closed */
  onClose: () => void;
}

/* -------------------------------------------------------------------------- */
/*  Utility — Calculate local time from IANA timezone string                  */
/* -------------------------------------------------------------------------- */

/**
 * Returns the current local time formatted as a human-readable string for
 * the given IANA timezone (e.g. "America/New_York"). Falls back to an empty
 * string if the timezone string is invalid or unrecognized by the browser's
 * Intl implementation.
 *
 * @param timezone - IANA timezone identifier (e.g. "America/New_York", "UTC")
 * @returns Formatted local time string (e.g. "2:30 PM EST") or empty string
 */
function getLocalTime(timezone: string): string {
  try {
    return new Date().toLocaleTimeString("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return "";
  }
}

/* -------------------------------------------------------------------------- */
/*  Loading Skeleton — Pulsing gray rectangles for avatar, name, fields       */
/* -------------------------------------------------------------------------- */

/**
 * Renders animated skeleton placeholders while profile data is loading.
 * Each placeholder pulses using Tailwind's `animate-pulse` utility to indicate
 * content is being fetched.
 */
function ProfileSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Avatar skeleton — circular placeholder matching lg avatar (w-20 h-20) */}
      <div className="flex flex-col items-center py-6 px-4">
        <div
          className="w-20 h-20 rounded-md bg-gray-200 animate-pulse"
          aria-hidden="true"
        />
        {/* Display name skeleton */}
        <div
          className="mt-3 w-32 h-6 rounded bg-gray-200 animate-pulse"
          aria-hidden="true"
        />
        {/* Username skeleton */}
        <div
          className="mt-2 w-20 h-4 rounded bg-gray-200 animate-pulse"
          aria-hidden="true"
        />
        {/* Title skeleton */}
        <div
          className="mt-1 w-24 h-4 rounded bg-gray-200 animate-pulse"
          aria-hidden="true"
        />
      </div>

      {/* Status skeleton */}
      <div className="px-4 pb-3">
        <div
          className="w-full h-10 rounded bg-gray-100 animate-pulse"
          aria-hidden="true"
        />
      </div>

      {/* Action buttons skeleton */}
      <div className="flex gap-2 px-4 py-3">
        <div
          className="flex-1 h-9 rounded bg-gray-200 animate-pulse"
          aria-hidden="true"
        />
        <div
          className="flex-1 h-9 rounded bg-gray-200 animate-pulse"
          aria-hidden="true"
        />
      </div>

      {/* Contact info skeleton */}
      <div className="px-4 py-3 border-t border-gray-200">
        {/* Email label + value */}
        <div
          className="w-20 h-3 rounded bg-gray-200 animate-pulse mb-1.5"
          aria-hidden="true"
        />
        <div
          className="w-44 h-4 rounded bg-gray-200 animate-pulse mb-4"
          aria-hidden="true"
        />
        {/* Phone label + value */}
        <div
          className="w-12 h-3 rounded bg-gray-200 animate-pulse mb-1.5"
          aria-hidden="true"
        />
        <div
          className="w-32 h-4 rounded bg-gray-200 animate-pulse mb-4"
          aria-hidden="true"
        />
        {/* Timezone label + value */}
        <div
          className="w-16 h-3 rounded bg-gray-200 animate-pulse mb-1.5"
          aria-hidden="true"
        />
        <div
          className="w-36 h-4 rounded bg-gray-200 animate-pulse"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Close Icon SVG — inline SVG with viewBox, fill="currentColor"             */
/* -------------------------------------------------------------------------- */

/**
 * Inline close (×) icon rendered as an SVG. Uses `currentColor` for fill so
 * the icon inherits the parent's text color. No hardcoded width/height — CSS
 * controls sizing via the `w-5 h-5` classes on the parent.
 */
function CloseIcon() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  UserProfile Component                                                     */
/* -------------------------------------------------------------------------- */

export default function UserProfile({
  userId,
  isOpen,
  onClose,
}: UserProfileProps) {
  /* -------------------------------------------------------------------- */
  /*  Component State                                                      */
  /* -------------------------------------------------------------------- */

  /** Full user profile data fetched from GET /api/users/{userId} */
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  /** Whether profile data is currently being fetched */
  const [loading, setLoading] = useState<boolean>(false);

  /* -------------------------------------------------------------------- */
  /*  Data Fetching — Fetch profile when panel opens or userId changes     */
  /* -------------------------------------------------------------------- */

  useEffect(() => {
    if (!isOpen || !userId) return;

    const controller = new AbortController();
    let cancelled = false;

    const fetchProfile = async () => {
      setLoading(true);
      setProfile(null);

      try {
        const response = await fetch(`/api/users/${userId}`, {
          signal: controller.signal,
        });

        if (cancelled) return;

        if (response.ok) {
          const data: UserProfileType = await response.json();
          setProfile(data);
        } else {
          setProfile(null);
        }
      } catch {
        if (!cancelled) {
          setProfile(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [userId, isOpen]);

  /* -------------------------------------------------------------------- */
  /*  Handler — Status change from StatusSelector                          */
  /* -------------------------------------------------------------------- */

  /**
   * Updates the local profile state when the user changes their status via
   * the StatusSelector component. Since there is no authentication, changes
   * are applied optimistically to the local state. A real implementation
   * would also PUT /api/users/{id}/status.
   */
  const handleStatusChange = (newStatus: UserStatus | null) => {
    if (!profile) return;

    setProfile({
      ...profile,
      status: newStatus ?? undefined,
      status_emoji: newStatus?.status_emoji,
      status_text: newStatus?.status_text,
    });
  };

  /* -------------------------------------------------------------------- */
  /*  Early return — Panel hidden                                          */
  /* -------------------------------------------------------------------- */

  if (!isOpen) return null;

  /* -------------------------------------------------------------------- */
  /*  Derived values for status display                                    */
  /* -------------------------------------------------------------------- */

  /** Status emoji from the nested status object or flat User fields */
  const statusEmoji: string =
    profile?.status?.status_emoji || profile?.status_emoji || "";

  /** Status text from the nested status object or flat User fields */
  const statusText: string =
    profile?.status?.status_text || profile?.status_text || "";

  /** Whether the user has any status set */
  const hasStatus: boolean = Boolean(statusEmoji || statusText);

  /** Construct UserStatus for the StatusSelector's currentStatus prop */
  const currentUserStatus: UserStatus | undefined = hasStatus
    ? {
        user_id: profile?.id ?? userId,
        status_emoji: statusEmoji,
        status_text: statusText,
        expires_at: profile?.status?.expires_at,
      }
    : undefined;

  /* -------------------------------------------------------------------- */
  /*  Render                                                               */
  /* -------------------------------------------------------------------- */

  return (
    <aside
      className="w-80 border-l border-gray-200 bg-white flex flex-col h-full thread-panel-enter"
      role="complementary"
      aria-label="User profile"
      data-testid="user-profile-panel"
    >
      {/* ================================================================ */}
      {/* Panel Header                                                      */}
      {/* ================================================================ */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
        <h2 className="text-sm font-bold text-gray-900">Profile</h2>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          type="button"
          aria-label="Close profile panel"
        >
          <CloseIcon />
        </button>
      </div>

      {/* ================================================================ */}
      {/* Loading Skeleton State                                            */}
      {/* ================================================================ */}
      {loading && <ProfileSkeleton />}

      {/* ================================================================ */}
      {/* Error / Not Found State                                           */}
      {/* ================================================================ */}
      {!loading && !profile && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-400">User not found</p>
        </div>
      )}

      {/* ================================================================ */}
      {/* Profile Content — rendered only when data is loaded               */}
      {/* ================================================================ */}
      {!loading && profile && (
        <div className="flex-1 overflow-y-auto">
          {/* ------------------------------------------------------------ */}
          {/* Avatar Section                                                */}
          {/* ------------------------------------------------------------ */}
          <div className="flex flex-col items-center py-6 px-4">
            <UserAvatar
              username={profile.display_name || profile.username}
              avatarColor={profile.avatar_color}
              size="lg"
              status={hasStatus ? "online" : undefined}
            />

            {/* Display name — falls back to username when no display_name */}
            <h3 className="text-xl font-bold text-gray-900 mt-3">
              {profile.display_name || profile.username}
            </h3>

            {/* @username — shown only when display_name is set */}
            {profile.display_name && (
              <p className="text-sm text-gray-500">@{profile.username}</p>
            )}

            {/* Title / role */}
            {profile.title && (
              <p className="text-sm text-gray-600 mt-1">{profile.title}</p>
            )}
          </div>

          {/* ------------------------------------------------------------ */}
          {/* Status Section                                                */}
          {/* ------------------------------------------------------------ */}
          {hasStatus && (
            <div className="flex items-center gap-2 mt-2 px-4 py-2 bg-gray-50 rounded mx-4 mb-3">
              {statusEmoji && (
                <span className="text-base" aria-hidden="true">
                  {statusEmoji}
                </span>
              )}
              {statusText && (
                <span className="text-sm text-gray-600">{statusText}</span>
              )}
            </div>
          )}

          {/* StatusSelector — allows editing status from the profile panel */}
          <div className="px-4 pb-2">
            <StatusSelector
              currentStatus={currentUserStatus}
              onStatusChange={handleStatusChange}
              userId={profile.id}
            />
          </div>

          {/* ------------------------------------------------------------ */}
          {/* Action Buttons                                                */}
          {/* ------------------------------------------------------------ */}
          <div className="flex gap-2 px-4 py-3">
            <button
              type="button"
              className="flex-1 px-3 py-2 text-sm text-center bg-white border border-gray-300 rounded hover:bg-gray-100 font-medium"
            >
              💬 Message
            </button>
            <button
              type="button"
              className="flex-1 px-3 py-2 text-sm text-center bg-white border border-gray-300 rounded hover:bg-gray-100 font-medium"
            >
              🎧 Huddle
            </button>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* Contact Information                                           */}
          {/* ------------------------------------------------------------ */}
          <div className="px-4 py-3 border-t border-gray-200">
            {/* Email */}
            {profile.email && (
              <div className="flex flex-col gap-0.5 mb-3">
                <span className="text-xs text-gray-400 uppercase font-semibold">
                  Email Address
                </span>
                <a
                  href={`mailto:${profile.email}`}
                  className="text-sm text-[#1164A3] hover:underline"
                >
                  {profile.email}
                </a>
              </div>
            )}

            {/* Phone */}
            {profile.phone && (
              <div className="flex flex-col gap-0.5 mb-3">
                <span className="text-xs text-gray-400 uppercase font-semibold">
                  Phone
                </span>
                <a
                  href={`tel:${profile.phone}`}
                  className="text-sm text-gray-900 hover:underline"
                >
                  {profile.phone}
                </a>
              </div>
            )}

            {/* Timezone */}
            {profile.timezone && (
              <div className="flex flex-col gap-0.5 mb-3">
                <span className="text-xs text-gray-400 uppercase font-semibold">
                  Timezone
                </span>
                <span className="text-sm text-gray-900">
                  {profile.timezone}
                </span>
              </div>
            )}

            {/* Local Time — calculated from the timezone field */}
            {profile.timezone && getLocalTime(profile.timezone) && (
              <div className="flex flex-col gap-0.5 mb-3">
                <span className="text-xs text-gray-400 uppercase font-semibold">
                  Local Time
                </span>
                <span className="text-sm text-gray-900">
                  {getLocalTime(profile.timezone)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}

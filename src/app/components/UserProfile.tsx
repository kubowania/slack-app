"use client";

/**
 * UserProfile — User Profile Side Panel Component
 *
 * Renders a slide-in panel on the right side of the main content area showing
 * detailed information about a selected user. Includes large avatar, display
 * name, username, title/role, status, contact info (email, phone), timezone,
 * and action buttons (Message, Call).
 *
 * Features:
 * - Fetches full user profile from GET /api/users/{id}
 * - Fetches user status from GET /api/users/{id}/status
 * - Displays avatar using UserAvatar component (lg size)
 * - Shows status emoji + text
 * - Contact information section
 * - Loading and error states
 * - Close button
 *
 * Color palette (from Slack design tokens):
 *   bg-white — panel background
 *   #1164A3 — action links
 *   border-gray-200 — separator borders
 */

import { useState, useEffect } from "react";
import UserAvatar from "@/app/components/UserAvatar";
import type { User } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/*  Extended User Profile Interface                                           */
/* -------------------------------------------------------------------------- */

/**
 * Full user profile data returned by GET /api/users/{id}.
 * Extends the base User interface with additional profile fields.
 */
interface UserProfileData extends User {
  email?: string;
  phone?: string;
  timezone?: string;
}

/**
 * User status data returned by GET /api/users/{id}/status.
 */
interface UserStatusData {
  status_emoji?: string;
  status_text?: string;
}

/* -------------------------------------------------------------------------- */
/*  Props Interface                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Props for the UserProfile component.
 *
 * @property userId - The ID of the user whose profile is displayed
 * @property isOpen - Controls visibility of the panel
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
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function UserProfile({
  userId,
  isOpen,
  onClose,
}: UserProfileProps) {
  /* ---- State ---- */
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [status, setStatus] = useState<UserStatusData | null>(null);
  /**
   * `fetchedForUserId` tracks which userId was last fetched. When it differs
   * from the current `userId` prop, the component is in a loading state.
   * This avoids calling setState synchronously inside an effect (which the
   * React 19 compiler lint rule forbids).
   */
  const [fetchedForUserId, setFetchedForUserId] = useState<number | null>(null);
  const loading = isOpen && fetchedForUserId !== userId;

  /* ---- Fetch user profile and status when userId changes ---- */
  useEffect(() => {
    if (!isOpen || !userId) return;

    const controller = new AbortController();
    let cancelled = false;

    const fetchData = async () => {
      try {
        const [profileRes, statusRes] = await Promise.all([
          fetch(`/api/users/${userId}`, { signal: controller.signal }),
          fetch(`/api/users/${userId}/status`, { signal: controller.signal }),
        ]);

        if (cancelled) return;

        const profileData: UserProfileData | null = profileRes.ok
          ? await profileRes.json()
          : null;
        const statusData: UserStatusData | null = statusRes.ok
          ? await statusRes.json()
          : null;

        if (!cancelled) {
          setProfile(profileData);
          setStatus(statusData);
          setFetchedForUserId(userId);
        }
      } catch {
        if (!cancelled) {
          setProfile(null);
          setStatus(null);
          setFetchedForUserId(userId);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [userId, isOpen]);

  /* ---- Don't render if not open ---- */
  if (!isOpen) return null;

  /* ---- Loading state ---- */
  if (loading) {
    return (
      <aside className="w-[360px] border-l border-gray-200 bg-white flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Profile</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
            aria-label="Close profile panel"
          >
            <span className="text-xl leading-none" aria-hidden="true">✕</span>
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400 text-sm">Loading profile...</p>
        </div>
      </aside>
    );
  }

  /* ---- Error / not found state ---- */
  if (!profile) {
    return (
      <aside className="w-[360px] border-l border-gray-200 bg-white flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Profile</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
            aria-label="Close profile panel"
          >
            <span className="text-xl leading-none" aria-hidden="true">✕</span>
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400 text-sm">User not found</p>
        </div>
      </aside>
    );
  }

  /* ---- Render ---- */
  return (
    <aside className="w-[360px] border-l border-gray-200 bg-white flex flex-col h-full">
      {/* ================================================================ */}
      {/* Profile Header                                                    */}
      {/* ================================================================ */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
        <h2 className="text-lg font-bold text-gray-900">Profile</h2>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          type="button"
          aria-label="Close profile panel"
        >
          <span className="text-xl leading-none" aria-hidden="true">✕</span>
        </button>
      </div>

      {/* ================================================================ */}
      {/* Scrollable Profile Content                                        */}
      {/* ================================================================ */}
      <div className="flex-1 overflow-y-auto">
        {/* Avatar and Name Section */}
        <div className="flex flex-col items-center py-6 px-4">
          <UserAvatar
            username={profile.username}
            avatarColor={profile.avatar_color}
            size="lg"
            status={status?.status_emoji ? "online" : undefined}
          />
          <h3 className="mt-4 text-xl font-bold text-gray-900">
            {profile.display_name || profile.username}
          </h3>
          {profile.display_name && (
            <p className="text-sm text-gray-500">@{profile.username}</p>
          )}
          {profile.title && (
            <p className="text-sm text-gray-600 mt-1">{profile.title}</p>
          )}
        </div>

        {/* Status Section */}
        {(status?.status_emoji || status?.status_text) && (
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              {status.status_emoji && (
                <span className="text-lg" aria-hidden="true">
                  {status.status_emoji}
                </span>
              )}
              {status.status_text && (
                <span className="text-sm text-gray-700">
                  {status.status_text}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="px-4 pb-4 flex gap-2">
          <button
            type="button"
            className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            💬 Message
          </button>
          <button
            type="button"
            className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            📞 Call
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* Contact Information Section */}
        <div className="px-4 py-4">
          <h4 className="text-sm font-bold text-gray-900 mb-3">
            Contact Information
          </h4>
          <div className="space-y-3">
            {profile.email && (
              <div>
                <p className="text-xs text-gray-500">Email Address</p>
                <a
                  href={`mailto:${profile.email}`}
                  className="text-sm text-[#1164A3] hover:underline"
                >
                  {profile.email}
                </a>
              </div>
            )}
            {profile.phone && (
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <a
                  href={`tel:${profile.phone}`}
                  className="text-sm text-[#1164A3] hover:underline"
                >
                  {profile.phone}
                </a>
              </div>
            )}
            {profile.timezone && (
              <div>
                <p className="text-xs text-gray-500">Local Time</p>
                <p className="text-sm text-gray-700">{profile.timezone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* Member Since */}
        {profile.created_at && (
          <div className="px-4 py-4">
            <p className="text-xs text-gray-500">Member since</p>
            <p className="text-sm text-gray-700">
              {new Date(profile.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}

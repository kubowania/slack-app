"use client";

/**
 * Sidebar — Primary Navigation Sidebar Component
 *
 * Extracted and enhanced from the monolithic page.tsx (lines 120-180) into a
 * reusable component. Renders the workspace header, user switcher dropdown,
 * navigation items (Home, DMs, Activity, More), channel list with creation
 * form, and direct messages list — matching the Slack web sidebar.
 *
 * Color palette (preserved exactly from page.tsx):
 *   #3F0E40  — sidebar background
 *   #522653  — hover / input background / border
 *   #1164A3  — active item highlight
 *   #E01E5A  — unread badge
 *   text-gray-300 — inactive text
 */

import { useState } from "react";
import Link from "next/link";
import type { User, Channel, DirectMessage, Workspace } from "@/lib/types";
import UserAvatar from "@/app/components/UserAvatar";

/* -------------------------------------------------------------------------- */
/*  Props Interface                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Props accepted by the Sidebar component.
 *
 * The interface is designed for maximum reusability across all workspace page
 * routes. Optional props (dms, workspace, activeChannelId, activeDmId,
 * activeSection, onChannelCreate) allow progressive enhancement — the sidebar
 * renders a minimal viable state when only users, channels, currentUser, and
 * onUserChange are provided.
 */
export interface SidebarProps {
  /** All workspace users for the user-switcher dropdown */
  users: User[];
  /** Channels to display in the Channels section */
  channels: Channel[];
  /** Optional DM conversations to display in the Direct Messages section */
  dms?: DirectMessage[];
  /** Currently selected user (null before initial load) */
  currentUser: User | null;
  /** ID of the currently active channel for highlight styling */
  activeChannelId?: number;
  /** ID of the currently active DM conversation for highlight styling */
  activeDmId?: number;
  /** Currently active navigation section ("home" | "dms" | "activity" | "more") */
  activeSection?: string;
  /** Callback invoked when the user switches identity via the dropdown */
  onUserChange: (user: User) => void;
  /** Optional callback invoked when the user creates a new channel */
  onChannelCreate?: (name: string) => void;
  /** Optional workspace metadata for the header title */
  workspace?: Workspace;
}

/* -------------------------------------------------------------------------- */
/*  Navigation Configuration                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Static definition of top-level navigation items.
 * Each item maps to a route, a display label, an icon, and a section key
 * for active-state comparison.
 */
interface NavItem {
  label: string;
  icon: string;
  href: string;
  section: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Home", icon: "🏠", href: "/", section: "home" },
  { label: "DMs", icon: "💬", href: "/dm", section: "dms" },
  { label: "Activity", icon: "🔔", href: "/activity", section: "activity" },
  { label: "More", icon: "⋯", href: "/channels/browse", section: "more" },
];

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function Sidebar({
  users,
  channels,
  dms,
  currentUser,
  activeChannelId,
  activeDmId,
  activeSection,
  onUserChange,
  onChannelCreate,
  workspace,
}: SidebarProps) {
  /* ---- Local state ---- */
  const [showNewChannel, setShowNewChannel] = useState<boolean>(false);
  const [newChannelName, setNewChannelName] = useState<string>("");
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    channels: true,
    dms: true,
  });

  /* ---- Handlers ---- */

  /**
   * Handle channel creation form submission.
   * Validates the input, delegates to the parent via onChannelCreate,
   * then resets the form state.
   */
  const handleCreateChannel = (e: React.FormEvent): void => {
    e.preventDefault();
    const trimmedName = newChannelName.trim();
    if (!trimmedName) return;
    onChannelCreate?.(trimmedName);
    setNewChannelName("");
    setShowNewChannel(false);
  };

  /**
   * Handle user-switcher dropdown changes.
   * Finds the selected user by ID and delegates to onUserChange.
   */
  const handleUserChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    const user = users.find((u) => u.id === Number(e.target.value));
    if (user) {
      onUserChange(user);
    }
  };

  /**
   * Toggle the expanded/collapsed state of a sidebar section.
   */
  const toggleSection = (section: string): void => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  /* ---- DM helpers ---- */

  /**
   * Compute the display name for a DM conversation.
   * Shows other participants' names (excluding the current user).
   * Falls back gracefully when members data is incomplete.
   */
  const getDmDisplayName = (dm: DirectMessage): string => {
    if (!dm.members || dm.members.length === 0) {
      return "Unknown";
    }
    const otherMembers = dm.members.filter(
      (m) => m.id !== currentUser?.id
    );
    if (otherMembers.length === 0) {
      /* Self-conversation edge case: show own name */
      const self = dm.members[0];
      return self?.display_name || self?.username || "Unknown";
    }
    return otherMembers
      .map((m) => m.display_name || m.username)
      .join(", ");
  };

  /**
   * Get the primary member for avatar display in a DM row.
   * Picks the first non-current-user participant.
   */
  const getDmAvatarMember = (dm: DirectMessage): User | null => {
    if (!dm.members || dm.members.length === 0) {
      return null;
    }
    const otherMembers = dm.members.filter(
      (m) => m.id !== currentUser?.id
    );
    return otherMembers.length > 0 ? otherMembers[0] : dm.members[0] ?? null;
  };

  /* ---- Render ---- */

  return (
    <aside className="w-64 bg-[#3F0E40] text-white flex flex-col">
      {/* ================================================================ */}
      {/* Workspace Header — workspace name + user switcher                */}
      {/* ================================================================ */}
      <div className="p-4 border-b border-[#522653]">
        <h1 className="text-lg font-bold">
          {workspace?.name || "Slack Clone"}
        </h1>
        {/* User switcher dropdown — exact styling from page.tsx */}
        <select
          className="mt-2 w-full bg-[#522653] text-white text-sm rounded px-2 py-1 border-none outline-none"
          value={currentUser?.id ?? ""}
          onChange={handleUserChange}
          aria-label="Switch user"
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.username}
            </option>
          ))}
        </select>
      </div>

      {/* ================================================================ */}
      {/* Navigation Items — Home, DMs, Activity, More                     */}
      {/* ================================================================ */}
      <nav className="px-3 py-2" aria-label="Primary navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.section;
          return (
            <Link
              key={item.section}
              href={item.href}
              className={`flex items-center gap-2 w-full text-left px-2 py-1.5 rounded text-sm ${
                isActive
                  ? "bg-[#1164A3] text-white"
                  : "text-gray-300 hover:bg-[#522653]"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* ================================================================ */}
      {/* Scrollable Sections — Channels + Direct Messages                 */}
      {/* ================================================================ */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* -------------------------------------------------------------- */}
        {/* Channels Section                                                */}
        {/* -------------------------------------------------------------- */}
        <div className="mb-4">
          {/* Section header — exact layout from page.tsx */}
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => toggleSection("channels")}
              className="text-xs font-semibold uppercase text-gray-300 hover:text-white"
              type="button"
              aria-expanded={expandedSections.channels}
              aria-controls="sidebar-channels-list"
            >
              Channels
            </button>
            <button
              onClick={() => setShowNewChannel(!showNewChannel)}
              className="text-gray-300 hover:text-white text-lg leading-none"
              type="button"
              aria-label="Create new channel"
            >
              +
            </button>
          </div>

          {/* Channel list + creation form (collapsible) */}
          {expandedSections.channels && (
            <div id="sidebar-channels-list" role="list">
              {/* New channel creation form */}
              {showNewChannel && (
                <form onSubmit={handleCreateChannel} className="mb-2">
                  <input
                    type="text"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="channel-name"
                    className="w-full bg-[#522653] text-white text-sm rounded px-2 py-1 placeholder-gray-400 outline-none"
                    autoFocus
                    aria-label="New channel name"
                  />
                </form>
              )}

              {/* Channel items */}
              {channels.map((ch) => {
                const isActive = activeChannelId === ch.id;
                const hasUnread =
                  ch.unread_count !== undefined && ch.unread_count > 0;
                return (
                  <Link
                    key={ch.id}
                    href={`/channel/${ch.id}`}
                    role="listitem"
                    className={`flex items-center w-full text-left px-2 py-1 rounded text-sm mb-0.5 ${
                      isActive
                        ? "bg-[#1164A3] text-white"
                        : "text-gray-300 hover:bg-[#522653]"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className={hasUnread ? "font-bold" : ""}>
                      # {ch.name}
                    </span>
                    {hasUnread && (
                      <span
                        className="bg-[#E01E5A] text-white text-xs rounded-full px-1.5 ml-auto"
                        aria-label={`${ch.unread_count} unread messages`}
                      >
                        {ch.unread_count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* -------------------------------------------------------------- */}
        {/* Direct Messages Section (renders only when dms prop provided)   */}
        {/* -------------------------------------------------------------- */}
        {dms && (
          <div>
            {/* Section header — mirrors Channels section styling */}
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => toggleSection("dms")}
                className="text-xs font-semibold uppercase text-gray-300 hover:text-white"
                type="button"
                aria-expanded={expandedSections.dms}
                aria-controls="sidebar-dm-list"
              >
                Direct Messages
              </button>
              <button
                className="text-gray-300 hover:text-white text-lg leading-none"
                type="button"
                aria-label="Start new direct message"
                aria-disabled="true"
                title="DM creation coming soon"
              >
                +
              </button>
            </div>

            {/* DM conversation items (collapsible) */}
            {expandedSections.dms && (
              <div id="sidebar-dm-list" role="list">
                {dms.map((dm) => {
                  const isActive = activeDmId === dm.id;
                  const avatarMember = getDmAvatarMember(dm);
                  const displayName = getDmDisplayName(dm);
                  const hasUnread =
                    dm.unread_count !== undefined && dm.unread_count > 0;

                  return (
                    <Link
                      key={dm.id}
                      href={`/dm/${dm.id}`}
                      role="listitem"
                      className={`flex items-center gap-2 px-2 py-1 rounded text-sm mb-0.5 ${
                        isActive
                          ? "bg-[#1164A3] text-white"
                          : "text-gray-300 hover:bg-[#522653]"
                      }`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {avatarMember && (
                        <UserAvatar
                          username={
                            avatarMember.display_name ||
                            avatarMember.username
                          }
                          avatarColor={avatarMember.avatar_color}
                          size="sm"
                        />
                      )}
                      <span
                        className={`truncate ${hasUnread ? "font-bold" : ""}`}
                      >
                        {displayName}
                      </span>
                      {hasUnread && (
                        <span
                          className="bg-[#E01E5A] text-white text-xs rounded-full px-1.5 ml-auto shrink-0"
                          aria-label={`${dm.unread_count} unread messages`}
                        >
                          {dm.unread_count}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

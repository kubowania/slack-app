"use client";

/**
 * src/app/(workspace)/layout.tsx — Workspace Route Group Shared Layout
 *
 * Wraps ALL workspace page routes. Renders the persistent Sidebar navigation
 * on the left and the main content area (flex-1) on the right. The (workspace)
 * parenthesized folder name is a Next.js route group — no URL segment is added.
 *
 * Responsibilities:
 *   - Manages shared state for users, channels, currentUser, DMs, and workspace
 *   - Fetches initial data from /api/users, /api/channels, /api/workspace, /api/dms
 *   - Provides channel creation handler to the Sidebar
 *   - Renders two-column flex layout: Sidebar (w-64 handled internally) + main (flex-1)
 *
 * Layout structure:
 *   ┌──────────┬───────────────────────────┐
 *   │          │                           │
 *   │ Sidebar  │   {children} (page)       │
 *   │ (w-64)   │   (flex-1)               │
 *   │          │                           │
 *   └──────────┴───────────────────────────┘
 *
 * State management is extracted from the original monolithic page.tsx
 * (lines 28-35 for state, 39-52 for fetching, 91-108 for channel creation).
 * No polling happens here — message polling belongs to individual page routes.
 */

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/app/components/Sidebar";
import type { User, Channel, DirectMessage, Workspace } from "@/lib/types";

/**
 * WorkspaceLayout — Default export for the (workspace) route group layout.
 *
 * Receives children from Next.js App Router and renders them inside the main
 * content area alongside the persistent Sidebar component.
 */
export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* ======================================================================== */
  /* State Management (extracted from page.tsx lines 28-35)                    */
  /* ======================================================================== */

  /** All workspace users for the user-switcher dropdown in the Sidebar */
  const [users, setUsers] = useState<User[]>([]);

  /** All channels displayed in the Sidebar channels section */
  const [channels, setChannels] = useState<Channel[]>([]);

  /** Currently selected user — null before initial load completes */
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  /** DM conversations list for the Sidebar direct messages section */
  const [dms, setDms] = useState<DirectMessage[]>([]);

  /** Workspace metadata displayed in the Sidebar header */
  const [workspace, setWorkspace] = useState<Workspace | null>(null);

  /* ======================================================================== */
  /* Data Fetching (extracted from page.tsx lines 39-52, extended)             */
  /* ======================================================================== */

  /**
   * Fetch all initial data on component mount.
   *
   * Users and channels are essential — they drive the sidebar content and user
   * switcher. Workspace and DMs have graceful fallbacks since those endpoints
   * may not exist during incremental development.
   */
  useEffect(() => {
    /* Fetch all users and set the first as the current user */
    fetch("/api/users")
      .then((res) => {
        if (!res.ok) throw new Error("Users fetch failed");
        return res.json();
      })
      .then((data: User[]) => {
        setUsers(data);
        if (data.length > 0) {
          setCurrentUser(data[0]);
        }
      })
      .catch(() => {
        /* Graceful degradation — sidebar shows empty user list */
      });

    /* Fetch all channels */
    fetch("/api/channels")
      .then((res) => {
        if (!res.ok) throw new Error("Channels fetch failed");
        return res.json();
      })
      .then((data: Channel[]) => {
        setChannels(data);
      })
      .catch(() => {
        /* Graceful degradation — sidebar shows empty channel list */
      });

    /* Fetch workspace metadata (fallback if endpoint not available) */
    fetch("/api/workspace")
      .then((res) => {
        if (!res.ok) throw new Error("Workspace fetch failed");
        return res.json();
      })
      .then((data: Workspace) => {
        setWorkspace(data);
      })
      .catch(() => {
        setWorkspace({
          id: 1,
          name: "Slack Clone",
          member_count: 0,
          plan: "free",
          created_at: "",
        });
      });

    /* Fetch DM conversations (fallback if endpoint not available) */
    fetch("/api/dms")
      .then((res) => {
        if (!res.ok) throw new Error("DMs fetch failed");
        return res.json();
      })
      .then((data: DirectMessage[]) => {
        setDms(data);
      })
      .catch(() => {
        setDms([]);
      });
  }, []);

  /* ======================================================================== */
  /* Channel Creation Handler (extracted from page.tsx lines 91-108)           */
  /* ======================================================================== */

  /**
   * Handles new channel creation. Posts to /api/channels with the given name
   * and the current user as the creator. On success, appends the new channel
   * to the channels state so the Sidebar updates immediately.
   *
   * Memoized with useCallback to prevent unnecessary re-renders when passed
   * as a prop to the Sidebar component.
   */
  const handleCreateChannel = useCallback(
    async (name: string) => {
      if (!name.trim() || !currentUser) return;

      try {
        const res = await fetch("/api/channels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            created_by: currentUser.id,
          }),
        });

        if (!res.ok) return;

        const channel: Channel = await res.json();
        setChannels((prev) => [...prev, channel]);
      } catch {
        /* Silent failure — channel creation failed, sidebar unchanged */
      }
    },
    [currentUser]
  );

  /* ======================================================================== */
  /* Render — Two-column flex layout                                           */
  /* ======================================================================== */

  return (
    <div className="flex h-full">
      {/* Persistent Sidebar Navigation — handles its own w-64 width and
          Slack purple (#3F0E40) background styling internally */}
      <Sidebar
        users={users}
        channels={channels}
        dms={dms}
        currentUser={currentUser}
        onUserChange={setCurrentUser}
        onChannelCreate={handleCreateChannel}
        workspace={workspace ?? undefined}
      />

      {/* Main Content Area — page routes render here.
          Matches page.tsx line 183: flex-1 flex flex-col bg-white.
          overflow-hidden prevents content from spilling outside the viewport
          (root layout body is h-screen overflow-hidden). */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden">
        {children}
      </main>
    </div>
  );
}

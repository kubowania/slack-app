"use client";

/**
 * src/app/(workspace)/layout.tsx — Workspace Route Group Shared Layout
 *
 * Wraps ALL workspace page routes. Renders the persistent Sidebar navigation
 * on the left and the main content area (flex-1) on the right. The (workspace)
 * parenthesized folder name is a Next.js route group — no URL segment is added.
 *
 * Responsibilities:
 *   - Consumes shared state (users, channels, currentUser, workspace) from
 *     WorkspaceProvider via the useWorkspace() hook — eliminating redundant
 *     fetches and ensuring Sidebar user-switching propagates to all pages
 *   - Fetches DM conversations from /api/dms (not in shared context)
 *   - Derives active navigation state from the current URL via usePathname()
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
 * State management uses the centralized WorkspaceProvider from providers.tsx
 * for all shared workspace data (users, channels, workspace, currentUser).
 * DM conversations are fetched locally since they are only needed by the sidebar.
 */

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";
import { useWorkspace } from "@/app/providers";
import type { DirectMessage } from "@/lib/types";

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
  /* Shared State from WorkspaceProvider                                       */
  /* Consumes the centralized context instead of managing independent          */
  /* state/fetches — ensures Sidebar user-switching propagates everywhere.     */
  /* ======================================================================== */

  const {
    currentUser,
    setCurrentUser,
    users,
    channels,
    setChannels,
    workspace,
  } = useWorkspace();

  /* ======================================================================== */
  /* Local State — DM conversations (not in shared context)                    */
  /* ======================================================================== */

  /** DM conversations list for the Sidebar direct messages section */
  const [dms, setDms] = useState<DirectMessage[]>([]);

  /* ======================================================================== */
  /* Active State Derivation from URL                                          */
  /* Uses usePathname() to determine which sidebar item is currently active,   */
  /* enabling proper visual highlighting in the Sidebar component.             */
  /* ======================================================================== */

  const pathname = usePathname();

  /** Parse the current URL to derive active channel, DM, and section state */
  let activeChannelId: number | undefined;
  let activeDmId: number | undefined;
  let activeSection: string | undefined;

  if (pathname) {
    const channelMatch = pathname.match(/^\/channel\/(\d+)/);
    const dmMatch = pathname.match(/^\/dm\/(\d+)/);

    if (channelMatch) {
      activeChannelId = Number(channelMatch[1]);
      activeSection = "home";
    } else if (dmMatch) {
      activeDmId = Number(dmMatch[1]);
      activeSection = "dms";
    } else if (pathname.startsWith("/dm")) {
      activeSection = "dms";
    } else if (pathname.startsWith("/activity")) {
      activeSection = "activity";
    } else if (
      pathname.startsWith("/channels/browse") ||
      pathname.startsWith("/files") ||
      pathname.startsWith("/people") ||
      pathname.startsWith("/saved") ||
      pathname.startsWith("/canvas") ||
      pathname.startsWith("/preferences")
    ) {
      activeSection = "more";
    } else if (pathname === "/" || pathname.startsWith("/channel")) {
      activeSection = "home";
    } else if (pathname.startsWith("/search")) {
      activeSection = "home";
    }
  }

  /* ======================================================================== */
  /* DM Data Fetching (only data not in shared context)                        */
  /* ======================================================================== */

  /**
   * Fetch DM conversations on mount. Uses graceful degradation — if the
   * endpoint is unavailable, the DM section simply shows an empty list.
   */
  useEffect(() => {
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
   * to the shared channels state via the context's setChannels so the Sidebar
   * updates immediately.
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

        const channel = await res.json();
        setChannels((prev) => [...prev, channel]);
      } catch {
        /* Silent failure — channel creation failed, sidebar unchanged */
      }
    },
    [currentUser, setChannels]
  );

  /* ======================================================================== */
  /* Render — Two-column flex layout                                           */
  /* ======================================================================== */

  return (
    <div className="flex h-full">
      {/* Persistent Sidebar Navigation — handles its own w-64 width and
          Slack purple (#3F0E40) background styling internally.
          Active state props derived from usePathname() enable visual
          highlighting of the current channel, DM, and nav section. */}
      <Sidebar
        users={users}
        channels={channels}
        dms={dms}
        currentUser={currentUser}
        activeChannelId={activeChannelId}
        activeDmId={activeDmId}
        activeSection={activeSection}
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

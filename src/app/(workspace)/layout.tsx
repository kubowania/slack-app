"use client";

/**
 * Workspace Layout
 *
 * Shared layout for all workspace routes under the (workspace) route group.
 * Provides the persistent sidebar navigation alongside the main content area.
 *
 * Responsibilities:
 * - Consumes WorkspaceProvider context (users, channels, currentUser, workspace)
 * - Fetches DM conversations independently (not in provider)
 * - Derives active navigation state from the current URL pathname
 * - Provides channel creation handler with optimistic list refresh
 * - Renders two-column flex layout: Sidebar (fixed 256px) + main (flex-1)
 *
 * Layout structure:
 *   ┌──────────┬───────────────────────────┐
 *   │          │                           │
 *   │ Sidebar  │   {children} (page)       │
 *   │ (w-64)   │   (flex-1)               │
 *   │          │                           │
 *   └──────────┴───────────────────────────┘
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";
import StatusSelector from "@/app/components/StatusSelector";
import HuddleOverlay from "@/app/components/HuddleOverlay";
import { useWorkspace } from "@/app/providers";
import type { Channel, DirectMessage } from "@/lib/types";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* ---------------------------------------------------------------------- */
  /* Context & State                                                         */
  /* ---------------------------------------------------------------------- */

  const {
    currentUser,
    setCurrentUser,
    users,
    channels: providerChannels,
    workspace,
  } = useWorkspace();

  const pathname = usePathname();

  /**
   * Local channels state — initially null so we fall through to the provider's
   * channels. After a channel is created the local state is populated with a
   * fresh fetch so the sidebar immediately reflects the new channel.
   */
  const [localChannels, setLocalChannels] = useState<Channel[] | null>(null);

  /**
   * DM conversations — fetched independently since WorkspaceProvider does not
   * include DMs in its context.
   */
  const [dms, setDms] = useState<DirectMessage[]>([]);

  /** Effective channels list: local override or provider data */
  const channels = localChannels ?? providerChannels;

  /** Status selector visibility toggle */
  const [showStatusSelector, setShowStatusSelector] = useState(false);

  /** Huddle overlay visibility toggle */
  const [showHuddle, setShowHuddle] = useState(false);

  /* ---------------------------------------------------------------------- */
  /* Data Fetching                                                           */
  /* ---------------------------------------------------------------------- */

  /** Fetch DM conversations on mount */
  useEffect(() => {
    fetch("/api/dms")
      .then((res) => {
        if (!res.ok) throw new Error("DM fetch failed");
        return res.json();
      })
      .then((data: DirectMessage[]) => setDms(data))
      .catch(() => {
        /* Graceful degradation — sidebar shows no DMs */
      });
  }, []);

  /* ---------------------------------------------------------------------- */
  /* URL-derived Active State                                                */
  /* ---------------------------------------------------------------------- */

  /**
   * Derive which channel, DM, or section is active from the pathname.
   *
   * Pathname patterns:
   *   /channel/3        → activeChannelId = 3
   *   /dm/2             → activeDmId = 2
   *   /activity         → activeSection = "activity"
   *   /search           → activeSection = "search"
   *   /files            → activeSection = "files"
   *   /saved            → activeSection = "saved"
   *   /people           → activeSection = "people"
   *   /canvas           → activeSection = "canvas"
   *   /channels/browse  → activeSection = "channels/browse"
   *   /preferences      → activeSection = "preferences"
   *   /thread/5         → activeSection = "thread"
   */
  const { activeChannelId, activeDmId, activeSection } = useMemo(() => {
    let channelId: number | undefined;
    let dmId: number | undefined;
    let section: string | undefined;

    // Match /channel/{id}
    const channelMatch = pathname.match(/\/channel\/(\d+)/);
    if (channelMatch) {
      channelId = parseInt(channelMatch[1], 10);
    }

    // Match /dm/{id}
    const dmMatch = pathname.match(/\/dm\/(\d+)/);
    if (dmMatch) {
      dmId = parseInt(dmMatch[1], 10);
    }

    // Match section paths
    if (pathname.startsWith("/activity")) section = "activity";
    else if (pathname.startsWith("/search")) section = "search";
    else if (pathname.startsWith("/files")) section = "files";
    else if (pathname.startsWith("/saved")) section = "saved";
    else if (pathname.startsWith("/people")) section = "people";
    else if (pathname.startsWith("/canvas")) section = "canvas";
    else if (pathname.startsWith("/channels/browse"))
      section = "channels/browse";
    else if (pathname.startsWith("/preferences")) section = "preferences";
    else if (pathname.startsWith("/thread")) section = "thread";
    else if (pathname.startsWith("/dm")) section = "dms";
    else if (pathname.startsWith("/channel") || pathname === "/")
      section = "home";

    return {
      activeChannelId: channelId,
      activeDmId: dmId,
      activeSection: section,
    };
  }, [pathname]);

  /* ---------------------------------------------------------------------- */
  /* Handlers                                                                */
  /* ---------------------------------------------------------------------- */

  /**
   * Channel creation handler. Posts to /api/channels with the given name, then
   * re-fetches the full channel list so the sidebar updates immediately.
   */
  const handleChannelCreate = useCallback(
    async (name: string) => {
      if (!currentUser) return;
      try {
        const createRes = await fetch("/api/channels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, created_by: currentUser.id }),
        });
        if (!createRes.ok) return;

        // Re-fetch full channel list to ensure consistency
        const listRes = await fetch("/api/channels");
        if (listRes.ok) {
          const data: Channel[] = await listRes.json();
          setLocalChannels(data);
        }
      } catch {
        /* Silent — channel creation failed */
      }
    },
    [currentUser]
  );

  /* ---------------------------------------------------------------------- */
  /* Render                                                                  */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="flex h-full">
      {/* Persistent Sidebar Navigation */}
      <Sidebar
        users={users}
        channels={channels}
        dms={dms}
        currentUser={currentUser}
        activeChannelId={activeChannelId}
        activeDmId={activeDmId}
        activeSection={activeSection}
        onUserChange={setCurrentUser}
        onChannelCreate={handleChannelCreate}
        workspace={workspace ?? undefined}
      />

      {/* Main Content Area — page routes render here */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden">
        {children}
      </main>

      {/* Status Selector Overlay (toggle via sidebar interaction) */}
      {showStatusSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowStatusSelector(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setShowStatusSelector(false);
            }}
            role="button"
            tabIndex={0}
            aria-label="Close status selector"
          />
          <div className="relative z-10">
            <StatusSelector
              onStatusChange={() => setShowStatusSelector(false)}
            />
          </div>
        </div>
      )}

      {/* Huddle / Call Overlay (visual mockup only) */}
      <HuddleOverlay
        isOpen={showHuddle}
        onClose={() => setShowHuddle(false)}
      />
    </div>
  );
}

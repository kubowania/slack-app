import type { Metadata } from "next";

import ChannelBrowser from "@/app/components/ChannelBrowser";

/**
 * Page metadata for the Browse Channels route.
 *
 * Sets the browser tab title to "Browse Channels - Slack Clone" for
 * clear identification when multiple tabs are open.
 */
export const metadata: Metadata = {
  title: "Browse Channels - Slack Clone",
};

/**
 * BrowseChannelsPage — Next.js App Router page for the `/channels/browse` URL.
 *
 * This is a thin server component wrapper that renders the client-side
 * ChannelBrowser component within the shared workspace layout. All UI
 * rendering, state management, and data fetching (GET /api/channels/browse)
 * are delegated entirely to the ChannelBrowser component.
 *
 * Route resolution:
 * - `(workspace)` is a route group — does NOT add a URL segment
 * - `channels/browse` maps to `/channels/browse`
 * - Inherits the workspace layout providing the persistent Sidebar + main area
 */
export default function BrowseChannelsPage() {
  return <ChannelBrowser />;
}

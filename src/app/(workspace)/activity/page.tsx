"use client";

/**
 * Activity / Mentions Feed Page
 *
 * Renders the ActivityFeed component which displays mentions, thread replies,
 * reactions, and app notifications for the current user. Passes the current
 * user's ID from the workspace context so the activity API endpoint can
 * scope results to the logged-in user.
 *
 * URL: /(workspace)/activity
 */

import ActivityFeed from "@/app/components/ActivityFeed";
import { useWorkspace } from "@/app/providers";

export default function ActivityPage() {
  const { currentUser } = useWorkspace();
  return <ActivityFeed currentUserId={currentUser?.id} />;
}

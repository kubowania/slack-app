/**
 * Activity / Mentions Feed Page
 *
 * Renders the ActivityFeed component which displays mentions, thread replies,
 * reactions, and app notifications for the current user.
 *
 * URL: /(workspace)/activity
 */

import ActivityFeed from "@/app/components/ActivityFeed";

export default function ActivityPage() {
  return <ActivityFeed />;
}

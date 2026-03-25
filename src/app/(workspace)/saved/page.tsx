"use client";

/**
 * Saved Items Page
 *
 * Renders the SavedItems component which displays messages and files
 * bookmarked by the current user. Passes the current user's ID from the
 * workspace context so the saved items API endpoint can scope results
 * to the correct user.
 *
 * URL: /(workspace)/saved
 */

import SavedItems from "@/app/components/SavedItems";
import { useWorkspace } from "@/app/providers";

export default function SavedPage() {
  const { currentUser } = useWorkspace();
  return <SavedItems currentUserId={currentUser?.id} />;
}

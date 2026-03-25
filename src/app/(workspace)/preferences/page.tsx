"use client";

import { useRouter } from "next/navigation";
import PreferencesModal from "@/app/components/PreferencesModal";
import { useWorkspace } from "@/app/providers";

/**
 * PreferencesPage — Dedicated page route for user preferences/settings.
 *
 * Renders the PreferencesModal component as a full-page settings view.
 * The modal is always open (isOpen={true}) since this IS the preferences page.
 * Closing the modal navigates the user back to the previously visited page
 * via router.back(). Passes the current user's ID from the workspace context
 * so the preferences API endpoint can fetch user-specific settings.
 *
 * Route: /preferences (the (workspace) route group adds no URL segment)
 */
export default function PreferencesPage() {
  const router = useRouter();
  const { currentUser } = useWorkspace();

  const handleClose = () => {
    router.back();
  };

  return (
    <PreferencesModal
      isOpen={true}
      onClose={handleClose}
      currentUserId={currentUser?.id}
    />
  );
}

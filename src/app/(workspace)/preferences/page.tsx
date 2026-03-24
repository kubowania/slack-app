"use client";

import { useRouter } from "next/navigation";
import PreferencesModal from "@/app/components/PreferencesModal";

/**
 * PreferencesPage — Dedicated page route for user preferences/settings.
 *
 * Renders the PreferencesModal component as a full-page settings view.
 * The modal is always open (isOpen={true}) since this IS the preferences page.
 * Closing the modal navigates the user back to the previously visited page
 * via router.back().
 *
 * Route: /preferences (the (workspace) route group adds no URL segment)
 */
export default function PreferencesPage() {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  return (
    <PreferencesModal
      isOpen={true}
      onClose={handleClose}
    />
  );
}

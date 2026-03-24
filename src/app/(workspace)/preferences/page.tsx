"use client";

/**
 * Preferences / Settings Page
 *
 * Renders the PreferencesModal component as a full-page settings view.
 * Uses useRouter for the close/back navigation.
 *
 * URL: /(workspace)/preferences
 */

import { useRouter } from "next/navigation";
import PreferencesModal from "@/app/components/PreferencesModal";

export default function PreferencesPage() {
  const router = useRouter();

  return (
    <PreferencesModal
      isOpen={true}
      onClose={() => router.back()}
    />
  );
}

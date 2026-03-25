"use client";

import { useState, useEffect } from "react";
import type { UserPreferences } from "@/lib/types";
import ModalDialog from "@/app/components/ModalDialog";

// =============================================================================
// Props Interface
// =============================================================================

/**
 * Props for the PreferencesModal component.
 *
 * The modal is controlled via `isOpen` / `onClose` and optionally scoped
 * to a specific user via `currentUserId`. When no `currentUserId` is provided,
 * the component fetches preferences without a user filter (API default).
 */
export interface PreferencesModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback invoked when the modal requests to be closed */
  onClose: () => void;
  /** Optional user ID to scope preferences to a specific user */
  currentUserId?: number;
}

// =============================================================================
// Section Navigation Types and Constants
// =============================================================================

/** Discriminated union of valid sidebar section identifiers */
type SectionId = "notifications" | "sidebar" | "themes" | "advanced";

/** Sidebar navigation item definition */
interface SectionNavItem {
  id: SectionId;
  label: string;
  icon: string;
}

/** Ordered list of sidebar navigation sections */
const SECTIONS: SectionNavItem[] = [
  { id: "notifications", label: "Notifications", icon: "🔔" },
  { id: "sidebar", label: "Sidebar", icon: "📋" },
  { id: "themes", label: "Themes", icon: "🎨" },
  { id: "advanced", label: "Advanced", icon: "⚙️" },
];

// =============================================================================
// Form State Types
// =============================================================================

/**
 * Local form state encompassing all user-editable preferences.
 *
 * Fields that map directly to UserPreferences are sent to the API on save.
 * Additional fields (notification_mobile, email_frequency, mute_all,
 * show_all_channels, collapsed_channels, collapsed_dms) are tracked locally
 * for UI completeness but are not persisted via the current API contract.
 */
interface FormState {
  /* Notifications section — API-backed */
  notification_desktop: boolean;
  notification_sound: boolean;
  /* Notifications section — local-only (UI completeness) */
  notification_mobile: boolean;
  email_frequency: string;
  mute_all: boolean;
  /* Sidebar section — API-backed */
  sidebar_sort: string;
  /* Sidebar section — local-only (UI completeness) */
  show_all_channels: boolean;
  collapsed_channels: boolean;
  collapsed_dms: boolean;
  /* Themes section — API-backed */
  theme: string;
  /* Advanced section — API-backed */
  language: string;
  timezone: string;
}

/** Default values used when no preferences have been loaded from the API */
const DEFAULT_FORM_STATE: FormState = {
  notification_desktop: true,
  notification_sound: true,
  notification_mobile: true,
  email_frequency: "instant",
  mute_all: false,
  sidebar_sort: "alpha",
  show_all_channels: true,
  collapsed_channels: false,
  collapsed_dms: false,
  theme: "light",
  language: "en",
  timezone: "UTC",
};

// =============================================================================
// Theme Configuration
// =============================================================================

/** Theme option definition for the theme selector cards */
interface ThemeOption {
  id: string;
  label: string;
  description: string;
  sidebarColor: string;
  contentColor: string;
  textColor: string;
}

/** Available theme options with preview colors */
const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "light",
    label: "Light",
    description: "Default light theme",
    sidebarColor: "#3F0E40",
    contentColor: "#FFFFFF",
    textColor: "#1D1C1D",
  },
  {
    id: "dark",
    label: "Dark",
    description: "Dark mode for reduced eye strain",
    sidebarColor: "#1A1D21",
    contentColor: "#222529",
    textColor: "#D1D2D3",
  },
  {
    id: "system",
    label: "System",
    description: "Match your system appearance",
    sidebarColor: "#3F0E40",
    contentColor: "#F8F8F8",
    textColor: "#1D1C1D",
  },
];

/** Available timezone options */
const TIMEZONE_OPTIONS: string[] = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
  "Pacific/Auckland",
];

/** Available language options */
const LANGUAGE_OPTIONS: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "中文" },
  { code: "pt", label: "Português" },
  { code: "ko", label: "한국어" },
];

// =============================================================================
// Component Implementation
// =============================================================================

/**
 * PreferencesModal — Settings/preferences modal with tabbed sidebar navigation.
 *
 * Presents a two-column layout inside a ModalDialog shell:
 * - Left: sidebar with section tabs (Notifications, Sidebar, Themes, Advanced)
 * - Right: form content for the active section
 * - Footer: Cancel and Save Changes buttons
 *
 * Data lifecycle:
 * 1. On open (isOpen → true): fetches preferences from GET /api/preferences
 * 2. User edits form controls → local formState updated, hasChanges → true
 * 3. Save → PUT /api/preferences with current formState, resets hasChanges
 * 4. Cancel → reverts formState to last-saved preferences and closes modal
 */
export default function PreferencesModal({
  isOpen,
  onClose,
  currentUserId,
}: PreferencesModalProps) {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  /** Preferences data from the API (null until first successful fetch) */
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  /** Currently active sidebar section */
  const [activeSection, setActiveSection] = useState<SectionId>("notifications");

  /** Whether the initial fetch is in progress */
  const [loading, setLoading] = useState(false);

  /** Whether a save operation is in progress */
  const [saving, setSaving] = useState(false);

  /** Local form state for all editable fields */
  const [formState, setFormState] = useState<FormState>(DEFAULT_FORM_STATE);

  /** Tracks whether the user has unsaved changes */
  const [hasChanges, setHasChanges] = useState(false);

  // ---------------------------------------------------------------------------
  // Data Fetching — Load preferences when modal opens
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    /* Skip fetching until currentUserId is available to prevent 400 responses */
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const url = `/api/preferences?user_id=${currentUserId}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: UserPreferences) => {
        if (cancelled) return;
        setPreferences(data);
        setFormState({
          notification_desktop: data.notification_desktop,
          notification_sound: data.notification_sound,
          notification_mobile: true,
          email_frequency: "instant",
          mute_all: false,
          sidebar_sort: data.sidebar_sort,
          show_all_channels: true,
          collapsed_channels: false,
          collapsed_dms: false,
          theme: data.theme,
          language: data.language,
          timezone: data.timezone,
        });
        setHasChanges(false);
      })
      .catch(() => {
        if (cancelled) return;
        setPreferences(null);
        setFormState(DEFAULT_FORM_STATE);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, currentUserId]);

  // ---------------------------------------------------------------------------
  // Form Helpers
  // ---------------------------------------------------------------------------

  /** Updates a single form field and marks the form as dirty */
  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  /** Saves current form state to the API via PUT /api/preferences */
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Omit<UserPreferences, "updated_at"> = {
        user_id: currentUserId ?? preferences?.user_id ?? 0,
        notification_sound: formState.notification_sound,
        notification_desktop: formState.notification_desktop,
        sidebar_sort: formState.sidebar_sort,
        theme: formState.theme,
        language: formState.language,
        timezone: formState.timezone,
      };

      const res = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const saved: UserPreferences = await res.json();
        setPreferences(saved);
        setHasChanges(false);
      }
    } catch {
      /* Save failed — form remains dirty so user can retry */
    } finally {
      setSaving(false);
    }
  };

  /** Reverts form to last-saved state and closes the modal */
  const handleCancel = () => {
    if (preferences) {
      setFormState({
        notification_desktop: preferences.notification_desktop,
        notification_sound: preferences.notification_sound,
        notification_mobile: true,
        email_frequency: "instant",
        mute_all: false,
        sidebar_sort: preferences.sidebar_sort,
        show_all_channels: true,
        collapsed_channels: false,
        collapsed_dms: false,
        theme: preferences.theme,
        language: preferences.language,
        timezone: preferences.timezone,
      });
    } else {
      setFormState(DEFAULT_FORM_STATE);
    }
    setHasChanges(false);
    onClose();
  };

  // ---------------------------------------------------------------------------
  // Section Renderers
  // ---------------------------------------------------------------------------

  /** Renders a single settings row with label, optional description, and control */
  const renderSettingRow = (
    label: string,
    description: string,
    control: React.ReactNode
  ) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100">
      <div className="flex-1 min-w-0 pe-4">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );

  /** Reusable toggle switch component */
  const renderToggle = (
    checked: boolean,
    onChange: (val: boolean) => void,
    ariaLabel: string
  ) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
        checked ? "bg-[#007A5A]" : "bg-gray-300"
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );

  /** Notifications section form controls */
  const renderNotificationsSection = () => (
    <div>
      <h3 className="text-base font-bold text-gray-900 mb-4">
        Notification Preferences
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        Choose how and when you want to be notified about activity in your
        workspace.
      </p>

      {renderSettingRow(
        "Desktop notifications",
        "Show notifications on your desktop when you receive new messages",
        renderToggle(
          formState.notification_desktop,
          (val) => updateField("notification_desktop", val),
          "Desktop notifications"
        )
      )}

      {renderSettingRow(
        "Mobile notifications",
        "Push notifications to your mobile device",
        renderToggle(
          formState.notification_mobile,
          (val) => updateField("notification_mobile", val),
          "Mobile notifications"
        )
      )}

      {renderSettingRow(
        "Notification sound",
        "Play a sound when you receive notifications",
        renderToggle(
          formState.notification_sound,
          (val) => updateField("notification_sound", val),
          "Notification sound"
        )
      )}

      {renderSettingRow(
        "Email frequency",
        "How often to receive email notifications for unread messages",
        <select
          value={formState.email_frequency}
          onChange={(e) => updateField("email_frequency", e.target.value)}
          aria-label="Email notification frequency"
          className="block w-36 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-[#1164A3] focus:ring-1 focus:ring-[#1164A3] focus:outline-none"
        >
          <option value="instant">Instant</option>
          <option value="daily">Daily digest</option>
          <option value="weekly">Weekly digest</option>
          <option value="never">Never</option>
        </select>
      )}

      {renderSettingRow(
        "Mute all notifications",
        "Temporarily silence all notifications from this workspace",
        renderToggle(
          formState.mute_all,
          (val) => updateField("mute_all", val),
          "Mute all notifications"
        )
      )}
    </div>
  );

  /** Sidebar section form controls */
  const renderSidebarSection = () => (
    <div>
      <h3 className="text-base font-bold text-gray-900 mb-4">
        Sidebar Settings
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        Customize how channels, direct messages, and sections appear in your
        sidebar.
      </p>

      {renderSettingRow(
        "Show all channels",
        "Display all channels in the sidebar, including ones you haven't joined",
        renderToggle(
          formState.show_all_channels,
          (val) => updateField("show_all_channels", val),
          "Show all channels"
        )
      )}

      {renderSettingRow(
        "Sort order",
        "Choose how channels and conversations are ordered in the sidebar",
        <select
          value={formState.sidebar_sort}
          onChange={(e) => updateField("sidebar_sort", e.target.value)}
          aria-label="Sidebar sort order"
          className="block w-36 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-[#1164A3] focus:ring-1 focus:ring-[#1164A3] focus:outline-none"
        >
          <option value="alpha">Alphabetical</option>
          <option value="recent">Most recent</option>
          <option value="priority">Priority</option>
        </select>
      )}

      <div className="mt-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          Collapsible Sections
        </h4>
        <p className="text-xs text-gray-500 mb-4">
          Choose which sidebar sections start collapsed by default.
        </p>

        <label className="flex items-center gap-3 py-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formState.collapsed_channels}
            onChange={(e) =>
              updateField("collapsed_channels", e.target.checked)
            }
            className="h-4 w-4 rounded border-gray-300 text-[#1164A3] focus:ring-[#1164A3]"
          />
          <span className="text-sm text-gray-700">
            Collapse Channels section
          </span>
        </label>

        <label className="flex items-center gap-3 py-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formState.collapsed_dms}
            onChange={(e) => updateField("collapsed_dms", e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-[#1164A3] focus:ring-[#1164A3]"
          />
          <span className="text-sm text-gray-700">
            Collapse Direct Messages section
          </span>
        </label>
      </div>
    </div>
  );

  /** Themes section with selectable theme cards */
  const renderThemesSection = () => (
    <div>
      <h3 className="text-base font-bold text-gray-900 mb-4">Themes</h3>
      <p className="text-sm text-gray-500 mb-6">
        Choose a color theme for your Slack workspace.
      </p>

      <div className="grid grid-cols-3 gap-4">
        {THEME_OPTIONS.map((option) => {
          const isActive = formState.theme === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => updateField("theme", option.id)}
              aria-label={`Select ${option.label} theme`}
              aria-pressed={isActive}
              className={`rounded-lg border-2 p-3 text-start transition-all ${
                isActive
                  ? "border-[#1164A3] ring-2 ring-[#1164A3] ring-offset-1"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* Theme preview thumbnail */}
              <div className="flex h-16 rounded-md overflow-hidden mb-3 border border-gray-100">
                <div
                  className="w-1/3"
                  style={{ backgroundColor: option.sidebarColor }}
                />
                <div
                  className="w-2/3 flex items-center justify-center"
                  style={{ backgroundColor: option.contentColor }}
                >
                  <div className="space-y-1 px-2 w-full">
                    <div
                      className="h-1.5 rounded-full w-3/4"
                      style={{
                        backgroundColor: option.textColor,
                        opacity: 0.4,
                      }}
                    />
                    <div
                      className="h-1.5 rounded-full w-1/2"
                      style={{
                        backgroundColor: option.textColor,
                        opacity: 0.25,
                      }}
                    />
                    <div
                      className="h-1.5 rounded-full w-2/3"
                      style={{
                        backgroundColor: option.textColor,
                        opacity: 0.15,
                      }}
                    />
                  </div>
                </div>
              </div>

              <p className="text-sm font-medium text-gray-900">
                {option.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {option.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );

  /** Advanced section form controls */
  const renderAdvancedSection = () => (
    <div>
      <h3 className="text-base font-bold text-gray-900 mb-4">
        Advanced Settings
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        Configure language, timezone, and other advanced preferences.
      </p>

      {renderSettingRow(
        "Language",
        "Choose the language for the Slack interface",
        <select
          value={formState.language}
          onChange={(e) => updateField("language", e.target.value)}
          aria-label="Interface language"
          className="block w-40 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-[#1164A3] focus:ring-1 focus:ring-[#1164A3] focus:outline-none"
        >
          {LANGUAGE_OPTIONS.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      )}

      {renderSettingRow(
        "Timezone",
        "Set your local timezone for accurate message timestamps",
        <select
          value={formState.timezone}
          onChange={(e) => updateField("timezone", e.target.value)}
          aria-label="Timezone"
          className="block w-52 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-[#1164A3] focus:ring-1 focus:ring-[#1164A3] focus:outline-none"
        >
          {TIMEZONE_OPTIONS.map((tz) => (
            <option key={tz} value={tz}>
              {tz.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      )}

      <div className="mt-8 pt-4 border-t border-gray-100">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">
          Accessibility
        </h4>
        <p className="text-xs text-gray-500 mb-3">
          Settings to improve your experience with assistive technologies.
        </p>
        <p className="text-xs text-gray-400 italic">
          Accessibility settings follow your operating system preferences.
        </p>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Footer — Save / Cancel buttons
  // ---------------------------------------------------------------------------

  const footer = (
    <div className="flex justify-end gap-3">
      <button
        type="button"
        onClick={handleCancel}
        className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleSave}
        disabled={!hasChanges || saving}
        className="px-4 py-2 text-sm text-white bg-[#007A5A] rounded hover:bg-[#006849] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? "Saving\u2026" : "Save Changes"}
      </button>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Preferences"
      size="xl"
      footer={footer}
    >
      <div className="flex min-h-[400px]">
        {/* Left sidebar navigation */}
        <nav
          className="w-48 shrink-0 border-r border-gray-200 py-2"
          aria-label="Preferences sections"
        >
          <div className="px-2 space-y-0.5">
            {SECTIONS.map((section) => {
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={`w-full text-left px-4 py-2 text-sm rounded-md flex items-center gap-2 transition-colors ${
                    isActive
                      ? "bg-[#1164A3] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span aria-hidden="true" className="text-base">
                    {section.icon}
                  </span>
                  {section.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Right content area */}
        <div className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full min-h-[200px]">
              <div className="text-center">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#1164A3] mb-3" />
                <p className="text-sm text-gray-500">
                  Loading preferences&hellip;
                </p>
              </div>
            </div>
          ) : (
            <>
              {activeSection === "notifications" &&
                renderNotificationsSection()}
              {activeSection === "sidebar" && renderSidebarSection()}
              {activeSection === "themes" && renderThemesSection()}
              {activeSection === "advanced" && renderAdvancedSection()}
            </>
          )}
        </div>
      </div>
    </ModalDialog>
  );
}

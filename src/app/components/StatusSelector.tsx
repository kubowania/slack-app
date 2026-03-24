"use client";

import { useState, useRef, useEffect } from "react";
import type { UserStatus } from "@/lib/types";
import EmojiPicker from "@/app/components/EmojiPicker";

// =============================================================================
// Props Interface
// =============================================================================

/**
 * Props for the StatusSelector dropdown component.
 *
 * Controls the current status display, status change callback, and the
 * user ID for constructing the UserStatus object on save.
 */
export interface StatusSelectorProps {
  /** The user's current status — when undefined, the trigger shows "Update your status" */
  currentStatus?: UserStatus;
  /** Callback invoked when the user saves a new status or clears the existing one */
  onStatusChange: (status: UserStatus | null) => void;
  /** ID of the user whose status is being managed (no auth — passed as prop) */
  userId?: number;
}

// =============================================================================
// Preset Statuses — common quick-set options matching Slack's default presets
// =============================================================================

interface PresetStatus {
  emoji: string;
  text: string;
  duration: string;
}

const PRESET_STATUSES: PresetStatus[] = [
  { emoji: "📅", text: "In a meeting", duration: "1hour" },
  { emoji: "🚌", text: "Commuting", duration: "30min" },
  { emoji: "🤒", text: "Out sick", duration: "today" },
  { emoji: "🌴", text: "Vacationing", duration: "custom" },
  { emoji: "🏠", text: "Working remotely", duration: "today" },
];

// =============================================================================
// Duration Options — selectable durations for automatic status clearing
// =============================================================================

interface DurationOption {
  value: string;
  label: string;
}

const DURATION_OPTIONS: DurationOption[] = [
  { value: "none", label: "Don't clear" },
  { value: "30min", label: "30 minutes" },
  { value: "1hour", label: "1 hour" },
  { value: "4hours", label: "4 hours" },
  { value: "today", label: "Today" },
  { value: "custom", label: "Custom" },
];

// =============================================================================
// Utility — Calculate expiry ISO timestamp from a duration selection
// =============================================================================

/**
 * Converts a human-readable duration identifier into an ISO 8601 expiry
 * timestamp. Returns `undefined` for "none" (permanent status).
 *
 * @param duration - One of the DURATION_OPTIONS values
 * @returns ISO 8601 date string or undefined for no expiry
 */
function calculateExpiry(duration: string): string | undefined {
  const now = new Date();

  switch (duration) {
    case "30min":
      return new Date(now.getTime() + 30 * 60 * 1000).toISOString();
    case "1hour":
      return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    case "4hours":
      return new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
    case "today": {
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      return endOfDay.toISOString();
    }
    case "custom":
      /* Custom duration defaults to 24 hours — a full implementation would
         show a date-time picker, but that is beyond the current scope. */
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    case "none":
    default:
      return undefined;
  }
}

// =============================================================================
// StatusSelector Component
// =============================================================================

/**
 * User status selector dropdown component.
 *
 * Renders a trigger button that shows the current status (or a placeholder),
 * and opens a dropdown panel with:
 * - Custom status input (emoji button + text field)
 * - Duration selector (auto-clear timer)
 * - Preset quick-set statuses
 * - Save / Clear action buttons
 * - Integrated EmojiPicker sub-dropdown for emoji selection
 *
 * Follows Slack's status selector UI pattern with the workspace color palette:
 * - Save button: #007A5A (Slack green)
 * - Focus ring: #1164A3 (Slack blue)
 * - Hover background: #F8F8F8 (Slack light gray)
 */
export default function StatusSelector({
  currentStatus,
  onStatusChange,
  userId,
}: StatusSelectorProps) {
  // ---------------------------------------------------------------------------
  // Component State
  // ---------------------------------------------------------------------------

  /** Whether the dropdown panel is visible */
  const [isOpen, setIsOpen] = useState<boolean>(false);
  /** Currently selected status emoji displayed in the custom input */
  const [selectedEmoji, setSelectedEmoji] = useState<string>("💬");
  /** Custom status text entered by the user */
  const [statusText, setStatusText] = useState<string>("");
  /** Selected auto-clear duration */
  const [duration, setDuration] = useState<string>("none");
  /** Whether the EmojiPicker sub-dropdown is visible */
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);

  /** Tracks previous isOpen state for "adjusting state during render" pattern */
  const [prevIsOpen, setPrevIsOpen] = useState<boolean>(false);

  // ---------------------------------------------------------------------------
  // Synchronize form fields when dropdown transitions from closed → open
  // (React "adjusting state during render" pattern — avoids setState in effect)
  // ---------------------------------------------------------------------------

  if (isOpen && !prevIsOpen) {
    if (currentStatus) {
      setSelectedEmoji(currentStatus.status_emoji || "💬");
      setStatusText(currentStatus.status_text || "");
      setDuration("none");
    } else {
      setSelectedEmoji("💬");
      setStatusText("");
      setDuration("none");
    }
  }
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
  }

  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------

  /** Reference to the dropdown container for click-outside detection */
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  /**
   * Click-outside handler — closes the dropdown when clicking anywhere
   * outside the dropdown container. Uses a micro-task delay to prevent
   * the trigger click from immediately re-closing the dropdown.
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setShowEmojiPicker(false);
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  /**
   * Save the current form state as a new UserStatus and close the dropdown.
   * Constructs the status object using the UserStatus interface fields:
   * user_id, status_emoji, status_text, and optional expires_at.
   */
  const handleSave = () => {
    const status: UserStatus = {
      user_id: userId ?? 0,
      status_emoji: selectedEmoji,
      status_text: statusText,
      expires_at: calculateExpiry(duration),
    };
    onStatusChange(status);
    setIsOpen(false);
    setShowEmojiPicker(false);
  };

  /**
   * Clear the user's status by passing null to the callback, then close.
   */
  const handleClear = () => {
    onStatusChange(null);
    setIsOpen(false);
    setShowEmojiPicker(false);
  };

  /**
   * Apply a preset status to the form fields. The user can modify them
   * before saving, or click Save immediately to apply the preset as-is.
   */
  const handlePresetClick = (preset: PresetStatus) => {
    setSelectedEmoji(preset.emoji);
    setStatusText(preset.text);
    setDuration(preset.duration);
  };

  /**
   * Handle emoji selection from the EmojiPicker sub-dropdown.
   * Updates the selected emoji and closes the picker.
   */
  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
    setShowEmojiPicker(false);
  };

  /**
   * Toggle the main dropdown open/closed. Closes the emoji picker if the
   * dropdown is being closed.
   */
  const handleToggleDropdown = () => {
    setIsOpen((prev) => {
      if (prev) {
        setShowEmojiPicker(false);
      }
      return !prev;
    });
  };

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  /** Emoji to show on the trigger button — from current status or empty */
  const triggerEmoji = currentStatus?.status_emoji ?? "";
  /** Text to show on the trigger button — from current status or placeholder */
  const triggerText = currentStatus?.status_text || "Update your status";

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ------------------------------------------------------------------- */}
      {/* Trigger Button                                                      */}
      {/* ------------------------------------------------------------------- */}
      <button
        type="button"
        onClick={handleToggleDropdown}
        className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-100 text-sm text-gray-700 cursor-pointer"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Set your status"
      >
        {triggerEmoji && (
          <span className="text-base" aria-hidden="true">
            {triggerEmoji}
          </span>
        )}
        <span className={currentStatus ? "text-gray-700" : "text-gray-500"}>
          {triggerText}
        </span>
      </button>

      {/* ------------------------------------------------------------------- */}
      {/* Dropdown Container                                                  */}
      {/* ------------------------------------------------------------------- */}
      {isOpen && (
        <div className="absolute z-30 mt-1 w-80 bg-white rounded-lg shadow-lg border border-gray-200">
          {/* --------------------------------------------------------------- */}
          {/* Custom Status Input                                             */}
          {/* --------------------------------------------------------------- */}
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              {/* Emoji selector button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center text-lg cursor-pointer"
                  aria-label="Choose status emoji"
                  aria-haspopup="true"
                  aria-expanded={showEmojiPicker}
                >
                  {selectedEmoji}
                </button>
                {/* EmojiPicker sub-dropdown — positioned below the emoji button */}
                <EmojiPicker
                  isOpen={showEmojiPicker}
                  onClose={() => setShowEmojiPicker(false)}
                  onEmojiSelect={handleEmojiSelect}
                  position="bottom"
                />
              </div>

              {/* Status text input field */}
              <input
                type="text"
                value={statusText}
                onChange={(e) => setStatusText(e.target.value)}
                placeholder="What's your status?"
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded outline-none focus:ring-1 focus:ring-[#1164A3]"
                aria-label="Status text"
              />
            </div>
          </div>

          {/* --------------------------------------------------------------- */}
          {/* Duration Selector                                               */}
          {/* --------------------------------------------------------------- */}
          <div className="px-3 py-2 border-b border-gray-200">
            <label
              className="text-xs text-gray-500 mb-1 block"
              htmlFor="status-duration-select"
            >
              Clear after
            </label>
            <select
              id="status-duration-select"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            >
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* --------------------------------------------------------------- */}
          {/* Preset Statuses                                                 */}
          {/* --------------------------------------------------------------- */}
          <div className="py-1">
            {PRESET_STATUSES.map((preset) => (
              <button
                key={preset.text}
                type="button"
                onClick={() => handlePresetClick(preset)}
                className="flex items-center gap-3 px-3 py-2 hover:bg-[#F8F8F8] cursor-pointer text-sm w-full text-left"
              >
                <span className="text-lg" aria-hidden="true">
                  {preset.emoji}
                </span>
                <span className="text-gray-700">{preset.text}</span>
              </button>
            ))}
          </div>

          {/* --------------------------------------------------------------- */}
          {/* Action Buttons                                                  */}
          {/* --------------------------------------------------------------- */}
          <div className="flex gap-2 p-3 border-t border-gray-200">
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 px-3 py-1.5 bg-[#007A5A] text-white rounded text-sm font-medium hover:bg-[#006849]"
            >
              Save
            </button>
            {currentStatus && (
              <button
                type="button"
                onClick={handleClear}
                className="flex-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-100"
              >
                Clear status
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

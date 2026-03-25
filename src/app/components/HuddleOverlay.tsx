"use client";

/**
 * HuddleOverlay — Huddle / Call UI Overlay Component (Visual Mockup)
 *
 * Renders a floating dark-themed overlay that simulates a Slack Huddle session.
 * Participants are displayed in a 2-column grid using the UserAvatar component,
 * and a controls bar provides visual-only toggle buttons for microphone, camera,
 * screen sharing, and a leave action.
 *
 * IMPORTANT: This is a visual mockup only. No actual audio, video, screen
 * sharing, or WebRTC functionality is implemented. All toggle states are
 * cosmetic and do not interact with any media APIs.
 */

import { useState } from "react";

import type { User } from "@/lib/types";
import UserAvatar from "@/app/components/UserAvatar";

/* -------------------------------------------------------------------------- */
/*  Props interface                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Props accepted by the HuddleOverlay component.
 *
 * @property isOpen       - Controls overlay visibility. When false, nothing renders.
 * @property onClose      - Callback invoked when the user clicks the leave button.
 * @property participants - Optional array of User objects to display in the grid.
 *                          Falls back to two mock users when omitted.
 * @property channelName  - Optional channel name displayed in the header.
 *                          Defaults to "general" when omitted.
 */
export interface HuddleOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  participants?: User[];
  channelName?: string;
}

/* -------------------------------------------------------------------------- */
/*  Default mock participants shown when the prop is omitted                  */
/* -------------------------------------------------------------------------- */

const DEFAULT_PARTICIPANTS: User[] = [
  { id: 1, username: "alice", avatar_color: "#4A154B", created_at: "2024-01-15T10:00:00Z" },
  { id: 2, username: "bob", avatar_color: "#36C5F0", created_at: "2024-01-15T10:00:00Z" },
];

/* -------------------------------------------------------------------------- */
/*  Inline SVG icon components (monochrome, fill="currentColor")              */
/* -------------------------------------------------------------------------- */

/** Microphone icon — active/unmuted state */
function MicOnIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
      aria-hidden="true"
    >
      <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.93V21h2v-3.07A7 7 0 0 0 19 11h-2Z" />
    </svg>
  );
}

/** Microphone icon — muted state with diagonal slash */
function MicOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
      aria-hidden="true"
    >
      <path d="M19 11h-2a5 5 0 0 1-.78 2.68l1.46 1.46A6.96 6.96 0 0 0 19 11ZM12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6c0 .34.06.67.16.97L12 14ZM3.27 3 2 4.27l6 6V11a4 4 0 0 0 4 4c.38 0 .74-.07 1.08-.19l.92.92A5.94 5.94 0 0 1 12 16a6 6 0 0 1-6-6H4a8 8 0 0 0 7 7.94V21h2v-3.06c.91-.12 1.77-.44 2.53-.9l4.2 4.2 1.27-1.27L3.27 3Z" />
    </svg>
  );
}

/** Video camera icon — active/on state */
function CameraOnIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
      aria-hidden="true"
    >
      <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4V6.5l-4 4Z" />
    </svg>
  );
}

/** Video camera icon — off state with diagonal slash */
function CameraOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
      aria-hidden="true"
    >
      <path d="M3.27 3 2 4.27 4.73 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12c.21 0 .39-.08.54-.18L19.73 22 21 20.73 3.27 3ZM17 10.5l4-4v11l-4-4v.5c0 .09-.02.17-.04.25L10.23 7.52 16 7a1 1 0 0 1 1 1v2.5Z" />
    </svg>
  );
}

/** Screen sharing icon — monitor with arrow */
function ScreenShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
      aria-hidden="true"
    >
      <path d="M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4ZM4 6h16v10H4V6Zm9 1-4 4h3v4h2v-4h3l-4-4Z" />
    </svg>
  );
}

/** Leave / hang-up phone icon */
function LeaveIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
      aria-hidden="true"
    >
      <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28a1 1 0 0 1-.71-.3L.29 13.08a.96.96 0 0 1 0-1.36C3.69 8.42 7.6 6.5 12 6.5s8.31 1.92 11.71 5.22a.96.96 0 0 1 0 1.36l-2.48 2.48a1 1 0 0 1-.7.29c-.26 0-.52-.1-.7-.28a15.65 15.65 0 0 0-2.67-1.86.99.99 0 0 1-.56-.9v-3.1A16.03 16.03 0 0 0 12 9Z" />
    </svg>
  );
}

/** Minimize / chevron-down icon for the header */
function MinimizeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-4 h-4"
      aria-hidden="true"
    >
      <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41Z" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function HuddleOverlay({
  isOpen,
  onClose,
  participants,
  channelName,
}: HuddleOverlayProps) {
  /* ---- Mock toggle states (visual-only, no media API interaction) -------- */
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);

  /* Do not render anything when the overlay is closed */
  if (!isOpen) {
    return null;
  }

  /* Resolve participants — fall back to two default mock users */
  const displayParticipants: User[] =
    participants && participants.length > 0
      ? participants
      : DEFAULT_PARTICIPANTS;

  /* Resolve the header channel name */
  const displayChannelName: string = channelName || "general";

  return (
    <div
      className="fixed bottom-4 right-4 z-40 w-80 rounded-xl shadow-2xl overflow-hidden bg-[#1D1C1D]"
      role="dialog"
      aria-label={`Huddle in #${displayChannelName}`}
      aria-modal="false"
      data-testid="huddle-overlay"
    >
      {/* ------------------------------------------------------------------ */}
      {/*  Header                                                            */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium text-white truncate">
            # {displayChannelName}
          </span>
          <span className="text-xs text-gray-400">Huddle</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-white rounded p-1 transition-colors"
          aria-label="Minimize huddle"
        >
          <MinimizeIcon />
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*  Status text (connection status + mock duration)                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="text-xs text-gray-400 text-center pb-2">
        <span className="inline-flex items-center gap-1">
          <span
            className="w-1.5 h-1.5 rounded-full bg-[#2BAC76] inline-block"
            aria-hidden="true"
          />
          Connected
        </span>
        <span className="mx-1.5" aria-hidden="true">
          ·
        </span>
        <span>00:15:32</span>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*  Participants grid — 2 columns                                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 gap-2 p-3">
        {displayParticipants.map((participant) => (
          <div
            key={participant.id}
            className="flex flex-col items-center justify-center rounded-lg bg-[#2C2C2E] p-4"
          >
            <UserAvatar
              username={participant.username}
              avatarColor={participant.avatar_color}
              size="lg"
            />
            <span className="mt-2 text-xs text-gray-300 truncate max-w-full">
              {participant.username}
            </span>
            {/* Show muted indicator when the local user is muted */}
            {isMuted && participant.id === displayParticipants[0]?.id && (
              <span
                className="mt-1 text-red-400"
                aria-label={`${participant.username} is muted`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-3.5 h-3.5"
                  aria-hidden="true"
                >
                  <path d="M19 11h-2a5 5 0 0 1-.78 2.68l1.46 1.46A6.96 6.96 0 0 0 19 11ZM12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6c0 .34.06.67.16.97L12 14ZM3.27 3 2 4.27l6 6V11a4 4 0 0 0 4 4c.38 0 .74-.07 1.08-.19l.92.92A5.94 5.94 0 0 1 12 16a6 6 0 0 1-6-6H4a8 8 0 0 0 7 7.94V21h2v-3.06c.91-.12 1.77-.44 2.53-.9l4.2 4.2 1.27-1.27L3.27 3Z" />
                </svg>
              </span>
            )}
          </div>
        ))}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*  Controls bar                                                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center justify-center gap-4 px-4 py-3 bg-[#2C2C2E]">
        {/* Microphone toggle */}
        <button
          type="button"
          onClick={() => setIsMuted((prev) => !prev)}
          className={[
            "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
            isMuted
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-gray-600 text-white hover:bg-gray-500",
          ].join(" ")}
          aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
          aria-pressed={isMuted}
        >
          {isMuted ? <MicOffIcon /> : <MicOnIcon />}
        </button>

        {/* Camera toggle */}
        <button
          type="button"
          onClick={() => setIsCameraOn((prev) => !prev)}
          className={[
            "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
            isCameraOn
              ? "bg-gray-600 text-white hover:bg-gray-500"
              : "bg-red-500 text-white hover:bg-red-600",
          ].join(" ")}
          aria-label={isCameraOn ? "Turn off camera" : "Turn on camera"}
          aria-pressed={isCameraOn}
        >
          {isCameraOn ? <CameraOnIcon /> : <CameraOffIcon />}
        </button>

        {/* Screen share toggle */}
        <button
          type="button"
          onClick={() => setIsScreenSharing((prev) => !prev)}
          className={[
            "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
            isScreenSharing
              ? "bg-[#1164A3] text-white hover:bg-[#0E5490]"
              : "bg-gray-600 text-white hover:bg-gray-500",
          ].join(" ")}
          aria-label={
            isScreenSharing ? "Stop screen sharing" : "Share screen"
          }
          aria-pressed={isScreenSharing}
        >
          <ScreenShareIcon />
        </button>

        {/* Leave huddle */}
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500 text-white hover:bg-red-600 transition-colors"
          aria-label="Leave huddle"
        >
          <LeaveIcon />
        </button>
      </div>
    </div>
  );
}

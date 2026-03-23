"use client";

import { useState, useRef } from "react";

/**
 * Props interface for the MessageInput component.
 * Defines the contract for the reusable message composer.
 */
export interface MessageInputProps {
  /** The name of the channel, used for placeholder text (e.g., "Message #general") */
  channelName: string;
  /** Callback invoked when the user sends a message */
  onSendMessage: (content: string) => void;
  /** Optional custom placeholder text; defaults to "Message #channelName" */
  placeholder?: string;
  /** Whether the input is disabled (prevents typing and sending) */
  disabled?: boolean;
  /** Compact mode for thread reply input — reduces padding */
  compact?: boolean;
}

/**
 * MessageInput — Reusable message composer component.
 *
 * Extracts and enhances the message input area from the original monolithic
 * SlackClone component. Features a formatting toolbar (visual-only), text input
 * with Slack-style focus ring, attachment/emoji buttons, and a send button.
 *
 * Preserves exact colors from the original source:
 * - Send button: bg-[#007A5A], hover bg-[#006849]
 * - Focus ring: focus:ring-[#1164A3]
 * - Input border: border-gray-300
 */
export default function MessageInput({
  channelName,
  onSendMessage,
  placeholder,
  disabled = false,
  compact = false,
}: MessageInputProps) {
  const [message, setMessage] = useState<string>("");
  const [showFormatToolbar, setShowFormatToolbar] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Handles form submission — validates, sends, clears, and refocuses.
   */
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || disabled) return;
    onSendMessage(trimmed);
    setMessage("");
    // Refocus the input after sending
    inputRef.current?.focus();
  };

  /**
   * Toggles the formatting toolbar visibility.
   */
  const handleToggleToolbar = () => {
    setShowFormatToolbar((prev) => !prev);
  };

  const resolvedPlaceholder =
    placeholder || `Message #${channelName}`;

  const isSendDisabled = !message.trim() || disabled;

  return (
    <div
      className={
        compact
          ? "px-4 py-3 border-t border-gray-200"
          : "px-6 py-4 border-t border-gray-200"
      }
    >
      {/* Formatting Toolbar — visual only, no actual rich text editing */}
      {showFormatToolbar && (
        <div className="flex items-center gap-1 pb-2 border-b border-gray-100 mb-2">
          {/* Bold */}
          <button
            type="button"
            className="p-1.5 rounded hover:bg-gray-100 text-sm font-bold text-gray-500"
            aria-label="Bold"
            tabIndex={-1}
          >
            B
          </button>
          {/* Italic */}
          <button
            type="button"
            className="p-1.5 rounded hover:bg-gray-100 text-sm italic text-gray-500"
            aria-label="Italic"
            tabIndex={-1}
          >
            I
          </button>
          {/* Strikethrough */}
          <button
            type="button"
            className="p-1.5 rounded hover:bg-gray-100 text-sm line-through text-gray-500"
            aria-label="Strikethrough"
            tabIndex={-1}
          >
            S
          </button>

          {/* Divider */}
          <div className="w-px h-5 bg-gray-300 mx-1" aria-hidden="true" />

          {/* Code */}
          <button
            type="button"
            className="p-1.5 rounded hover:bg-gray-100 text-sm font-mono text-gray-500"
            aria-label="Code"
            tabIndex={-1}
          >
            {"<>"}
          </button>
          {/* Link */}
          <button
            type="button"
            className="p-1.5 rounded hover:bg-gray-100 text-sm text-gray-500"
            aria-label="Insert link"
            tabIndex={-1}
          >
            🔗
          </button>

          {/* Divider */}
          <div className="w-px h-5 bg-gray-300 mx-1" aria-hidden="true" />

          {/* Ordered list */}
          <button
            type="button"
            className="p-1.5 rounded hover:bg-gray-100 text-sm text-gray-500"
            aria-label="Ordered list"
            tabIndex={-1}
          >
            1.
          </button>
          {/* Bulleted list */}
          <button
            type="button"
            className="p-1.5 rounded hover:bg-gray-100 text-sm text-gray-500"
            aria-label="Bulleted list"
            tabIndex={-1}
          >
            •
          </button>
        </div>
      )}

      {/* Input + Actions Row */}
      <form onSubmit={handleSend} className="flex gap-2">
        {/* Attachment button */}
        <button
          type="button"
          className="p-2 text-gray-400 hover:text-gray-600 shrink-0 self-center"
          aria-label="Attach file"
          tabIndex={-1}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M17.5 9.31l-7.78 7.78a4.5 4.5 0 01-6.36-6.36l7.78-7.78a3 3 0 014.24 4.24l-7.07 7.07a1.5 1.5 0 01-2.12-2.12l6.36-6.36"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Message text input — EXACT styling from source */}
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onFocus={() => setShowFormatToolbar(true)}
          placeholder={resolvedPlaceholder}
          disabled={disabled}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-[#1164A3] focus:border-transparent outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={resolvedPlaceholder}
        />

        {/* Emoji button */}
        <button
          type="button"
          className="p-2 text-gray-400 hover:text-gray-600 shrink-0 self-center"
          aria-label="Add emoji"
          tabIndex={-1}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="10"
              cy="10"
              r="8"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <circle cx="7" cy="8.5" r="1" fill="currentColor" />
            <circle cx="13" cy="8.5" r="1" fill="currentColor" />
            <path
              d="M6.5 12.5c.83 1.17 2.17 2 3.5 2s2.67-.83 3.5-2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Formatting toggle button */}
        <button
          type="button"
          onClick={handleToggleToolbar}
          className={`p-2 shrink-0 self-center rounded transition-colors ${
            showFormatToolbar
              ? "text-[#1164A3] bg-blue-50"
              : "text-gray-400 hover:text-gray-600"
          }`}
          aria-label="Toggle formatting toolbar"
          aria-pressed={showFormatToolbar}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3 5h14M3 10h10M3 15h6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Send button — EXACT styling from source */}
        <button
          type="submit"
          disabled={isSendDisabled}
          className="px-4 py-2 bg-[#007A5A] text-white rounded-lg text-sm font-medium hover:bg-[#006849] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}

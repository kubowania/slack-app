"use client";

import { useState } from "react";

/**
 * Props for the CanvasEditor component.
 * @property title - Optional initial title for the canvas document.
 */
export interface CanvasEditorProps {
  title?: string;
}

/** Formatting toolbar button definitions */
const FORMAT_BUTTONS: ReadonlyArray<{
  id: string;
  label: string;
  display: string;
  ariaLabel: string;
}> = [
  { id: "bold", label: "B", display: "font-bold", ariaLabel: "Bold" },
  { id: "italic", label: "I", display: "italic", ariaLabel: "Italic" },
  { id: "strike", label: "S", display: "line-through", ariaLabel: "Strikethrough" },
  { id: "code", label: "<>", display: "font-mono", ariaLabel: "Code" },
  { id: "link", label: "🔗", display: "", ariaLabel: "Link" },
] as const;

/** List-type formatting buttons */
const LIST_BUTTONS: ReadonlyArray<{
  id: string;
  label: string;
  ariaLabel: string;
}> = [
  { id: "bullet", label: "•", ariaLabel: "Bullet list" },
  { id: "numbered", label: "1.", ariaLabel: "Numbered list" },
] as const;

/** Heading selector buttons */
const HEADING_BUTTONS: ReadonlyArray<{
  id: string;
  label: string;
  ariaLabel: string;
}> = [
  { id: "h1", label: "H1", ariaLabel: "Heading 1" },
  { id: "h2", label: "H2", ariaLabel: "Heading 2" },
  { id: "h3", label: "H3", ariaLabel: "Heading 3" },
] as const;

/** Default mock document content rendered in the editor area */
const DEFAULT_CONTENT = `# Project Notes

This document contains the working notes and key decisions for the Q3 product launch. All team members are encouraged to add updates and action items below.

## Key Milestones

The product launch is scheduled for September 15th. The team has completed the initial design phase and is now moving into the development sprint.

## Action Items

• Finalize the API contract documentation — assigned to alice
• Complete the frontend component library — assigned to bob
• Set up staging environment for QA — assigned to charlie
• Review and approve the marketing copy — assigned to alice
• Prepare the demo environment for stakeholders — assigned to bob

## Open Questions

1. Should we use server-side rendering for the dashboard views?
2. What is the target browser support matrix for the MVP?
3. Do we need to support offline mode in the first release?

## Todo List

☑ Define project scope and objectives
☑ Create initial wireframes and mockups
☐ Build shared component library
☐ Implement API endpoints
☐ Write integration tests
☐ Conduct performance benchmarking
☐ Prepare release notes and changelog`;

/**
 * CanvasEditor — Visual mockup of the Slack Canvas/Notes editor.
 *
 * Renders a static, interactive-looking document editor UI that matches the
 * Slack Canvas screenshots. This is a visual-only component with no actual
 * rich text editing, real-time collaboration, or document persistence.
 *
 * All state changes (title, content, formatting toggles) are local-only
 * and do not persist to any backend.
 */
export default function CanvasEditor({ title }: CanvasEditorProps) {
  const [canvasTitle, setCanvasTitle] = useState<string>(title ?? "");
  const [content, setContent] = useState<string>(DEFAULT_CONTENT);
  const [activeFormat, setActiveFormat] = useState<string[]>([]);

  /**
   * Toggles a formatting button's active visual state.
   * This is purely visual — no actual rich text formatting is applied.
   */
  const toggleFormat = (formatId: string): void => {
    setActiveFormat((prev) =>
      prev.includes(formatId)
        ? prev.filter((f) => f !== formatId)
        : [...prev, formatId]
    );
  };

  /**
   * Checks whether a given formatting button is currently active.
   */
  const isActive = (formatId: string): boolean =>
    activeFormat.includes(formatId);

  /**
   * Returns the CSS classes for a toolbar button based on its active state.
   */
  const getButtonClasses = (formatId: string, extraClasses?: string): string => {
    const base = "p-2 rounded text-sm transition-colors";
    const active = isActive(formatId)
      ? "bg-gray-200 text-gray-900"
      : "text-gray-600 hover:bg-gray-100";
    return `${base} ${active}${extraClasses ? ` ${extraClasses}` : ""}`;
  };

  /**
   * Renders the mock document content with basic visual formatting.
   * Parses lines into headings, bullets, checkboxes, and paragraphs
   * for a realistic document appearance.
   */
  const renderContent = (): React.ReactNode => {
    const lines = content.split("\n");
    return lines.map((line, index) => {
      const key = `line-${index}`;

      /* Heading level 1 */
      if (line.startsWith("# ")) {
        return (
          <h1
            key={key}
            className="text-2xl font-bold text-gray-900 mb-3 mt-4 first:mt-0"
          >
            {line.slice(2)}
          </h1>
        );
      }

      /* Heading level 2 */
      if (line.startsWith("## ")) {
        return (
          <h2
            key={key}
            className="text-lg font-bold text-gray-800 mb-2 mt-4"
          >
            {line.slice(3)}
          </h2>
        );
      }

      /* Heading level 3 */
      if (line.startsWith("### ")) {
        return (
          <h3
            key={key}
            className="text-base font-semibold text-gray-800 mb-2 mt-3"
          >
            {line.slice(4)}
          </h3>
        );
      }

      /* Checked checkbox item */
      if (line.startsWith("☑")) {
        return (
          <div key={key} className="flex items-start gap-2 mb-1 ps-1">
            <span className="inline-flex items-center justify-center w-4 h-4 mt-0.5 rounded border border-[#1164A3] bg-[#1164A3] text-white text-xs shrink-0">
              ✓
            </span>
            <span className="text-sm text-gray-400 line-through">
              {line.slice(1).trim()}
            </span>
          </div>
        );
      }

      /* Unchecked checkbox item */
      if (line.startsWith("☐")) {
        return (
          <div key={key} className="flex items-start gap-2 mb-1 ps-1">
            <span className="inline-flex items-center justify-center w-4 h-4 mt-0.5 rounded border border-gray-300 bg-white shrink-0" />
            <span className="text-sm text-gray-700">
              {line.slice(1).trim()}
            </span>
          </div>
        );
      }

      /* Bullet list item */
      if (line.startsWith("• ") || line.startsWith("- ")) {
        return (
          <div key={key} className="flex items-start gap-2 mb-1 ps-1">
            <span className="text-gray-400 text-sm mt-px shrink-0">•</span>
            <span className="text-sm text-gray-700">{line.slice(2)}</span>
          </div>
        );
      }

      /* Numbered list item */
      const numberedMatch = line.match(/^(\d+)\.\s(.+)$/);
      if (numberedMatch) {
        return (
          <div key={key} className="flex items-start gap-2 mb-1 ps-1">
            <span className="text-gray-400 text-sm mt-px shrink-0 min-w-[1rem] text-end">
              {numberedMatch[1]}.
            </span>
            <span className="text-sm text-gray-700">{numberedMatch[2]}</span>
          </div>
        );
      }

      /* Empty line / spacing */
      if (line.trim() === "") {
        return <div key={key} className="h-3" aria-hidden="true" />;
      }

      /* Regular paragraph */
      return (
        <p key={key} className="text-sm text-gray-700 leading-relaxed mb-2">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* ─── Collaboration Indicators (Static Mock) ─── */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <div className="flex items-center -space-x-1">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full bg-[#2BAC76] border-2 border-white"
            aria-hidden="true"
          />
          <span
            className="inline-block w-2.5 h-2.5 rounded-full bg-[#1164A3] border-2 border-white"
            aria-hidden="true"
          />
        </div>
        <span className="text-xs text-gray-400">2 people viewing</span>
        <button
          type="button"
          className="px-3 py-1 text-sm text-[#1164A3] border border-[#1164A3] rounded hover:bg-[#1164A3] hover:text-white transition-colors"
        >
          Share
        </button>
      </div>

      {/* ─── Title Area ─── */}
      <div className="px-6 py-4 border-b border-gray-200">
        <input
          type="text"
          value={canvasTitle}
          onChange={(e) => setCanvasTitle(e.target.value)}
          placeholder="Untitled canvas"
          className="text-xl font-bold text-gray-900 w-full outline-none bg-transparent placeholder-gray-400"
          aria-label="Canvas title"
        />
      </div>

      {/* ─── Formatting Toolbar ─── */}
      <div
        className="flex items-center gap-1 px-6 py-2 border-b border-gray-200"
        role="toolbar"
        aria-label="Formatting toolbar"
      >
        {/* Text formatting buttons */}
        {FORMAT_BUTTONS.map((btn) => (
          <button
            key={btn.id}
            type="button"
            onClick={() => toggleFormat(btn.id)}
            className={getButtonClasses(btn.id, btn.display)}
            aria-label={btn.ariaLabel}
            aria-pressed={isActive(btn.id)}
          >
            {btn.label}
          </button>
        ))}

        {/* Divider */}
        <div className="w-px h-5 bg-gray-300 mx-1" aria-hidden="true" />

        {/* List buttons */}
        {LIST_BUTTONS.map((btn) => (
          <button
            key={btn.id}
            type="button"
            onClick={() => toggleFormat(btn.id)}
            className={getButtonClasses(btn.id)}
            aria-label={btn.ariaLabel}
            aria-pressed={isActive(btn.id)}
          >
            {btn.label}
          </button>
        ))}

        {/* Divider */}
        <div className="w-px h-5 bg-gray-300 mx-1" aria-hidden="true" />

        {/* Heading buttons */}
        {HEADING_BUTTONS.map((btn) => (
          <button
            key={btn.id}
            type="button"
            onClick={() => toggleFormat(btn.id)}
            className={getButtonClasses(btn.id, "font-semibold")}
            aria-label={btn.ariaLabel}
            aria-pressed={isActive(btn.id)}
          >
            {btn.label}
          </button>
        ))}

        {/* Divider */}
        <div className="w-px h-5 bg-gray-300 mx-1" aria-hidden="true" />

        {/* Checkbox/todo button */}
        <button
          type="button"
          onClick={() => toggleFormat("checkbox")}
          className={getButtonClasses("checkbox")}
          aria-label="Checkbox / todo item"
          aria-pressed={isActive("checkbox")}
        >
          ☑
        </button>
      </div>

      {/* ─── Editor Content Area ─── */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="min-h-full text-sm text-gray-700 leading-relaxed outline-none max-w-3xl">
          {renderContent()}
        </div>
      </div>

      {/* ─── Footer ─── */}
      <div className="px-6 py-2 text-xs text-gray-400 border-t border-gray-200 flex items-center justify-between">
        <span>Last edited by alice 2 hours ago</span>
        <div className="flex items-center gap-3">
          <span className="text-gray-300">
            {content.split("\n").filter((l) => l.trim() !== "").length} lines
          </span>
          <button
            type="button"
            onClick={() => setContent(DEFAULT_CONTENT)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Reset content to default"
          >
            ↺ Reset
          </button>
        </div>
      </div>
    </div>
  );
}

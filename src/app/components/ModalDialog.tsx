"use client";

import { useEffect, useRef, useCallback, useId } from "react";

/**
 * Props interface for the ModalDialog component.
 * Defines a controlled modal dialog with configurable size, header, content, and footer.
 */
export interface ModalDialogProps {
  /** Controls modal visibility — when false, modal is not rendered */
  isOpen: boolean;
  /** Callback invoked when modal requests to be closed (escape key, backdrop click, close button) */
  onClose: () => void;
  /** Title displayed in the modal header */
  title: string;
  /** Modal body content — children manage their own padding for flexibility */
  children: React.ReactNode;
  /** Modal width variant: sm (max-w-sm), md (max-w-md), lg (max-w-lg), xl (max-w-2xl) */
  size?: "sm" | "md" | "lg" | "xl";
  /** Whether to show the close button in the header. Defaults to true */
  showCloseButton?: boolean;
  /** Optional footer content rendered below the content area with a top border */
  footer?: React.ReactNode;
}

/**
 * Maps size prop values to Tailwind max-width utility classes.
 * sm  → 384px (max-w-sm)
 * md  → 448px (max-w-md) — default
 * lg  → 512px (max-w-lg)
 * xl  → 672px (max-w-2xl)
 */
const SIZE_CLASSES: Record<NonNullable<ModalDialogProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

/**
 * ModalDialog — Reusable modal shell component with backdrop overlay, header,
 * scrollable content area, and optional footer.
 *
 * Features:
 * - Controlled via isOpen/onClose props (standard React controlled-component pattern)
 * - Close via Escape key, backdrop click, or close button
 * - Body scroll lock when open
 * - Focus management: focuses first focusable element on open, restores focus on close
 * - Accessible: role="dialog", aria-modal="true", aria-labelledby
 * - Animated via modal-backdrop (fadeIn) and modal-content (scaleIn) CSS classes from globals.css
 * - Size variants: sm, md (default), lg, xl
 * - Optional footer section for action buttons
 * - Children manage their own padding for maximum layout flexibility
 */
export default function ModalDialog({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
  footer,
}: ModalDialogProps) {
  /** Unique ID per instance for the modal title element, used by aria-labelledby */
  const modalTitleId = useId();

  /** Reference to the modal content container for focus management */
  const modalContentRef = useRef<HTMLDivElement>(null);

  /** Stores the element that had focus before the modal opened, to restore on close */
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  /**
   * Memoized close handler — ensures stable reference for event listeners
   * and child components that depend on it.
   */
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  /**
   * Backdrop click handler — only triggers close when the click target
   * is the backdrop element itself (not a descendant).
   */
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    },
    [handleClose]
  );

  /**
   * Content click handler — stops click propagation so clicking inside
   * the modal content area does not trigger the backdrop click handler.
   */
  const handleContentClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
    },
    []
  );

  /**
   * Escape key listener — closes the modal when the Escape key is pressed.
   * Only active when the modal is open. Cleans up on close or unmount.
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, handleClose]);

  /**
   * Body scroll lock — prevents background content from scrolling while
   * the modal is open. Restores the original overflow value on close.
   */
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  /**
   * Focus management lifecycle:
   * - On open: saves the previously focused element, then focuses the first
   *   focusable element inside the modal (or the modal container itself).
   * - On close: restores focus to the previously saved element.
   */
  useEffect(() => {
    if (isOpen) {
      /* Save reference to the element that triggered the modal */
      previousActiveElementRef.current =
        document.activeElement as HTMLElement | null;

      /* Defer focus to next frame to ensure modal DOM is fully rendered */
      requestAnimationFrame(() => {
        if (modalContentRef.current) {
          const focusableSelector =
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
          const focusableElements =
            modalContentRef.current.querySelectorAll<HTMLElement>(
              focusableSelector
            );

          if (focusableElements.length > 0) {
            focusableElements[0].focus();
          } else {
            /* Fallback: focus the modal container itself */
            modalContentRef.current.focus();
          }
        }
      });
    } else {
      /* Restore focus to the element that was active before the modal opened */
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
        previousActiveElementRef.current = null;
      }
    }
  }, [isOpen]);

  /* Do not render anything when the modal is closed */
  if (!isOpen) return null;

  return (
    /* Backdrop overlay — uses modal-backdrop CSS class from globals.css (fadeIn animation) */
    <div
      className="modal-backdrop flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Modal container — uses modal-content CSS class from globals.css (scaleIn animation) */}
      <div
        ref={modalContentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
        tabIndex={-1}
        className={`modal-content ${SIZE_CLASSES[size]} w-full bg-white rounded-xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col`}
        onClick={handleContentClick}
      >
        {/* Header — title and optional close button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 id={modalTitleId} className="text-lg font-bold text-gray-900">
            {title}
          </h2>
          {showCloseButton && (
            <button
              type="button"
              onClick={handleClose}
              className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close dialog"
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
                className="w-5 h-5"
              >
                <path
                  d="M15 5L5 15M5 5l10 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Content area — children manage their own padding for flexibility */}
        <div className="flex-1 overflow-y-auto">{children}</div>

        {/* Footer — rendered only when footer prop is provided */}
        {footer && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

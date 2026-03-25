/**
 * Shared input validation utilities for API route handlers.
 *
 * Centralizes validation patterns to ensure consistent security behavior
 * across all endpoints: integer parsing, text sanitization, length enforcement,
 * Content-Type checking, and Unicode control character stripping.
 */

/* ------------------------------------------------------------------ */
/*  Maximum field-length constants                                     */
/* ------------------------------------------------------------------ */

export const MAX_LENGTHS = {
  /** Channel and DM message content */
  MESSAGE_CONTENT: 10000,
  /** Channel name (matches VARCHAR(80) in init-db.sql) */
  CHANNEL_NAME: 80,
  /** Channel description */
  CHANNEL_DESCRIPTION: 500,
  /** Username (matches VARCHAR(50) in init-db.sql) */
  USERNAME: 50,
  /** Reaction emoji string */
  EMOJI: 50,
  /** User status text (matches VARCHAR(200)) */
  STATUS_TEXT: 200,
  /** Display name (matches VARCHAR(100)) */
  DISPLAY_NAME: 100,
  /** File name (matches VARCHAR(255)) */
  FILE_NAME: 255,
  /** Generic text fallback */
  GENERIC_TEXT: 10000,
} as const;

/* ------------------------------------------------------------------ */
/*  Integer validation                                                 */
/* ------------------------------------------------------------------ */

/**
 * Validates that a value represents a safe PostgreSQL INTEGER.
 *
 * Rejects floats, NaN, Infinity, arrays, objects, strings that don't
 * parse to a whole number, and values outside the INT4 range
 * (−2 147 483 648 … 2 147 483 647).
 *
 * @returns The parsed integer, or `null` when the value is invalid.
 */
export function parseValidInt(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  if (Array.isArray(value) || typeof value === "object") return null;

  const num = typeof value === "string" ? Number(value) : Number(value);

  if (!Number.isFinite(num)) return null;
  if (!Number.isInteger(num)) return null;
  if (num < -2147483648 || num > 2147483647) return null;

  return num;
}

/* ------------------------------------------------------------------ */
/*  Text sanitization                                                  */
/* ------------------------------------------------------------------ */

/**
 * Strips null bytes (`\0`) from a string.
 *
 * PostgreSQL TEXT / VARCHAR columns reject null bytes, which causes
 * unhandled 500 errors if they reach the database layer.
 */
export function stripNullBytes(text: string): string {
  return text.replace(/\0/g, "");
}

/**
 * Strips zero-width characters and Unicode bidirectional overrides
 * that can be used for visual spoofing in user-facing strings
 * (channel names, usernames, display names).
 *
 * Removed character ranges:
 *  - U+200B–U+200D  Zero-width space / non-joiner / joiner
 *  - U+FEFF         Zero-width no-break space (BOM)
 *  - U+2060         Word joiner
 *  - U+00AD         Soft hyphen
 *  - U+202A–U+202E  Bidirectional formatting (LRE, RLE, PDF, LRO, RLO)
 *  - U+2066–U+2069  Bidirectional isolate formatting
 */
export function stripUnicodeControl(text: string): string {
  return text.replace(
    /[\u200B-\u200D\uFEFF\u2060\u00AD\u202A-\u202E\u2066-\u2069]/g,
    "",
  );
}

/**
 * Full text sanitization: strips null bytes AND Unicode control characters.
 */
export function sanitizeText(text: string): string {
  return stripUnicodeControl(stripNullBytes(text));
}

/* ------------------------------------------------------------------ */
/*  Composite validators                                               */
/* ------------------------------------------------------------------ */

/**
 * Validates and sanitizes a text field: strips null bytes, then checks
 * the resulting length against a maximum.
 *
 * @returns An object with either `{ valid: true, sanitized }` or
 *          `{ valid: false, error }`.
 */
export function validateTextContent(
  text: string,
  fieldName: string,
  maxLength: number,
): { valid: true; sanitized: string } | { valid: false; error: string } {
  const sanitized = stripNullBytes(text);
  if (sanitized.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} exceeds maximum length of ${maxLength} characters`,
    };
  }
  return { valid: true, sanitized };
}

/* ------------------------------------------------------------------ */
/*  Content-Type enforcement                                           */
/* ------------------------------------------------------------------ */

/**
 * Checks whether the incoming request carries a JSON-compatible
 * Content-Type header.
 *
 * @returns `true` when the Content-Type is acceptable (includes
 *          "application/json" or is absent — for backward compatibility
 *          with simple clients), `false` otherwise.
 */
export function hasJsonContentType(req: Request): boolean {
  const ct = req.headers.get("content-type");
  if (!ct) return true; // lenient: allow missing header for backward compat
  return ct.toLowerCase().includes("application/json");
}

/* ------------------------------------------------------------------ */
/*  ILIKE wildcard escaping                                            */
/* ------------------------------------------------------------------ */

/**
 * Escapes PostgreSQL ILIKE special characters (`%` and `_`) so that
 * user-supplied search terms are treated as literal text.
 */
export function escapeILike(text: string): string {
  return text.replace(/%/g, "\\%").replace(/_/g, "\\_");
}

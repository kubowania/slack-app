import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  sanitizeText,
  validateTextContent,
  stripNullBytes,
  parseValidInt,
  hasJsonContentType,
  MAX_LENGTHS,
} from "@/lib/validation";

/**
 * Helper to detect PostgreSQL unique constraint violations.
 * Error code 23505 indicates a UNIQUE or PRIMARY KEY constraint failure.
 */
function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "23505"
  );
}

/**
 * GET /api/channels
 *
 * Lists all channels with creator information, member counts, unread counts,
 * and last message preview for the sidebar.
 */
export async function GET() {
  try {
    const result = await query(
      `SELECT c.*, u.username as creator_name,
        (SELECT COUNT(*)::int FROM channel_members cm WHERE cm.channel_id = c.id) as member_count,
        0 as unread_count,
        (SELECT content FROM messages m2 WHERE m2.channel_id = c.id ORDER BY m2.created_at DESC LIMIT 1) as last_message_preview
       FROM channels c
       LEFT JOIN users u ON u.id = c.created_by
       ORDER BY c.name`
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch channels:", err);
    return NextResponse.json(
      { error: "Failed to fetch channels" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/channels
 *
 * Creates a new channel. The channel name is normalized to lowercase with
 * hyphens replacing spaces. Returns 409 Conflict if the channel name already exists.
 */
export async function POST(req: Request) {
  // Info 5: Enforce JSON Content-Type on POST requests
  if (!hasJsonContentType(req)) {
    return NextResponse.json(
      { error: "Content-Type must be application/json" },
      { status: 415 },
    );
  }

  try {
    let body: { name?: string; description?: string; created_by?: number };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { name, description, created_by } = body;
    if (!name) {
      return NextResponse.json(
        { error: "Channel name is required" },
        { status: 400 }
      );
    }

    // Issue 7: Strip zero-width and bidirectional control characters from
    // channel names to prevent visual identity confusion / spoofing.
    const normalizedName = sanitizeText(
      name.toLowerCase().replace(/\s+/g, "-"),
    );

    // Issue 6 (channels): Validate channel name length before hitting DB
    const nameCheck = validateTextContent(
      normalizedName,
      "Channel name",
      MAX_LENGTHS.CHANNEL_NAME,
    );
    if (!nameCheck.valid) {
      return NextResponse.json({ error: nameCheck.error }, { status: 400 });
    }

    // Validate created_by is a valid integer when provided
    if (created_by !== undefined && created_by !== null) {
      const parsedCreatedBy = parseValidInt(created_by);
      if (parsedCreatedBy === null) {
        return NextResponse.json(
          { error: "created_by must be a valid integer" },
          { status: 400 },
        );
      }
    }

    // Sanitize description (strip null bytes, enforce length)
    const safeDescription = stripNullBytes(
      (description || "").slice(0, MAX_LENGTHS.CHANNEL_DESCRIPTION),
    );

    const result = await query(
      "INSERT INTO channels (name, description, created_by) VALUES ($1, $2, $3) RETURNING *",
      [nameCheck.sanitized, safeDescription, created_by]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    // Handle duplicate channel name: UNIQUE constraint on channels.name triggers code 23505
    if (isUniqueViolation(err)) {
      return NextResponse.json(
        { error: "A channel with this name already exists" },
        { status: 409 }
      );
    }

    console.error("Failed to create channel:", err);
    return NextResponse.json(
      { error: "Failed to create channel" },
      { status: 500 }
    );
  }
}

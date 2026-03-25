import { NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * Helper to detect PostgreSQL foreign key constraint violations.
 * Error code 23503 indicates a FK constraint failure (referenced row not found).
 */
function isForeignKeyViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "23503"
  );
}

/**
 * GET /api/channels/:id/messages
 *
 * Fetches messages for a given channel, including thread reply count, reaction summary,
 * and pin status. Returns with a default LIMIT of 100.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10) || 100, 200);
    const offset = parseInt(searchParams.get("offset") || "0", 10) || 0;

    const result = await query(
      `SELECT m.*, u.username, u.avatar_color,
        (SELECT COUNT(*)::int FROM threads t WHERE t.parent_message_id = m.id) as thread_reply_count,
        EXISTS(SELECT 1 FROM pins p WHERE p.message_id = m.id) as is_pinned,
        COALESCE(
          (SELECT json_agg(json_build_object('emoji', r.emoji, 'count', r.cnt, 'users', r.user_details))
            FROM (SELECT emoji, COUNT(*)::int as cnt,
              json_agg(json_build_object('id', ru.id, 'username', ru.username, 'avatar_color', ru.avatar_color)) as user_details
              FROM reactions JOIN users ru ON ru.id = reactions.user_id WHERE message_id = m.id GROUP BY emoji) r),
          '[]'::json
        ) as reaction_summary
      FROM messages m
      JOIN users u ON u.id = m.user_id
      WHERE m.channel_id = $1
      ORDER BY m.created_at ASC
      LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch messages:", err);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/channels/:id/messages
 *
 * Creates a new message in a channel. Validates content is non-empty after trimming.
 * Returns 400 for invalid JSON, missing fields, whitespace-only content.
 * Returns 404/400 for FK violations (non-existent user or channel).
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    let body: { user_id?: number; content?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { user_id, content } = body;
    if (!content || !user_id) {
      return NextResponse.json(
        { error: "user_id and content are required" },
        { status: 400 }
      );
    }

    // Issue #8: Reject whitespace-only content
    if (typeof content === "string" && content.trim().length === 0) {
      return NextResponse.json(
        { error: "Message content cannot be empty or whitespace only" },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO messages (channel_id, user_id, content)
       VALUES ($1, $2, $3) RETURNING *`,
      [id, user_id, content]
    );
    // Return the message with user info
    const msg = await query(
      `SELECT m.*, u.username, u.avatar_color
       FROM messages m JOIN users u ON u.id = m.user_id
       WHERE m.id = $1`,
      [result.rows[0].id]
    );
    return NextResponse.json(msg.rows[0], { status: 201 });
  } catch (err) {
    // Issue #10: Handle FK violations (non-existent user_id or channel_id)
    if (isForeignKeyViolation(err)) {
      const detail = typeof err === "object" && err !== null && "detail" in err
        ? String((err as { detail: string }).detail)
        : "";
      if (detail.includes("user_id")) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
      if (detail.includes("channel_id")) {
        return NextResponse.json(
          { error: "Channel not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "Referenced entity not found" },
        { status: 400 }
      );
    }

    console.error("Failed to send message:", err);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

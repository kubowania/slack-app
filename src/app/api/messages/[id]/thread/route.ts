import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { parseValidInt, validateTextContent, MAX_LENGTHS } from "@/lib/validation";

/**
 * GET /api/messages/:id/thread
 *
 * Retrieves the parent message and all replies in a thread by looking up the
 * junction rows in the `threads` table that link the parent message to its
 * reply messages. Default LIMIT 100 on replies.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Issue 1: Validate message ID is a valid integer
  const messageId = parseValidInt(id);
  if (messageId === null) {
    return NextResponse.json(
      { error: "Message ID must be a valid integer" },
      { status: 400 },
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10) || 100, 200);
    const offset = parseInt(searchParams.get("offset") || "0", 10) || 0;

    /* Fetch the parent message with user metadata */
    const parentResult = await query(
      `SELECT m.id, m.channel_id, m.user_id, m.content, m.created_at,
              u.username, u.avatar_color
       FROM messages m
       JOIN users u ON u.id = m.user_id
       WHERE m.id = $1`,
      [messageId]
    );

    /* Fetch thread replies ordered chronologically with LIMIT */
    const repliesResult = await query(
      `SELECT m.id, m.channel_id, m.content, m.created_at, m.user_id,
              u.username, u.avatar_color
       FROM threads t
       JOIN messages m ON m.id = t.reply_message_id
       JOIN users u ON u.id = m.user_id
       WHERE t.parent_message_id = $1
       ORDER BY m.created_at ASC
       LIMIT $2 OFFSET $3`,
      [messageId, limit, offset]
    );

    return NextResponse.json({
      parent: parentResult.rows[0] ?? null,
      replies: repliesResult.rows,
    });
  } catch (err) {
    console.error("Failed to fetch thread replies:", err);
    return NextResponse.json(
      { error: "Failed to fetch thread replies" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/messages/:id/thread
 *
 * Adds a reply to a thread. Creates a message in the same channel as the parent
 * and links it via the threads table. Returns 400 for invalid JSON, missing fields.
 * Returns 404 if parent message not found.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Issue 1: Validate message ID
  const messageId = parseValidInt(id);
  if (messageId === null) {
    return NextResponse.json(
      { error: "Message ID must be a valid integer" },
      { status: 400 },
    );
  }

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

    // Issue 1: Validate user_id
    const parsedUserId = parseValidInt(user_id);
    if (parsedUserId === null) {
      return NextResponse.json(
        { error: "user_id must be a valid integer" },
        { status: 400 },
      );
    }

    // Issue 4 & 5: Validate content length and strip null bytes
    const validation = validateTextContent(content, "Content", MAX_LENGTHS.MESSAGE_CONTENT);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 },
      );
    }

    // Step 1: Look up parent message to get channel_id
    const parentResult = await query(
      `SELECT channel_id FROM messages WHERE id = $1`,
      [messageId]
    );
    if (parentResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Parent message not found" },
        { status: 404 }
      );
    }
    const { channel_id } = parentResult.rows[0];

    // Step 2: Insert reply message into messages table
    const insertResult = await query(
      `INSERT INTO messages (channel_id, user_id, content)
       VALUES ($1, $2, $3) RETURNING *`,
      [channel_id, parsedUserId, validation.sanitized]
    );

    // Step 3: Insert thread relationship (includes channel_id which is NOT NULL)
    await query(
      `INSERT INTO threads (parent_message_id, reply_message_id, channel_id)
       VALUES ($1, $2, $3)`,
      [messageId, insertResult.rows[0].id, channel_id]
    );

    // Step 4: Return enriched reply with user info
    const enrichedReply = await query(
      `SELECT m.id, m.content, m.created_at, m.user_id, u.username, u.avatar_color
       FROM messages m
       JOIN users u ON u.id = m.user_id
       WHERE m.id = $1`,
      [insertResult.rows[0].id]
    );

    return NextResponse.json(enrichedReply.rows[0], { status: 201 });
  } catch (err) {
    console.error("Failed to add thread reply:", err);
    return NextResponse.json(
      { error: "Failed to add thread reply" },
      { status: 500 }
    );
  }
}

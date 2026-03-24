import { NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * GET /api/messages/:id/thread
 *
 * Retrieves all replies in a thread by looking up the junction rows in the
 * `threads` table that link the parent message to its reply messages.
 *
 * Path parameter:
 *   - id: The parent message ID whose thread replies to fetch
 *
 * Returns:
 *   - 200: Array of reply messages with user metadata, ordered by created_at ASC
 *   - 500: Database or server error
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const result = await query(
      `SELECT m.id, m.content, m.created_at, m.user_id, u.username, u.avatar_color
       FROM threads t
       JOIN messages m ON m.id = t.reply_message_id
       JOIN users u ON u.id = m.user_id
       WHERE t.parent_message_id = $1
       ORDER BY m.created_at ASC`,
      [id]
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch thread replies:", err);
    return NextResponse.json(
      { error: "Failed to fetch thread replies" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { user_id, content } = await req.json();
    if (!content || !user_id) {
      return NextResponse.json(
        { error: "user_id and content are required" },
        { status: 400 }
      );
    }

    // Step 1: Look up parent message to get channel_id
    const parentResult = await query(
      `SELECT channel_id FROM messages WHERE id = $1`,
      [id]
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
      [channel_id, user_id, content]
    );

    // Step 3: Insert thread relationship (includes channel_id which is NOT NULL)
    await query(
      `INSERT INTO threads (parent_message_id, reply_message_id, channel_id)
       VALUES ($1, $2, $3)`,
      [id, insertResult.rows[0].id, channel_id]
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

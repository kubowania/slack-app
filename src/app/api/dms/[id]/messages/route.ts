import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { parseValidInt, validateTextContent, MAX_LENGTHS } from "@/lib/validation";

/**
 * GET /api/dms/:id/messages
 *
 * Fetches messages for a DM conversation with user info.
 * Default LIMIT 100 to prevent unbounded result sets (AAP requirement).
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Issue 1: Validate DM ID
  const dmId = parseValidInt(id);
  if (dmId === null) {
    return NextResponse.json(
      { error: "DM ID must be a valid integer" },
      { status: 400 },
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10) || 100, 200);
    const offset = parseInt(searchParams.get("offset") || "0", 10) || 0;

    const result = await query(
      `SELECT m.*, u.username, u.avatar_color
       FROM dm_messages m
       JOIN users u ON u.id = m.user_id
       WHERE m.dm_id = $1
       ORDER BY m.created_at ASC
       LIMIT $2 OFFSET $3`,
      [dmId, limit, offset]
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch DM messages:", err);
    return NextResponse.json(
      { error: "Failed to fetch DM messages" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dms/:id/messages
 *
 * Sends a message in a DM conversation. Returns 400 for invalid JSON or missing fields.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Issue 1: Validate DM ID
  const dmId = parseValidInt(id);
  if (dmId === null) {
    return NextResponse.json(
      { error: "DM ID must be a valid integer" },
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

    const result = await query(
      `INSERT INTO dm_messages (dm_id, user_id, content)
       VALUES ($1, $2, $3) RETURNING *`,
      [dmId, parsedUserId, validation.sanitized]
    );
    // Return the message with user info
    const msg = await query(
      `SELECT m.*, u.username, u.avatar_color
       FROM dm_messages m JOIN users u ON u.id = m.user_id
       WHERE m.id = $1`,
      [result.rows[0].id]
    );
    return NextResponse.json(msg.rows[0], { status: 201 });
  } catch (err) {
    console.error("Failed to send DM message:", err);
    return NextResponse.json(
      { error: "Failed to send DM message" },
      { status: 500 }
    );
  }
}

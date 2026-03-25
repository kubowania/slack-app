import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { parseValidInt } from "@/lib/validation";

/**
 * GET /api/channels/:id/pins
 *
 * Lists all pinned messages in a channel with message content and author info.
 * Default LIMIT 100 to prevent unbounded result sets (AAP requirement).
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Issue 1: Validate channel ID
  const channelId = parseValidInt(id);
  if (channelId === null) {
    return NextResponse.json(
      { error: "Channel ID must be a valid integer" },
      { status: 400 },
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10) || 100, 200);
    const offset = parseInt(searchParams.get("offset") || "0", 10) || 0;

    const result = await query(
      `SELECT p.*, m.content, m.created_at as message_created_at, u.username
       FROM pins p
       JOIN messages m ON m.id = p.message_id
       JOIN users u ON u.id = m.user_id
       WHERE p.channel_id = $1
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [channelId, limit, offset]
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch pinned messages:", err);
    return NextResponse.json(
      { error: "Failed to fetch pinned messages" },
      { status: 500 }
    );
  }
}

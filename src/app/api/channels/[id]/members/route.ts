import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { parseValidInt } from "@/lib/validation";

/**
 * GET /api/channels/:id/members
 *
 * Lists members of a channel with their roles, display names, and avatar info.
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
      `SELECT cm.*, u.username, u.avatar_color, us.display_name
       FROM channel_members cm
       JOIN users u ON u.id = cm.user_id
       LEFT JOIN user_statuses us ON us.user_id = u.id
       WHERE cm.channel_id = $1
       ORDER BY cm.joined_at ASC
       LIMIT $2 OFFSET $3`,
      [channelId, limit, offset]
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch channel members:", err);
    return NextResponse.json(
      { error: "Failed to fetch channel members" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/channels/:id/members
 *
 * Adds a user as a member of a channel.
 * Returns 400 for invalid JSON or missing user_id.
 */
export async function POST(
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
    let body: { user_id?: number; role?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { user_id, role } = body;
    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
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

    const result = await query(
      `INSERT INTO channel_members (channel_id, user_id, role)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [channelId, parsedUserId, role || "member"]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error("Failed to add channel member:", err);
    return NextResponse.json(
      { error: "Failed to add channel member" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/channels/:id/members
 *
 * Removes a user from a channel. Returns 404 if the member is not found.
 * Returns 400 for invalid JSON or missing user_id.
 */
export async function DELETE(
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
    let body: { user_id?: number };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { user_id } = body;
    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
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

    const result = await query(
      `DELETE FROM channel_members
       WHERE channel_id = $1 AND user_id = $2
       RETURNING *`,
      [channelId, parsedUserId]
    );
    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Member not found in channel" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to remove channel member:", err);
    return NextResponse.json(
      { error: "Failed to remove channel member" },
      { status: 500 }
    );
  }
}

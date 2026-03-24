import { NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * GET /api/messages/:id/reactions
 *
 * Lists all reactions on a specific message, grouped by emoji.
 * Each group contains the emoji, count of users who reacted, and
 * an array of user objects (id, username, avatar_color).
 *
 * @returns 200 - Array of grouped reaction objects
 * @returns 500 - Server error
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const result = await query(
      `SELECT r.emoji, u.id AS user_id, u.username, u.avatar_color
       FROM reactions r
       JOIN users u ON u.id = r.user_id
       WHERE r.message_id = $1
       ORDER BY r.emoji, r.created_at ASC`,
      [id]
    );

    const grouped: Record<
      string,
      {
        emoji: string;
        count: number;
        users: { id: number; username: string; avatar_color: string }[];
      }
    > = {};

    for (const row of result.rows) {
      if (!grouped[row.emoji]) {
        grouped[row.emoji] = { emoji: row.emoji, count: 0, users: [] };
      }
      grouped[row.emoji].count++;
      grouped[row.emoji].users.push({
        id: row.user_id,
        username: row.username,
        avatar_color: row.avatar_color,
      });
    }

    return NextResponse.json(Object.values(grouped));
  } catch (err) {
    console.error("Failed to fetch reactions:", err);
    return NextResponse.json(
      { error: "Failed to fetch reactions" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/messages/:id/reactions
 *
 * Adds a new emoji reaction to a specific message for a given user.
 *
 * @body { emoji: string, user_id: number }
 * @returns 201 - The created reaction record
 * @returns 400 - Missing required fields (emoji, user_id)
 * @returns 500 - Server error
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { emoji, user_id } = await req.json();

    if (!emoji || !user_id) {
      return NextResponse.json(
        { error: "emoji and user_id are required" },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO reactions (message_id, user_id, emoji)
       VALUES ($1, $2, $3) RETURNING *`,
      [id, user_id, emoji]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error("Failed to add reaction:", err);
    return NextResponse.json(
      { error: "Failed to add reaction" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/messages/:id/reactions
 *
 * Removes an emoji reaction from a specific message for a given user.
 * Identifies the reaction to remove by the combination of message_id,
 * user_id, and emoji.
 *
 * @body { emoji: string, user_id: number }
 * @returns 204 - Reaction successfully removed (no body)
 * @returns 400 - Missing required fields (emoji, user_id)
 * @returns 404 - Reaction not found for the given combination
 * @returns 500 - Server error
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { emoji, user_id } = await req.json();

    if (!emoji || !user_id) {
      return NextResponse.json(
        { error: "emoji and user_id are required" },
        { status: 400 }
      );
    }

    const result = await query(
      `DELETE FROM reactions
       WHERE message_id = $1 AND user_id = $2 AND emoji = $3`,
      [id, user_id, emoji]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Reaction not found" },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("Failed to remove reaction:", err);
    return NextResponse.json(
      { error: "Failed to remove reaction" },
      { status: 500 }
    );
  }
}

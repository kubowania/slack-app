import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { parseValidInt } from "@/lib/validation";

/**
 * GET /api/activity
 *
 * Returns the activity feed for a given user, combining mentions,
 * thread replies, and reactions into a single chronologically-ordered
 * result set. Each activity item includes a type discriminator, the
 * acting user's metadata, the source channel name, and a content preview.
 *
 * Query parameters:
 *   - user_id  (required) — the ID of the user whose activity to fetch
 *   - limit    (optional, default 50) — maximum number of items to return
 *   - offset   (optional, default 0)  — pagination offset
 *
 * Response: JSON array of activity items sorted by created_at DESC.
 *
 * Status codes:
 *   200 — Success (array may be empty)
 *   400 — Missing required user_id parameter
 *   500 — Internal server error
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user_id");
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  if (!userId) {
    return NextResponse.json(
      { error: "user_id is required" },
      { status: 400 }
    );
  }

  // Issue 1: Use strict integer validation (rejects floats, overflow, non-numeric)
  const parsedUserId = parseValidInt(userId);

  if (parsedUserId === null) {
    return NextResponse.json(
      { error: "user_id must be a valid integer" },
      { status: 400 }
    );
  }

  if (isNaN(limit) || limit < 1) {
    return NextResponse.json(
      { error: "limit must be a positive integer" },
      { status: 400 }
    );
  }

  if (isNaN(offset) || offset < 0) {
    return NextResponse.json(
      { error: "offset must be a non-negative integer" },
      { status: 400 }
    );
  }

  try {
    const result = await query(
      `SELECT * FROM (
        -- Mentions: messages where this user was mentioned
        SELECT
          m.id AS id,
          'mention' AS type,
          m.message_id AS message_id,
          msg.user_id AS acting_user_id,
          msg.channel_id AS channel_id,
          m.created_at AS created_at,
          LEFT(msg.content, 100) AS content_preview,
          u.username AS username,
          u.avatar_color AS avatar_color,
          c.name AS channel_name
        FROM mentions m
        JOIN messages msg ON msg.id = m.message_id
        JOIN users u ON u.id = msg.user_id
        JOIN channels c ON c.id = msg.channel_id
        WHERE m.mentioned_user_id = $1

        UNION ALL

        -- Thread replies: messages that are reply_message_id entries in threads
        -- whose parent message was authored by the target user
        SELECT
          msg.id AS id,
          'thread_reply' AS type,
          msg.id AS message_id,
          msg.user_id AS acting_user_id,
          msg.channel_id AS channel_id,
          msg.created_at AS created_at,
          LEFT(msg.content, 100) AS content_preview,
          u.username AS username,
          u.avatar_color AS avatar_color,
          c.name AS channel_name
        FROM threads t
        JOIN messages msg ON msg.id = t.reply_message_id
        JOIN messages parent ON parent.id = t.parent_message_id
        JOIN users u ON u.id = msg.user_id
        JOIN channels c ON c.id = msg.channel_id
        WHERE parent.user_id = $1
          AND msg.user_id != $1

        UNION ALL

        -- Reactions: reactions on this user's messages by other users
        SELECT
          r.id AS id,
          'reaction' AS type,
          r.message_id AS message_id,
          r.user_id AS acting_user_id,
          msg.channel_id AS channel_id,
          r.created_at AS created_at,
          CONCAT(r.emoji, ' on: ', LEFT(msg.content, 80)) AS content_preview,
          u.username AS username,
          u.avatar_color AS avatar_color,
          c.name AS channel_name
        FROM reactions r
        JOIN messages msg ON msg.id = r.message_id
        JOIN users u ON u.id = r.user_id
        JOIN channels c ON c.id = msg.channel_id
        WHERE msg.user_id = $1 AND r.user_id != $1
      ) AS activity
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3`,
      [parsedUserId, limit, offset]
    );

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch activity:", err);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { parseValidInt } from "@/lib/validation";

/**
 * GET /api/saved
 *
 * Retrieves all saved/bookmarked items for a specific user.
 * Joins with messages, files, and channels tables to provide
 * enriched context (message content, file name, source channel).
 * Default LIMIT 100 to prevent unbounded result sets (AAP requirement).
 *
 * Query Parameters:
 *   - user_id (required): The ID of the user whose saved items to fetch
 *   - limit (optional, default 100): Max items to return (max 200)
 *   - offset (optional, default 0): Pagination offset
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");

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

    const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10) || 100, 200);
    const offset = parseInt(searchParams.get("offset") || "0", 10) || 0;

    const result = await query(
      `SELECT si.*,
              m.content AS message_content,
              m.created_at AS message_created_at,
              u.username AS message_username,
              u.avatar_color AS message_avatar_color,
              f.name AS file_name,
              f.file_type AS file_type,
              f.file_size AS file_size,
              c.name AS source_channel
       FROM saved_items si
       LEFT JOIN messages m ON m.id = si.message_id
       LEFT JOIN users u ON u.id = m.user_id
       LEFT JOIN files f ON f.id = si.file_id
       LEFT JOIN channels c ON c.id = COALESCE(m.channel_id, f.channel_id)
       WHERE si.user_id = $1
       ORDER BY si.saved_at DESC
       LIMIT $2 OFFSET $3`,
      [parsedUserId, limit, offset]
    );

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch saved items:", err);
    return NextResponse.json(
      { error: "Failed to fetch saved items" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/saved
 *
 * Saves/bookmarks a message or file for a user.
 * At least one of message_id or file_id must be provided.
 * Returns 400 for invalid JSON or missing fields.
 */
export async function POST(req: Request) {
  try {
    let body: { user_id?: number; message_id?: number; file_id?: number };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { user_id, message_id, file_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    // Issue 1: Validate all numeric IDs
    const parsedUserId = parseValidInt(user_id);
    if (parsedUserId === null) {
      return NextResponse.json(
        { error: "user_id must be a valid integer" },
        { status: 400 },
      );
    }

    if (!message_id && !file_id) {
      return NextResponse.json(
        { error: "message_id or file_id is required" },
        { status: 400 }
      );
    }

    let parsedMessageId: number | null = null;
    if (message_id) {
      parsedMessageId = parseValidInt(message_id);
      if (parsedMessageId === null) {
        return NextResponse.json(
          { error: "message_id must be a valid integer" },
          { status: 400 },
        );
      }
    }

    let parsedFileId: number | null = null;
    if (file_id) {
      parsedFileId = parseValidInt(file_id);
      if (parsedFileId === null) {
        return NextResponse.json(
          { error: "file_id must be a valid integer" },
          { status: 400 },
        );
      }
    }

    const result = await query(
      "INSERT INTO saved_items (user_id, message_id, file_id) VALUES ($1, $2, $3) RETURNING *",
      [parsedUserId, parsedMessageId, parsedFileId]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error("Failed to save item:", err);
    return NextResponse.json(
      { error: "Failed to save item" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/saved
 *
 * Removes a saved/bookmarked item by its ID.
 *
 * Query Parameters:
 *   - id (required): The ID of the saved item to remove
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Saved item ID is required" },
        { status: 400 }
      );
    }

    // Issue 1: Validate saved item ID
    const parsedId = parseValidInt(id);
    if (parsedId === null) {
      return NextResponse.json(
        { error: "Saved item ID must be a valid integer" },
        { status: 400 },
      );
    }

    const result = await query(
      "DELETE FROM saved_items WHERE id = $1 RETURNING id",
      [parsedId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Saved item not found" },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("Failed to delete saved item:", err);
    return NextResponse.json(
      { error: "Failed to delete saved item" },
      { status: 500 }
    );
  }
}

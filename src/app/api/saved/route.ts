import { NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * GET /api/saved
 *
 * Retrieves all saved/bookmarked items for a specific user.
 * Joins with messages, files, and channels tables to provide
 * enriched context (message content, file name, source channel).
 *
 * Query Parameters:
 *   - user_id (required): The ID of the user whose saved items to fetch
 *
 * Returns:
 *   - 200: Array of saved items with enriched data
 *   - 400: Missing user_id parameter
 *   - 500: Database or server error
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

    const result = await query(
      `SELECT si.*, m.content as message_content, f.name as file_name, c.name as source_channel
       FROM saved_items si
       LEFT JOIN messages m ON m.id = si.message_id
       LEFT JOIN files f ON f.id = si.file_id
       LEFT JOIN channels c ON c.id = COALESCE(m.channel_id, f.channel_id)
       WHERE si.user_id = $1
       ORDER BY si.saved_at DESC`,
      [user_id]
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
 *
 * Request Body (JSON):
 *   - user_id (required): The ID of the user saving the item
 *   - message_id (optional): The ID of the message to save
 *   - file_id (optional): The ID of the file to save
 *
 * Returns:
 *   - 201: The newly created saved item record
 *   - 400: Missing user_id or both message_id and file_id
 *   - 500: Database or server error
 */
export async function POST(req: Request) {
  try {
    const { user_id, message_id, file_id } = await req.json();

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    if (!message_id && !file_id) {
      return NextResponse.json(
        { error: "message_id or file_id is required" },
        { status: 400 }
      );
    }

    const result = await query(
      "INSERT INTO saved_items (user_id, message_id, file_id) VALUES ($1, $2, $3) RETURNING *",
      [user_id, message_id || null, file_id || null]
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
 *
 * Returns:
 *   - 200: The deleted saved item record
 *   - 400: Missing id parameter
 *   - 404: Saved item not found
 *   - 500: Database or server error
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

    const result = await query(
      "DELETE FROM saved_items WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Saved item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error("Failed to delete saved item:", err);
    return NextResponse.json(
      { error: "Failed to delete saved item" },
      { status: 500 }
    );
  }
}

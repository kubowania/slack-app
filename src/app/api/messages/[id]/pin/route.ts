import { NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * POST /api/messages/:id/pin
 *
 * Pins a message to its channel. Requires `user_id` in the request body
 * to record which user pinned the message. Looks up the message to
 * determine its channel, then creates a pin record.
 *
 * Request body: { user_id: number }
 * Success response (201): Pin record { id, message_id, channel_id, pinned_by, created_at }
 * Error responses: 400 (missing user_id), 404 (message not found), 500 (server error)
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    // Look up the message to get its channel_id
    const result = await query(
      "SELECT channel_id FROM messages WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    const { channel_id } = result.rows[0];

    // Insert the pin record linking message, channel, and pinning user
    const pinResult = await query(
      "INSERT INTO pins (message_id, channel_id, pinned_by) VALUES ($1, $2, $3) RETURNING *",
      [id, channel_id, user_id]
    );

    return NextResponse.json(pinResult.rows[0], { status: 201 });
  } catch (err) {
    console.error("Failed to pin message:", err);
    return NextResponse.json(
      { error: "Failed to pin message" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/messages/:id/pin
 *
 * Unpins a message by removing its pin record. Uses RETURNING * to
 * verify a pin existed before deletion. Returns 204 No Content on
 * success or 404 if the message was not pinned.
 *
 * Success response (204): No body
 * Error responses: 404 (pin not found), 500 (server error)
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Delete pin record for this message, using RETURNING to verify existence
    const result = await query(
      "DELETE FROM pins WHERE message_id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Pin not found" },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("Failed to unpin message:", err);
    return NextResponse.json(
      { error: "Failed to unpin message" },
      { status: 500 }
    );
  }
}

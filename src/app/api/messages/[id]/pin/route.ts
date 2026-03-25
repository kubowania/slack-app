import { NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * Helper to detect PostgreSQL unique constraint violations.
 * Error code 23505 indicates a UNIQUE or PRIMARY KEY constraint failure.
 */
function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "23505"
  );
}

/**
 * POST /api/messages/:id/pin
 *
 * Pins a message to its channel. Requires `user_id` in the request body
 * to record which user pinned the message. Looks up the message to
 * determine its channel, then creates a pin record.
 *
 * A message can only be pinned once. Attempting to pin an already-pinned
 * message returns 409 Conflict.
 *
 * Request body: { user_id: number }
 * Success response (201): Pin record { id, message_id, channel_id, pinned_by, created_at }
 * Error responses: 400 (missing user_id), 404 (message not found), 409 (already pinned), 500 (server error)
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    // Insert the pin record — UNIQUE constraint on message_id prevents duplicates
    const pinResult = await query(
      "INSERT INTO pins (message_id, channel_id, pinned_by) VALUES ($1, $2, $3) RETURNING *",
      [id, channel_id, user_id]
    );

    return NextResponse.json(pinResult.rows[0], { status: 201 });
  } catch (err) {
    // Handle duplicate pin attempt: UNIQUE constraint on (message_id) triggers code 23505
    if (isUniqueViolation(err)) {
      return NextResponse.json(
        { error: "Message is already pinned" },
        { status: 409 }
      );
    }

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

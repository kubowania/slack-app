import { NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * Helper to detect PostgreSQL foreign key constraint violations.
 * Error code 23503 indicates a FK constraint failure.
 */
function isForeignKeyViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "23503"
  );
}

/**
 * GET /api/users/:id/status
 *
 * Retrieves the current status (emoji, text, expiry) for a user.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const result = await query(
      "SELECT * FROM user_statuses WHERE user_id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Status not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error("Failed to fetch user status:", err);
    return NextResponse.json(
      { error: "Failed to fetch user status" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/:id/status
 *
 * Creates or updates user status via UPSERT.
 * Returns 400 for invalid JSON or missing required fields.
 * Returns 404 if the user_id doesn't reference a valid user (FK violation).
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    let body: { emoji?: string; text?: string; expiry?: string | null };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { emoji, text, expiry } = body;
    if (!emoji || !text) {
      return NextResponse.json(
        { error: "emoji and text are required" },
        { status: 400 }
      );
    }
    const result = await query(
      `INSERT INTO user_statuses (user_id, status_emoji, status_text, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE
       SET status_emoji = EXCLUDED.status_emoji,
           status_text = EXCLUDED.status_text,
           expires_at = EXCLUDED.expires_at,
           updated_at = NOW()
       RETURNING *`,
      [id, emoji, text, expiry || null]
    );
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    // Issue #10: Handle FK violations — non-existent user_id
    if (isForeignKeyViolation(err)) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    console.error("Failed to update user status:", err);
    return NextResponse.json(
      { error: "Failed to update user status" },
      { status: 500 }
    );
  }
}

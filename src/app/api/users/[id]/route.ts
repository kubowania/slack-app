import { NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * GET /api/users/:id
 *
 * Returns a single user's full profile including status information.
 * Performs a LEFT JOIN to the `user_statuses` table so that users
 * without a status record still return successfully (status fields will be null).
 *
 * Response fields:
 *   - id, username, avatar_color, created_at  (from users table)
 *   - status_emoji, status_text, display_name, title, timezone, email, phone
 *     (from user_statuses table — nullable when no status record exists)
 *
 * Status codes:
 *   200 — User found, profile returned
 *   404 — No user with the given id exists
 *   500 — Database or unexpected server error
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const result = await query(
      `SELECT u.id, u.username, u.avatar_color, u.created_at,
              us.status_emoji, us.status_text,
              us.display_name, us.title, us.timezone, us.email, us.phone
       FROM users u
       LEFT JOIN user_statuses us ON us.user_id = u.id
       WHERE u.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error("Failed to fetch user:", err);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

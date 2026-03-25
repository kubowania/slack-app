import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { sanitizeText, hasJsonContentType, MAX_LENGTHS } from "@/lib/validation";

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
 * GET /api/users
 *
 * Returns all users sorted by username, with extended fields from user_statuses.
 * Includes a default LIMIT of 100 for unbounded result protection (AAP requirement).
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10) || 100, 200);
    const offset = parseInt(searchParams.get("offset") || "0", 10) || 0;

    const result = await query(
      `SELECT u.*, us.status_emoji, us.status_text, us.display_name, us.title
       FROM users u
       LEFT JOIN user_statuses us ON us.user_id = u.id
       ORDER BY u.username
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch users:", err);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 *
 * Creates a new user with a username and optional avatar color.
 * Returns 409 Conflict if the username already exists (UNIQUE constraint on users.username).
 * Returns 400 if the request body is not valid JSON.
 */
export async function POST(req: Request) {
  // Info 5: Enforce JSON Content-Type on POST requests
  if (!hasJsonContentType(req)) {
    return NextResponse.json(
      { error: "Content-Type must be application/json" },
      { status: 415 },
    );
  }

  try {
    let body: { username?: string; avatar_color?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { username, avatar_color } = body;
    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Info 3: Strip RTL override, zero-width, and bidirectional control
    // characters from usernames to prevent visual spoofing.
    // Issue 5: Strip null bytes to prevent PostgreSQL TEXT rejection → 500.
    const safeUsername = sanitizeText(username);

    // Issue 6: Validate username length before hitting DB VARCHAR(50) constraint.
    if (safeUsername.length > MAX_LENGTHS.USERNAME) {
      return NextResponse.json(
        {
          error: `Username exceeds maximum length of ${MAX_LENGTHS.USERNAME} characters`,
        },
        { status: 400 },
      );
    }

    // Reject empty username after sanitization
    if (safeUsername.trim().length === 0) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 },
      );
    }

    const result = await query(
      "INSERT INTO users (username, avatar_color) VALUES ($1, $2) RETURNING *",
      [safeUsername, avatar_color || "#6B7280"]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    // Handle duplicate username: UNIQUE constraint on users.username triggers code 23505
    if (isUniqueViolation(err)) {
      return NextResponse.json(
        { error: "A user with this username already exists" },
        { status: 409 }
      );
    }

    console.error("Failed to create user:", err);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

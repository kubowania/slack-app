import { NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * GET /api/preferences?user_id=<id>
 *
 * Fetches user preferences for the given user_id.
 * Returns a default preferences object if no record exists for the user.
 *
 * Query Parameters:
 *   - user_id (required): The numeric ID of the user whose preferences to fetch
 *
 * Responses:
 *   - 200: Preferences object (from DB or defaults)
 *   - 400: { error: "user_id is required" }
 *   - 500: { error: "Failed to fetch preferences" }
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    const result = await query(
      "SELECT * FROM user_preferences WHERE user_id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({
        user_id: parseInt(userId),
        notification_sound: true,
        notification_desktop: true,
        sidebar_sort: "alpha",
        theme: "light",
        language: "en",
        timezone: "UTC",
      });
    }

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error("Failed to fetch preferences:", err);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/preferences
 *
 * Upserts user preferences. If a record already exists for the given user_id
 * it is updated; otherwise a new record is inserted.
 *
 * Request Body (JSON):
 *   - user_id (required): The numeric ID of the user
 *   - notification_sound (optional, default true): Enable notification sounds
 *   - notification_desktop (optional, default true): Enable desktop notifications
 *   - sidebar_sort (optional, default "alpha"): Sidebar sort order ("alpha" | "recent")
 *   - theme (optional, default "light"): UI theme ("light" | "dark")
 *   - language (optional, default "en"): Language code
 *   - timezone (optional, default "UTC"): IANA timezone string
 *
 * Responses:
 *   - 200: The upserted preferences row
 *   - 400: { error: "user_id is required" }
 *   - 500: { error: "Failed to update preferences" }
 */
export async function PUT(req: Request) {
  try {
    const {
      user_id,
      notification_sound,
      notification_desktop,
      sidebar_sort,
      theme,
      language,
      timezone,
    } = await req.json();

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO user_preferences (user_id, notification_sound, notification_desktop, sidebar_sort, theme, language, timezone, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (user_id) DO UPDATE
       SET notification_sound = $2,
           notification_desktop = $3,
           sidebar_sort = $4,
           theme = $5,
           language = $6,
           timezone = $7,
           updated_at = NOW()
       RETURNING *`,
      [
        user_id,
        notification_sound ?? true,
        notification_desktop ?? true,
        sidebar_sort || "alpha",
        theme || "light",
        language || "en",
        timezone || "UTC",
      ]
    );

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error("Failed to update preferences:", err);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}

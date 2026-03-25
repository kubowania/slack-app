import { NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * GET /api/preferences?user_id=<id>
 *
 * Fetches user preferences for the given user_id.
 * Returns a default preferences object if no record exists for the user.
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
 * Returns 400 for invalid JSON or missing user_id.
 */
export async function PUT(req: Request) {
  try {
    let body: {
      user_id?: number;
      notification_sound?: boolean;
      notification_desktop?: boolean;
      sidebar_sort?: string;
      theme?: string;
      language?: string;
      timezone?: string;
    };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const {
      user_id,
      notification_sound,
      notification_desktop,
      sidebar_sort,
      theme,
      language,
      timezone,
    } = body;

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

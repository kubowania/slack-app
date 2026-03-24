import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/users/[id]/status — Retrieve user status (emoji, text, expiry)
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

// PUT /api/users/[id]/status — Create or update user status via UPSERT
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { emoji, text, expiry } = await req.json();
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
    console.error("Failed to update user status:", err);
    return NextResponse.json(
      { error: "Failed to update user status" },
      { status: 500 }
    );
  }
}

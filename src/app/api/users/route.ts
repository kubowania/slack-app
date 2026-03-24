import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query(
      `SELECT u.*, us.emoji as status_emoji, us.text as status_text, us.display_name, us.title
       FROM users u
       LEFT JOIN user_statuses us ON us.user_id = u.id
       ORDER BY u.username`
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

export async function POST(req: Request) {
  try {
    const { username, avatar_color } = await req.json();
    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }
    const result = await query(
      "INSERT INTO users (username, avatar_color) VALUES ($1, $2) RETURNING *",
      [username, avatar_color || "#6B7280"]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error("Failed to create user:", err);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query(
      `SELECT c.*, u.username as creator_name
       FROM channels c
       LEFT JOIN users u ON u.id = c.created_by
       ORDER BY c.name`
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch channels:", err);
    return NextResponse.json(
      { error: "Failed to fetch channels" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { name, description, created_by } = await req.json();
    if (!name) {
      return NextResponse.json(
        { error: "Channel name is required" },
        { status: 400 }
      );
    }
    const result = await query(
      "INSERT INTO channels (name, description, created_by) VALUES ($1, $2, $3) RETURNING *",
      [name.toLowerCase().replace(/\s+/g, "-"), description || "", created_by]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error("Failed to create channel:", err);
    return NextResponse.json(
      { error: "Failed to create channel" },
      { status: 500 }
    );
  }
}

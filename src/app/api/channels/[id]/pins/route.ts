import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const result = await query(
      `SELECT p.*, m.content, m.created_at as message_created_at, u.username
       FROM pins p
       JOIN messages m ON m.id = p.message_id
       JOIN users u ON u.id = m.user_id
       WHERE p.channel_id = $1
       ORDER BY p.created_at DESC`,
      [id]
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch pinned messages:", err);
    return NextResponse.json(
      { error: "Failed to fetch pinned messages" },
      { status: 500 }
    );
  }
}

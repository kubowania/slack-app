import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const result = await query(
      `SELECT f.*, u.username
       FROM files f
       JOIN users u ON u.id = f.uploaded_by
       WHERE f.channel_id = $1
       ORDER BY f.created_at DESC`,
      [id]
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch channel files:", err);
    return NextResponse.json(
      { error: "Failed to fetch channel files" },
      { status: 500 }
    );
  }
}

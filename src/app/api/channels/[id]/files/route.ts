import { NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * GET /api/channels/:id/files
 *
 * Lists all files shared in a specific channel with uploader info.
 * Default LIMIT 100 to prevent unbounded result sets (AAP requirement).
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10) || 100, 200);
    const offset = parseInt(searchParams.get("offset") || "0", 10) || 0;

    const result = await query(
      `SELECT f.*, u.username
       FROM files f
       JOIN users u ON u.id = f.uploaded_by
       WHERE f.channel_id = $1
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
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

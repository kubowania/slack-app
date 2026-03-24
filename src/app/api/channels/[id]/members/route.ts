import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const result = await query(
      `SELECT cm.*, u.username, u.avatar_color, u.display_name
       FROM channel_members cm
       JOIN users u ON u.id = cm.user_id
       WHERE cm.channel_id = $1
       ORDER BY cm.joined_at ASC`,
      [id]
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch channel members:", err);
    return NextResponse.json(
      { error: "Failed to fetch channel members" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { user_id, role } = await req.json();
    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }
    const result = await query(
      `INSERT INTO channel_members (channel_id, user_id, role)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, user_id, role || "member"]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error("Failed to add channel member:", err);
    return NextResponse.json(
      { error: "Failed to add channel member" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { user_id } = await req.json();
    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }
    await query(
      `DELETE FROM channel_members
       WHERE channel_id = $1 AND user_id = $2`,
      [id, user_id]
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to remove channel member:", err);
    return NextResponse.json(
      { error: "Failed to remove channel member" },
      { status: 500 }
    );
  }
}

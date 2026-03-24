import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const result = await query(
      `SELECT m.*, u.username, u.avatar_color,
        (SELECT COUNT(*)::int FROM threads t WHERE t.parent_message_id = m.id) as thread_reply_count,
        EXISTS(SELECT 1 FROM pins p WHERE p.message_id = m.id) as is_pinned,
        COALESCE(
          (SELECT json_agg(json_build_object('emoji', r.emoji, 'count', r.cnt, 'user_ids', r.uids))
            FROM (SELECT emoji, COUNT(*) as cnt, array_agg(user_id) as uids FROM reactions WHERE message_id = m.id GROUP BY emoji) r),
          '[]'
        ) as reaction_summary
      FROM messages m
      JOIN users u ON u.id = m.user_id
      WHERE m.channel_id = $1
      ORDER BY m.created_at ASC`,
      [id]
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch messages:", err);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
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
    const { user_id, content } = await req.json();
    if (!content || !user_id) {
      return NextResponse.json(
        { error: "user_id and content are required" },
        { status: 400 }
      );
    }
    const result = await query(
      `INSERT INTO messages (channel_id, user_id, content)
       VALUES ($1, $2, $3) RETURNING *`,
      [id, user_id, content]
    );
    // Return the message with user info
    const msg = await query(
      `SELECT m.*, u.username, u.avatar_color
       FROM messages m JOIN users u ON u.id = m.user_id
       WHERE m.id = $1`,
      [result.rows[0].id]
    );
    return NextResponse.json(msg.rows[0], { status: 201 });
  } catch (err) {
    console.error("Failed to send message:", err);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

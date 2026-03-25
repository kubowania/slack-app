import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query(
      `SELECT w.*, (SELECT COUNT(*)::int FROM users) as member_count FROM workspace w LIMIT 1`
    );

    if (result.rows.length === 0) {
      return NextResponse.json({
        id: 0,
        name: "Slack Workspace",
        icon_url: null,
        member_count: 0,
        plan: "free",
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error("Failed to fetch workspace:", err);
    return NextResponse.json(
      { error: "Failed to fetch workspace" },
      { status: 500 }
    );
  }
}

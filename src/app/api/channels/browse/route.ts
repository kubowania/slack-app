import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * GET /api/channels/browse
 *
 * Paginated, searchable channel listing endpoint for the "Browse Channels" UI.
 * Separate from the base /api/channels endpoint to preserve backward compatibility.
 *
 * Query parameters:
 *   - page   (number, default 1)   — 1-based page index
 *   - limit  (number, default 20)  — results per page
 *   - search (string, optional)    — case-insensitive substring filter on channel name
 *
 * Response: JSON array of channel objects with creator_name and member_count.
 */
export async function GET(request: NextRequest) {
  try {
    // Parse pagination parameters with sensible defaults
    const pageParam = request.nextUrl.searchParams.get("page");
    const limitParam = request.nextUrl.searchParams.get("limit");
    const searchParam = request.nextUrl.searchParams.get("search");

    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    // Guard against invalid numeric values
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 20;

    const offset = (safePage - 1) * safeLimit;

    // Build ILIKE search pattern — "%" matches everything when no search term provided
    const searchPattern =
      searchParam && searchParam.trim().length > 0
        ? `%${searchParam.trim()}%`
        : "%";

    const result = await query(
      `SELECT c.*, u.username as creator_name,
        (SELECT COUNT(*) FROM channel_members cm WHERE cm.channel_id = c.id) as member_count
       FROM channels c
       LEFT JOIN users u ON u.id = c.created_by
       WHERE c.name ILIKE $1
       ORDER BY c.name
       LIMIT $2 OFFSET $3`,
      [searchPattern, safeLimit, offset]
    );

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("Failed to browse channels:", err);
    return NextResponse.json(
      { error: "Failed to browse channels" },
      { status: 500 }
    );
  }
}

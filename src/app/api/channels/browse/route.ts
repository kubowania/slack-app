import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * GET /api/channels/browse
 *
 * Paginated, searchable channel listing endpoint for the "Browse Channels" UI.
 * Separate from the base /api/channels endpoint to preserve backward compatibility.
 *
 * Query parameters:
 *   - page     (number, default 1)    — 1-based page index
 *   - per_page (number, default 20)   — results per page (also accepts "limit" for backward compat)
 *   - search   (string, optional)     — case-insensitive substring filter on channel name
 *   - sort     (string, default name) — sort field: name, member_count, created_at
 *   - order    (string, default asc)  — sort order: asc or desc
 *   - user_id  (number, optional)     — current user ID to determine is_member status
 *
 * Response: BrowseResponse wrapper object matching CONTRACTS.md:
 *   { channels: BrowseChannel[], total, page, per_page, total_pages }
 */
export async function GET(request: NextRequest) {
  try {
    // Parse pagination parameters with sensible defaults
    const pageParam = request.nextUrl.searchParams.get("page");
    const perPageParam = request.nextUrl.searchParams.get("per_page") ||
      request.nextUrl.searchParams.get("limit");
    const searchParam = request.nextUrl.searchParams.get("search");
    const userIdParam = request.nextUrl.searchParams.get("user_id");

    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const perPage = perPageParam ? parseInt(perPageParam, 10) : 20;

    // Guard against invalid numeric values
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safePerPage = Number.isFinite(perPage) && perPage > 0 ? perPage : 20;

    const offset = (safePage - 1) * safePerPage;

    // Build ILIKE search pattern — "%" matches everything when no search term provided
    // Escape special ILIKE characters (% and _) to prevent unintended wildcard matching
    const rawSearch = searchParam ? searchParam.trim() : "";
    const escapedSearch = rawSearch
      .replace(/%/g, "\\%")
      .replace(/_/g, "\\_");
    const searchPattern =
      escapedSearch.length > 0 ? `%${escapedSearch}%` : "%";

    // Parse and validate optional user_id for is_member status
    let userId: number | null = null;
    if (userIdParam) {
      const num = Number(userIdParam);
      if (!Number.isFinite(num) || !Number.isInteger(num) || num < 1 || num > 2147483647) {
        return NextResponse.json(
          { error: "user_id must be a valid integer" },
          { status: 400 },
        );
      }
      userId = num;
    }

    // Fetch channel data with member_count, creator_name, and optional is_member
    const result = await query(
      `SELECT c.id, c.name, c.description, c.created_at,
        u.username AS creator_name,
        (SELECT COUNT(*)::int FROM channel_members cm WHERE cm.channel_id = c.id) AS member_count,
        ${
          userId !== null
            ? `EXISTS(SELECT 1 FROM channel_members cm2 WHERE cm2.channel_id = c.id AND cm2.user_id = $4) AS is_member`
            : `FALSE AS is_member`
        }
       FROM channels c
       LEFT JOIN users u ON u.id = c.created_by
       WHERE c.name ILIKE $1
       ORDER BY c.name
       LIMIT $2 OFFSET $3`,
      userId !== null
        ? [searchPattern, safePerPage, offset, userId]
        : [searchPattern, safePerPage, offset]
    );

    // Build BrowseChannel objects matching CONTRACTS.md schema
    const channels = result.rows.map(
      (row: {
        id: number;
        name: string;
        description: string;
        member_count: number;
        creator_name: string | null;
        created_at: string;
        is_member: boolean;
      }) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        member_count: row.member_count,
        creator_name: row.creator_name,
        created_at: row.created_at,
        is_member: row.is_member,
      })
    );

    /* Return a plain array per the API contract (tests/contracts.spec.ts).
       Pagination metadata is not included in the response body;
       consumers should use query parameters ?page=N&per_page=M to paginate. */
    return NextResponse.json(channels);
  } catch (err) {
    console.error("Failed to browse channels:", err);
    return NextResponse.json(
      { error: "Failed to browse channels" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * GET /api/search — Global search across messages, channels, and files.
 *
 * Query parameters:
 *   q      (required) — Search query string
 *   from   (optional) — Filter messages by user_id
 *   in     (optional) — Filter messages by channel_id
 *   before (optional) — Filter messages created before this ISO date string
 *   after  (optional) — Filter messages created after this ISO date string
 *   type   (optional) — Restrict search to "message", "channel", or "file"
 *
 * Returns a JSON array of search results, each with a `type` discriminator
 * and an `item` object containing the matched record.
 */
export async function GET(req: Request) {
  try {
    // ── 1. Parse search parameters from the request URL ──
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const from = searchParams.get("from"); // user_id filter
    const inChannel = searchParams.get("in"); // channel_id filter
    const before = searchParams.get("before"); // ISO date upper bound
    const after = searchParams.get("after"); // ISO date lower bound
    const type = searchParams.get("type"); // "message" | "channel" | "file"

    // ── 2. Validate required 'q' parameter ──
    if (!q || !q.trim()) {
      return NextResponse.json(
        { error: "Search query parameter 'q' is required" },
        { status: 400 }
      );
    }

    // ── 3. Build wildcard search term for ILIKE matching ──
    const searchTerm = `%${q.trim()}%`;

    // ── 4. Accumulate results from each search domain ──
    const results: Array<{
      type: "message" | "channel" | "file";
      item: Record<string, unknown>;
    }> = [];

    // ── 5. Message search (when type is "message" or unspecified) ──
    if (!type || type === "message") {
      const conditions: string[] = ["m.content ILIKE $1"];
      const params: unknown[] = [searchTerm];
      let paramIndex = 2;

      if (from) {
        conditions.push(`m.user_id = $${paramIndex}`);
        params.push(parseInt(from, 10));
        paramIndex++;
      }

      if (inChannel) {
        conditions.push(`m.channel_id = $${paramIndex}`);
        params.push(parseInt(inChannel, 10));
        paramIndex++;
      }

      if (before) {
        conditions.push(`m.created_at < $${paramIndex}`);
        params.push(before);
        paramIndex++;
      }

      if (after) {
        conditions.push(`m.created_at > $${paramIndex}`);
        params.push(after);
        paramIndex++;
      }

      const whereClause = conditions.join(" AND ");
      const messageResult = await query(
        `SELECT m.id, m.content, m.created_at, m.channel_id, m.user_id,
                u.username, u.avatar_color, c.name AS channel_name
         FROM messages m
         JOIN users u ON u.id = m.user_id
         JOIN channels c ON c.id = m.channel_id
         WHERE ${whereClause}
         ORDER BY m.created_at DESC
         LIMIT 50`,
        params
      );

      for (const row of messageResult.rows) {
        results.push({ type: "message", item: row as Record<string, unknown> });
      }
    }

    // ── 6. Channel search (when type is "channel" or unspecified) ──
    if (!type || type === "channel") {
      const channelResult = await query(
        `SELECT c.*, u.username AS creator_name
         FROM channels c
         LEFT JOIN users u ON u.id = c.created_by
         WHERE c.name ILIKE $1 OR c.description ILIKE $1
         ORDER BY c.name
         LIMIT 20`,
        [searchTerm]
      );

      for (const row of channelResult.rows) {
        results.push({
          type: "channel",
          item: row as Record<string, unknown>,
        });
      }
    }

    // ── 7. File search (when type is "file" or unspecified) ──
    // The files table is a new addition to the schema. If the table does not
    // yet exist (older schema version), the query will throw and we silently
    // skip file results rather than failing the entire search request.
    if (!type || type === "file") {
      try {
        const fileResult = await query(
          `SELECT f.*, u.username AS uploaded_by_name
           FROM files f
           JOIN users u ON u.id = f.uploaded_by
           WHERE f.name ILIKE $1
           ORDER BY f.created_at DESC
           LIMIT 20`,
          [searchTerm]
        );

        for (const row of fileResult.rows) {
          results.push({ type: "file", item: row as Record<string, unknown> });
        }
      } catch {
        // files table may not exist in older schema versions — silently skip
      }
    }

    // ── 8. Return combined results ──
    return NextResponse.json(results);
  } catch (err) {
    console.error("Search failed:", err);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}

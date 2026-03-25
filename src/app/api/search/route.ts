import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { escapeILike } from "@/lib/validation";

/**
 * GET /api/search — Global search across messages, channels, and files.
 *
 * Query parameters:
 *   q      (required)  — Search query string
 *   from   (optional)  — Filter messages by user_id
 *   in     (optional)  — Filter messages by channel_id
 *   before (optional)  — Filter messages created before this ISO date string
 *   after  (optional)  — Filter messages created after this ISO date string
 *   type   (optional)  — Restrict search to "message", "channel", or "file"
 *   limit  (optional)  — Maximum results per type (default 20)
 *   offset (optional)  — Pagination offset (default 0)
 *
 * Returns a SearchResponse wrapper object matching CONTRACTS.md:
 *   { results: SearchResultItem[], total: number, query: string, filters: {...} }
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
    const rawType = searchParams.get("type"); // "message(s)" | "channel(s)" | "file(s)"
    /* Normalize plural tab IDs sent by the frontend (e.g. "messages" → "message")
       so the downstream conditions match correctly. */
    const type = rawType ? rawType.replace(/s$/, "") : null;
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // ── 2. Validate required 'q' parameter ──
    if (!q || !q.trim()) {
      return NextResponse.json(
        { error: "Search query parameter 'q' is required" },
        { status: 400 }
      );
    }

    const trimmedQ = q.trim();

    // ── 3. Build wildcard search term for ILIKE matching ──
    // Info 2: Escape ILIKE special characters (%, _) to prevent unintended wildcard matching
    const searchTerm = `%${escapeILike(trimmedQ)}%`;

    // ── 4. Accumulate results from each search domain ──
    interface SearchResultItem {
      type: string;
      id: number;
      title: string;
      snippet: string;
      channel_name: string | null;
      channel_id: number | null;
      username: string | null;
      avatar_color: string | null;
      created_at: string;
      highlight: string;
    }

    const results: SearchResultItem[] = [];

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
      params.push(limit);
      const limitIdx = paramIndex++;
      params.push(offset);
      const offsetIdx = paramIndex++;

      const messageResult = await query(
        `SELECT m.id, m.content, m.created_at, m.channel_id, m.user_id,
                u.username, u.avatar_color, c.name AS channel_name
         FROM messages m
         JOIN users u ON u.id = m.user_id
         JOIN channels c ON c.id = m.channel_id
         WHERE ${whereClause}
         ORDER BY m.created_at DESC
         LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
        params
      );

      for (const row of messageResult.rows as Array<{
        id: number;
        content: string;
        created_at: string;
        channel_id: number;
        user_id: number;
        username: string;
        avatar_color: string;
        channel_name: string;
      }>) {
        // Build highlight by wrapping matched terms in <mark> tags
        const escapedQ = trimmedQ.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const highlightRegex = new RegExp(`(${escapedQ})`, "gi");
        const highlight = row.content.replace(highlightRegex, "<mark>$1</mark>");

        results.push({
          type: "message",
          id: row.id,
          title: `Message in #${row.channel_name}`,
          snippet: row.content,
          channel_name: row.channel_name,
          channel_id: row.channel_id,
          username: row.username,
          avatar_color: row.avatar_color,
          created_at: row.created_at,
          highlight,
        });
      }
    }

    // ── 6. Channel search (when type is "channel" or unspecified) ──
    if (!type || type === "channel") {
      const channelResult = await query(
        `SELECT c.id, c.name, c.description, c.created_at, u.username AS creator_name
         FROM channels c
         LEFT JOIN users u ON u.id = c.created_by
         WHERE c.name ILIKE $1 OR c.description ILIKE $1
         ORDER BY c.name
         LIMIT $2 OFFSET $3`,
        [searchTerm, limit, offset]
      );

      for (const row of channelResult.rows as Array<{
        id: number;
        name: string;
        description: string;
        created_at: string;
        creator_name: string | null;
      }>) {
        const escapedQ = trimmedQ.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const highlightRegex = new RegExp(`(${escapedQ})`, "gi");
        const nameHighlight = row.name.replace(highlightRegex, "<mark>$1</mark>");
        const descHighlight = row.description.replace(highlightRegex, "<mark>$1</mark>");

        results.push({
          type: "channel",
          id: row.id,
          title: `#${row.name}`,
          snippet: row.description,
          channel_name: row.name,
          channel_id: row.id,
          username: row.creator_name,
          avatar_color: null,
          created_at: row.created_at,
          highlight: row.name.toLowerCase().includes(trimmedQ.toLowerCase())
            ? nameHighlight
            : descHighlight,
        });
      }
    }

    // ── 7. File search (when type is "file" or unspecified) ──
    if (!type || type === "file") {
      try {
        const fileResult = await query(
          `SELECT f.id, f.name, f.file_type, f.file_size, f.created_at,
                  f.channel_id, u.username AS uploaded_by_name, u.avatar_color,
                  c.name AS channel_name
           FROM files f
           JOIN users u ON u.id = f.uploaded_by
           LEFT JOIN channels c ON c.id = f.channel_id
           WHERE f.name ILIKE $1
           ORDER BY f.created_at DESC
           LIMIT $2 OFFSET $3`,
          [searchTerm, limit, offset]
        );

        for (const row of fileResult.rows as Array<{
          id: number;
          name: string;
          file_type: string;
          file_size: number;
          created_at: string;
          channel_id: number | null;
          uploaded_by_name: string;
          avatar_color: string;
          channel_name: string | null;
        }>) {
          const escapedQ = trimmedQ.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const highlightRegex = new RegExp(`(${escapedQ})`, "gi");
          const highlight = row.name.replace(highlightRegex, "<mark>$1</mark>");

          results.push({
            type: "file",
            id: row.id,
            title: row.name,
            snippet: `${row.file_type} file (${row.file_size} bytes)`,
            channel_name: row.channel_name,
            channel_id: row.channel_id,
            username: row.uploaded_by_name,
            avatar_color: row.avatar_color,
            created_at: row.created_at,
            highlight,
          });
        }
      } catch {
        // files table may not exist in older schema versions — silently skip
      }
    }

    // ── 8. Return wrapped response matching CONTRACTS.md SearchResponse schema ──
    return NextResponse.json({
      results,
      total: results.length,
      query: trimmedQ,
      filters: {
        type: rawType || "all",
        from: from || null,
        in: inChannel || null,
        before: before || null,
        after: after || null,
      },
    });
  } catch (err) {
    console.error("Search failed:", err);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}

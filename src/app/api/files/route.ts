import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { parseValidInt, stripNullBytes, MAX_LENGTHS } from "@/lib/validation";

/**
 * GET /api/files
 *
 * Lists files shared across the workspace with optional filters.
 * Joins with users (uploader name) and channels (source channel name).
 * Already includes LIMIT/OFFSET pagination (default limit 50).
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channel_id");
    const userId = searchParams.get("user_id");
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Build dynamic WHERE clause from optional filters
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (channelId) {
      const parsedChannelId = parseValidInt(channelId);
      if (parsedChannelId === null) {
        return NextResponse.json(
          { error: "channel_id must be a valid integer" },
          { status: 400 },
        );
      }
      conditions.push(`f.channel_id = $${paramIndex++}`);
      params.push(parsedChannelId);
    }
    if (userId) {
      const parsedUserId = parseValidInt(userId);
      if (parsedUserId === null) {
        return NextResponse.json(
          { error: "user_id must be a valid integer" },
          { status: 400 },
        );
      }
      conditions.push(`f.uploaded_by = $${paramIndex++}`);
      params.push(parsedUserId);
    }
    if (type) {
      conditions.push(`f.file_type = $${paramIndex++}`);
      params.push(type);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    params.push(limit);
    const limitParam = `$${paramIndex++}`;
    params.push(offset);
    const offsetParam = `$${paramIndex++}`;

    const result = await query(
      `SELECT f.*, u.username, c.name AS channel_name
       FROM files f
       JOIN users u ON u.id = f.uploaded_by
       LEFT JOIN channels c ON c.id = f.channel_id
       ${whereClause}
       ORDER BY f.created_at DESC
       LIMIT ${limitParam} OFFSET ${offsetParam}`,
      params
    );

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch files:", err);
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/files
 *
 * Creates a file metadata record in the workspace file browser.
 * This is a mock-only endpoint — no binary upload is performed.
 * Returns 400 for invalid JSON or missing required fields.
 */
export async function POST(req: Request) {
  try {
    let body: {
      name?: string;
      type?: string;
      size?: number;
      user_id?: number;
      channel_id?: number;
      thumbnail_url?: string;
    };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { name, type, size, user_id, channel_id, thumbnail_url } = body;

    if (!name || !type || !size || !user_id) {
      return NextResponse.json(
        { error: "name, type, size, and user_id are required" },
        { status: 400 }
      );
    }

    // Issue 1: Validate numeric IDs
    const parsedUserId = parseValidInt(user_id);
    if (parsedUserId === null) {
      return NextResponse.json(
        { error: "user_id must be a valid integer" },
        { status: 400 },
      );
    }
    let parsedChannelId: number | null = null;
    if (channel_id) {
      parsedChannelId = parseValidInt(channel_id);
      if (parsedChannelId === null) {
        return NextResponse.json(
          { error: "channel_id must be a valid integer" },
          { status: 400 },
        );
      }
    }

    // Issue 4 & 5: Sanitize text fields
    const safeName = stripNullBytes(name).slice(0, MAX_LENGTHS.FILE_NAME);
    const safeType = stripNullBytes(type).slice(0, MAX_LENGTHS.EMOJI);

    if (safeName.length === 0) {
      return NextResponse.json(
        { error: "name must not be empty after sanitization" },
        { status: 400 },
      );
    }

    const result = await query(
      `INSERT INTO files (name, file_type, file_size, uploaded_by, channel_id, thumbnail_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [safeName, safeType, size, parsedUserId, parsedChannelId, thumbnail_url || null]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error("Failed to upload file:", err);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

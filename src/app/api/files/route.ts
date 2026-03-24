import { NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * GET /api/files
 *
 * Lists files shared across the workspace with optional filters.
 * Joins with users (uploader name) and channels (source channel name).
 *
 * Query Parameters:
 *   channel_id (number, optional) — filter by source channel
 *   user_id    (number, optional) — filter by uploader
 *   type       (string, optional) — filter by file type (e.g. "image", "pdf")
 *   limit      (number, optional, default 50) — pagination limit
 *   offset     (number, optional, default 0) — pagination offset
 *
 * Returns: JSON array of file metadata objects with uploader username
 *          and channel name, ordered by created_at descending.
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
      conditions.push(`f.channel_id = $${paramIndex++}`);
      params.push(channelId);
    }
    if (userId) {
      conditions.push(`f.uploaded_by = $${paramIndex++}`);
      params.push(userId);
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
 *
 * Request Body (JSON):
 *   name          (string, required) — filename
 *   type          (string, required) — file type (e.g. "image", "pdf", "document")
 *   size          (number, required) — file size in bytes
 *   user_id       (number, required) — uploader user ID
 *   channel_id    (number, optional) — source channel (null for workspace-level files)
 *   thumbnail_url (string, optional) — preview thumbnail URL
 *
 * Returns: 201 with the created file record, or 400 for validation errors.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, type, size, user_id, channel_id, thumbnail_url } = body;

    if (!name || !type || !size || !user_id) {
      return NextResponse.json(
        { error: "name, type, size, and user_id are required" },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO files (name, file_type, file_size, uploaded_by, channel_id, thumbnail_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, type, size, user_id, channel_id || null, thumbnail_url || null]
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

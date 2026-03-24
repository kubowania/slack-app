import { NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * Interfaces for database row shapes returned by pg driver.
 * Used internally for type-safe mapping of SQL results.
 */
interface DmRow {
  id: number;
  created_by: number;
  is_group: boolean;
  created_at: string;
  last_message_preview: string | null;
  message_count: string; // PostgreSQL COUNT returns bigint as string
}

interface DmMemberRow {
  dm_id: number;
  id: number;
  username: string;
  avatar_color: string;
}

interface DmMember {
  id: number;
  username: string;
  avatar_color: string;
}

/**
 * GET /api/dms
 *
 * Lists all direct message conversations with their members and last message preview.
 * Uses a two-query batch approach:
 *   1. Fetch all DMs with last message preview and message count via subqueries
 *   2. Fetch all DM members for the retrieved DM IDs in a single batch query
 *   3. Combine results in JavaScript before returning
 *
 * Response shape:
 * [
 *   {
 *     id: number,
 *     created_by: number,
 *     is_group: boolean,
 *     created_at: string,
 *     last_message_preview: string | null,
 *     message_count: number,
 *     members: [{ id: number, username: string, avatar_color: string }]
 *   }
 * ]
 */
export async function GET() {
  try {
    // Query 1: Fetch all DM conversations with last message preview and total message count
    const dmsResult = await query(
      `SELECT dm.id, dm.created_by, dm.is_group, dm.created_at,
        (SELECT content FROM dm_messages WHERE dm_id = dm.id ORDER BY created_at DESC LIMIT 1) AS last_message_preview,
        (SELECT COUNT(*) FROM dm_messages WHERE dm_id = dm.id) AS message_count
       FROM direct_messages dm
       ORDER BY dm.created_at DESC`
    );

    const dms: DmRow[] = dmsResult.rows;

    // Early return for empty result set — no need for member query
    if (dms.length === 0) {
      return NextResponse.json([]);
    }

    // Query 2: Batch-fetch all members for all retrieved DM IDs in a single query
    const dmIds = dms.map((dm) => dm.id);
    const membersResult = await query(
      `SELECT dmm.dm_id, u.id, u.username, u.avatar_color
       FROM dm_members dmm
       JOIN users u ON u.id = dmm.user_id
       WHERE dmm.dm_id = ANY($1)`,
      [dmIds]
    );

    // Group members by their DM conversation ID for efficient lookup
    const membersByDmId = new Map<number, DmMember[]>();
    for (const row of membersResult.rows as DmMemberRow[]) {
      const existing = membersByDmId.get(row.dm_id);
      const member: DmMember = {
        id: row.id,
        username: row.username,
        avatar_color: row.avatar_color,
      };
      if (existing) {
        existing.push(member);
      } else {
        membersByDmId.set(row.dm_id, [member]);
      }
    }

    // Combine DM conversations with their associated members
    const dmsWithMembers = dms.map((dm) => ({
      id: dm.id,
      created_by: dm.created_by,
      is_group: dm.is_group,
      created_at: dm.created_at,
      last_message_preview: dm.last_message_preview,
      message_count: Number(dm.message_count),
      members: membersByDmId.get(dm.id) || [],
    }));

    return NextResponse.json(dmsWithMembers);
  } catch (err) {
    console.error("Failed to fetch direct messages:", err);
    return NextResponse.json(
      { error: "Failed to fetch direct messages" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dms
 *
 * Creates a new direct message conversation with the specified members.
 *
 * Request body:
 *   { member_ids: number[] }  — array of user IDs (minimum 2 required)
 *
 * The first member_id is used as the conversation creator.
 * Conversations with more than 2 members are automatically marked as group DMs.
 *
 * Returns the newly created DM conversation with its members (HTTP 201).
 */
export async function POST(req: Request) {
  try {
    const body: { member_ids?: unknown } = await req.json();
    const { member_ids } = body;

    // Validate member_ids is a non-empty array with at least 2 user IDs
    if (!member_ids || !Array.isArray(member_ids) || member_ids.length < 2) {
      return NextResponse.json(
        { error: "member_ids array with at least 2 user IDs is required" },
        { status: 400 }
      );
    }

    // Pre-flight validation: verify all provided user IDs exist in the users table
    const numericIds = member_ids.map((id) => Number(id));
    const existingUsers = await query(
      `SELECT id FROM users WHERE id = ANY($1)`,
      [numericIds]
    );
    const existingUserIds = new Set(
      existingUsers.rows.map((row: { id: number }) => row.id)
    );
    const invalidIds = numericIds.filter((id) => !existingUserIds.has(id));
    if (invalidIds.length > 0) {
      return NextResponse.json(
        {
          error: `Invalid user IDs: ${invalidIds.join(", ")}. Users do not exist.`,
        },
        { status: 400 }
      );
    }

    // Determine if this is a group DM (more than 2 participants)
    const isGroup = member_ids.length > 2;
    const createdBy = member_ids[0] as number;

    // Insert the DM conversation record
    const dmResult = await query(
      "INSERT INTO direct_messages (created_by, is_group) VALUES ($1, $2) RETURNING *",
      [createdBy, isGroup]
    );
    const dm = dmResult.rows[0] as {
      id: number;
      created_by: number;
      is_group: boolean;
      created_at: string;
    };

    // Insert each member into the dm_members junction table
    for (const memberId of member_ids) {
      await query(
        "INSERT INTO dm_members (dm_id, user_id) VALUES ($1, $2)",
        [dm.id, memberId as number]
      );
    }

    // Fetch the complete member list with user details for the response
    const membersResult = await query(
      `SELECT u.id, u.username, u.avatar_color
       FROM dm_members dmm
       JOIN users u ON u.id = dmm.user_id
       WHERE dmm.dm_id = $1`,
      [dm.id]
    );

    // Build the complete response object matching the GET response shape
    const dmWithMembers = {
      id: dm.id,
      created_by: dm.created_by,
      is_group: dm.is_group,
      created_at: dm.created_at,
      last_message_preview: null,
      message_count: 0,
      members: membersResult.rows as DmMember[],
    };

    return NextResponse.json(dmWithMembers, { status: 201 });
  } catch (err) {
    console.error("Failed to create direct message:", err);
    return NextResponse.json(
      { error: "Failed to create direct message" },
      { status: 500 }
    );
  }
}

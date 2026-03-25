/**
 * API Contract Validation Tests
 *
 * Comprehensive Playwright test suite that validates every API endpoint documented
 * in CONTRACTS.md returns the expected schema, status codes, and response shapes.
 *
 * Uses Playwright's `request` fixture (API testing mode) — no browser navigation.
 * The playwright.config.ts at project root configures:
 *   - baseURL: http://localhost:3000
 *   - testDir: ./tests
 *   - webServer: auto-starts Next.js dev server
 *
 * Seed data expectations (from init-db.sql):
 *   - 3 users: alice, bob, charlie
 *   - 3 channels: general, random, engineering
 *   - 7 messages across 3 channels
 */

import { test, expect } from '@playwright/test';
import { mockUsers, mockChannels } from '../src/lib/mock-data';

// ---------------------------------------------------------------------------
// Reference data — sourced from the centralized mock-data module so that
// test expectations stay in sync with the seed data definitions.
// ---------------------------------------------------------------------------

/** Expected base seed usernames, sorted alphabetically (matching DB ORDER BY). */
const SEED_USERNAMES = mockUsers.slice(0, 3).map((u) => u.username).sort();

/** Expected base seed channel names, sorted alphabetically. */
const SEED_CHANNEL_NAMES = mockChannels.slice(0, 3).map((c) => c.name).sort();

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

/**
 * Asserts that the given object has every property listed in `fields`.
 * Provides clear assertion messages when a field is missing.
 */
function expectFields(obj: Record<string, unknown>, fields: string[]): void {
  for (const field of fields) {
    expect(obj, `Missing field "${field}" in response object`).toHaveProperty(field);
  }
}

/**
 * Asserts that the given value is an array and, if it contains at least one
 * element, asserts that the first element has all `requiredFields`.
 */
function expectArrayOfObjects(data: unknown, requiredFields: string[]): void {
  expect(Array.isArray(data)).toBe(true);
  if (Array.isArray(data) && data.length > 0) {
    expectFields(data[0] as Record<string, unknown>, requiredFields);
  }
}

// ---------------------------------------------------------------------------
// 1. Users API — /api/users
// ---------------------------------------------------------------------------

test.describe('Users API', () => {
  test('GET /api/users — returns 200 with array of users', async ({ request }) => {
    const response = await request.get('/api/users');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(3);
  });

  test('GET /api/users — each user has required base fields', async ({ request }) => {
    const response = await request.get('/api/users');
    const data = await response.json();

    const baseFields = ['id', 'username', 'avatar_color', 'created_at'];
    expectArrayOfObjects(data, baseFields);

    // Validate types on first user
    if (Array.isArray(data) && data.length > 0) {
      const user = data[0] as Record<string, unknown>;
      expect(typeof user.id).toBe('number');
      expect(typeof user.username).toBe('string');
      expect(typeof user.avatar_color).toBe('string');
      expect(typeof user.created_at).toBe('string');
    }
  });

  test('GET /api/users — each user has extended profile fields', async ({ request }) => {
    const response = await request.get('/api/users');
    const data = await response.json();

    const extendedFields = [
      'id', 'username', 'avatar_color', 'created_at',
      'status_emoji', 'status_text', 'display_name', 'title',
    ];
    expectArrayOfObjects(data, extendedFields);
  });

  test('GET /api/users — results are sorted by username', async ({ request }) => {
    const response = await request.get('/api/users');
    const data = await response.json();

    if (Array.isArray(data) && data.length >= 3) {
      const usernames = data.map((u: Record<string, unknown>) => u.username);
      // Validate against mock-data seed constants (alice, bob, charlie)
      for (let i = 0; i < SEED_USERNAMES.length; i++) {
        expect(usernames[i]).toBe(SEED_USERNAMES[i]);
      }
    }
  });

  test('POST /api/users — returns 201 with valid body', async ({ request }) => {
    const response = await request.post('/api/users', {
      data: { username: `testuser_${Date.now()}`, avatar_color: '#FF0000' },
    });
    expect(response.status()).toBe(201);

    const data = await response.json();
    expectFields(data as Record<string, unknown>, ['id', 'username', 'avatar_color', 'created_at']);
    expect(typeof (data as Record<string, unknown>).id).toBe('number');
  });

  test('POST /api/users — returns 400 when username is missing', async ({ request }) => {
    const response = await request.post('/api/users', {
      data: {},
    });
    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(typeof (data as Record<string, unknown>).error).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// 2. Channels API — /api/channels
// ---------------------------------------------------------------------------

test.describe('Channels API', () => {
  test('GET /api/channels — returns 200 with array of channels', async ({ request }) => {
    const response = await request.get('/api/channels');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(3);
  });

  test('GET /api/channels — each channel has required base fields', async ({ request }) => {
    const response = await request.get('/api/channels');
    const data = await response.json();

    const baseFields = ['id', 'name', 'description', 'created_by', 'created_at', 'creator_name'];
    expectArrayOfObjects(data, baseFields);
  });

  test('GET /api/channels — each channel has extended fields', async ({ request }) => {
    const response = await request.get('/api/channels');
    const data = await response.json();

    const extendedFields = [
      'id', 'name', 'description', 'created_by', 'created_at', 'creator_name',
      'member_count', 'unread_count', 'last_message_preview',
    ];
    expectArrayOfObjects(data, extendedFields);
  });

  test('GET /api/channels — results are sorted by name', async ({ request }) => {
    const response = await request.get('/api/channels');
    const data = await response.json();

    if (Array.isArray(data) && data.length >= 3) {
      const names = data.map((c: Record<string, unknown>) => c.name);
      // Validate against mock-data seed constants (engineering, general, random)
      for (let i = 0; i < SEED_CHANNEL_NAMES.length; i++) {
        expect(names[i]).toBe(SEED_CHANNEL_NAMES[i]);
      }
    }
  });

  test('POST /api/channels — returns 201 with valid body', async ({ request }) => {
    const response = await request.post('/api/channels', {
      data: {
        name: `Test Channel ${Date.now()}`,
        description: 'test channel description',
        created_by: 1,
      },
    });
    expect(response.status()).toBe(201);

    const data = await response.json();
    expectFields(data as Record<string, unknown>, ['id', 'name', 'description', 'created_by', 'created_at']);
  });

  test('POST /api/channels — normalizes channel name', async ({ request }) => {
    const response = await request.post('/api/channels', {
      data: {
        name: `My Test Channel ${Date.now()}`,
        description: 'normalization test',
        created_by: 1,
      },
    });
    expect(response.status()).toBe(201);

    const data = await response.json();
    const name = (data as Record<string, unknown>).name as string;
    // Name should be lowercase with hyphens
    expect(name).toBe(name.toLowerCase());
    expect(name).not.toContain(' ');
  });

  test('POST /api/channels — returns 400 when name is missing', async ({ request }) => {
    const response = await request.post('/api/channels', {
      data: { description: 'no name provided' },
    });
    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(typeof (data as Record<string, unknown>).error).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// 3. Channel Messages API — /api/channels/:id/messages
// ---------------------------------------------------------------------------

test.describe('Channel Messages API', () => {
  test('GET /api/channels/1/messages — returns 200 with array', async ({ request }) => {
    const response = await request.get('/api/channels/1/messages');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(3);
  });

  test('GET /api/channels/1/messages — each message has required base fields', async ({ request }) => {
    const response = await request.get('/api/channels/1/messages');
    const data = await response.json();

    const baseFields = [
      'id', 'channel_id', 'user_id', 'content',
      'username', 'avatar_color', 'created_at',
    ];
    expectArrayOfObjects(data, baseFields);
  });

  test('GET /api/channels/1/messages — each message has extended fields', async ({ request }) => {
    const response = await request.get('/api/channels/1/messages');
    const data = await response.json();

    const extendedFields = [
      'id', 'channel_id', 'user_id', 'content',
      'username', 'avatar_color', 'created_at',
      'thread_reply_count', 'reaction_summary', 'is_pinned',
    ];
    expectArrayOfObjects(data, extendedFields);

    // Validate types on first message with extended fields
    if (Array.isArray(data) && data.length > 0) {
      const msg = data[0] as Record<string, unknown>;
      expect(typeof msg.thread_reply_count).toBe('number');
      expect(Array.isArray(msg.reaction_summary)).toBe(true);
      expect(typeof msg.is_pinned).toBe('boolean');
    }
  });

  test('GET /api/channels/1/messages — messages sorted by created_at ASC', async ({ request }) => {
    const response = await request.get('/api/channels/1/messages');
    const data = await response.json();

    if (Array.isArray(data) && data.length >= 2) {
      const timestamps = data.map((m: Record<string, unknown>) => new Date(m.created_at as string).getTime());
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
      }
    }
  });

  test('POST /api/channels/1/messages — returns 201 with valid body', async ({ request }) => {
    const response = await request.post('/api/channels/1/messages', {
      data: { user_id: 1, content: `test message ${Date.now()}` },
    });
    expect(response.status()).toBe(201);

    const data = await response.json();
    expectFields(data as Record<string, unknown>, [
      'id', 'channel_id', 'user_id', 'content', 'username', 'avatar_color', 'created_at',
    ]);
  });

  test('POST /api/channels/1/messages — returns 400 when fields missing', async ({ request }) => {
    const response = await request.post('/api/channels/1/messages', {
      data: { content: 'no user_id' },
    });
    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });
});

// ---------------------------------------------------------------------------
// 4. DMs API — /api/dms
// ---------------------------------------------------------------------------

test.describe('DMs API', () => {
  test('GET /api/dms — returns 200 with array of DM conversations', async ({ request }) => {
    const response = await request.get('/api/dms?user_id=1');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('GET /api/dms — each DM has required fields', async ({ request }) => {
    const response = await request.get('/api/dms?user_id=1');
    const data = await response.json();

    const fields = [
      'id', 'created_by', 'is_group', 'members',
      'last_message_preview', 'unread_count', 'created_at',
    ];
    expectArrayOfObjects(data, fields);

    // Validate members array structure
    if (Array.isArray(data) && data.length > 0) {
      const dm = data[0] as Record<string, unknown>;
      expect(Array.isArray(dm.members)).toBe(true);
      const members = dm.members as Record<string, unknown>[];
      if (members.length > 0) {
        expectFields(members[0], ['user_id', 'username', 'avatar_color', 'display_name']);
      }
    }
  });

  test('GET /api/dms — returns 400 when user_id is missing', async ({ request }) => {
    const response = await request.get('/api/dms');
    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('POST /api/dms — returns 201 with valid body', async ({ request }) => {
    const response = await request.post('/api/dms', {
      data: { created_by: 1, member_ids: [1, 2] },
    });
    expect(response.status()).toBe(201);

    const data = await response.json();
    expectFields(data as Record<string, unknown>, ['id', 'created_by', 'is_group', 'created_at']);
  });

  test('POST /api/dms — returns 400 when member_ids missing', async ({ request }) => {
    const response = await request.post('/api/dms', {
      data: { created_by: 1 },
    });
    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });
});

// ---------------------------------------------------------------------------
// 5. DM Messages API — /api/dms/:id/messages
// ---------------------------------------------------------------------------

test.describe('DM Messages API', () => {
  test('GET /api/dms/1/messages — returns 200 with array', async ({ request }) => {
    const response = await request.get('/api/dms/1/messages');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('GET /api/dms/1/messages — each message has required fields', async ({ request }) => {
    const response = await request.get('/api/dms/1/messages');
    const data = await response.json();

    const fields = ['id', 'dm_id', 'user_id', 'content', 'username', 'avatar_color', 'created_at'];
    expectArrayOfObjects(data, fields);
  });

  test('POST /api/dms/1/messages — returns 201 with valid body', async ({ request }) => {
    const response = await request.post('/api/dms/1/messages', {
      data: { user_id: 1, content: `dm test ${Date.now()}` },
    });
    expect(response.status()).toBe(201);

    const data = await response.json();
    expectFields(data as Record<string, unknown>, ['id', 'dm_id', 'user_id', 'content', 'username', 'avatar_color', 'created_at']);
  });

  test('POST /api/dms/1/messages — returns 400 when required fields missing', async ({ request }) => {
    const response = await request.post('/api/dms/1/messages', {
      data: { content: 'no user_id' },
    });
    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });
});

// ---------------------------------------------------------------------------
// 6. Reactions API — /api/messages/:id/reactions
// ---------------------------------------------------------------------------

test.describe('Reactions API', () => {
  test('GET /api/messages/1/reactions — returns 200 with array', async ({ request }) => {
    const response = await request.get('/api/messages/1/reactions');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('GET /api/messages/1/reactions — each reaction has required fields', async ({ request }) => {
    const response = await request.get('/api/messages/1/reactions');
    const data = await response.json();

    // Per CONTRACTS.md, grouped by emoji: { emoji, count, users: [{ user_id, username }] }
    const fields = ['emoji', 'count', 'users'];
    expectArrayOfObjects(data, fields);

    if (Array.isArray(data) && data.length > 0) {
      const reaction = data[0] as Record<string, unknown>;
      expect(typeof reaction.emoji).toBe('string');
      expect(typeof reaction.count).toBe('number');
      expect(Array.isArray(reaction.users)).toBe(true);
    }
  });

  test('POST /api/messages/1/reactions — returns 201 with valid body', async ({ request }) => {
    const response = await request.post('/api/messages/1/reactions', {
      data: { user_id: 1, emoji: '👍' },
    });
    // Accept 201 Created or 200 OK (no-op if already exists)
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(300);

    const data = await response.json();
    expectFields(data as Record<string, unknown>, ['id', 'message_id', 'user_id', 'emoji', 'created_at']);
  });

  test('POST /api/messages/1/reactions — returns 400 when emoji or user_id missing', async ({ request }) => {
    const response = await request.post('/api/messages/1/reactions', {
      data: { user_id: 1 },
    });
    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('DELETE /api/messages/1/reactions — returns 200', async ({ request }) => {
    // First add a reaction to ensure there's something to delete
    await request.post('/api/messages/1/reactions', {
      data: { user_id: 2, emoji: '🗑️' },
    });

    const response = await request.delete('/api/messages/1/reactions?user_id=2&emoji=🗑️');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('success');
    expect((data as Record<string, unknown>).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 7. Threads API — /api/messages/:id/thread
// ---------------------------------------------------------------------------

test.describe('Threads API', () => {
  test('GET /api/messages/1/thread — returns 200 with thread data', async ({ request }) => {
    const response = await request.get('/api/messages/1/thread');
    expect(response.status()).toBe(200);

    const data = await response.json();
    // Per CONTRACTS.md: { parent_message, replies, reply_count }
    expectFields(data as Record<string, unknown>, ['parent_message', 'replies', 'reply_count']);
  });

  test('GET /api/messages/1/thread — parent_message has required fields', async ({ request }) => {
    const response = await request.get('/api/messages/1/thread');
    const data = await response.json() as Record<string, unknown>;

    const parentMsg = data.parent_message as Record<string, unknown>;
    expectFields(parentMsg, [
      'id', 'channel_id', 'user_id', 'content', 'username', 'avatar_color', 'created_at',
    ]);
  });

  test('GET /api/messages/1/thread — replies is an array with required fields', async ({ request }) => {
    const response = await request.get('/api/messages/1/thread');
    const data = await response.json() as Record<string, unknown>;

    const replies = data.replies as unknown[];
    expect(Array.isArray(replies)).toBe(true);

    if (replies.length > 0) {
      expectFields(replies[0] as Record<string, unknown>, [
        'id', 'parent_message_id', 'user_id', 'content', 'username', 'avatar_color', 'created_at',
      ]);
    }
  });

  test('GET /api/messages/1/thread — reply_count is a number', async ({ request }) => {
    const response = await request.get('/api/messages/1/thread');
    const data = await response.json() as Record<string, unknown>;

    expect(typeof data.reply_count).toBe('number');
    expect(data.reply_count).toBeGreaterThanOrEqual(0);
  });

  test('POST /api/messages/1/thread — returns 201 with valid body', async ({ request }) => {
    const response = await request.post('/api/messages/1/thread', {
      data: { user_id: 2, content: `thread reply ${Date.now()}` },
    });
    expect(response.status()).toBe(201);

    const data = await response.json();
    expectFields(data as Record<string, unknown>, [
      'id', 'parent_message_id', 'user_id', 'content', 'username', 'avatar_color', 'created_at',
    ]);
  });

  test('POST /api/messages/1/thread — returns 400 when required fields missing', async ({ request }) => {
    const response = await request.post('/api/messages/1/thread', {
      data: { user_id: 2 },
    });
    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });
});

// ---------------------------------------------------------------------------
// 8. Pins API — /api/messages/:id/pin
// ---------------------------------------------------------------------------

test.describe('Pins API', () => {
  test('POST /api/messages/2/pin — returns 201 with valid body', async ({ request }) => {
    const response = await request.post('/api/messages/2/pin', {
      data: { user_id: 1 },
    });
    // Accept 201 Created or 409 Conflict (if already pinned)
    expect([201, 409]).toContain(response.status());

    if (response.status() === 201) {
      const data = await response.json();
      expectFields(data as Record<string, unknown>, [
        'id', 'message_id', 'channel_id', 'pinned_by', 'created_at',
      ]);
    }
  });

  test('POST /api/messages/2/pin — returns 400 when user_id missing', async ({ request }) => {
    const response = await request.post('/api/messages/2/pin', {
      data: {},
    });
    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('DELETE /api/messages/2/pin — returns 204', async ({ request }) => {
    // Ensure the message is pinned first
    await request.post('/api/messages/2/pin', {
      data: { user_id: 1 },
    });

    const response = await request.delete('/api/messages/2/pin');
    expect(response.status()).toBe(204);
  });
});

// ---------------------------------------------------------------------------
// 9. Channel Members API — /api/channels/:id/members
// ---------------------------------------------------------------------------

test.describe('Channel Members API', () => {
  test('GET /api/channels/1/members — returns 200 with array', async ({ request }) => {
    const response = await request.get('/api/channels/1/members');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('GET /api/channels/1/members — each member has required fields', async ({ request }) => {
    const response = await request.get('/api/channels/1/members');
    const data = await response.json();

    const fields = [
      'id', 'channel_id', 'user_id', 'username', 'avatar_color',
      'display_name', 'role', 'joined_at',
    ];
    expectArrayOfObjects(data, fields);

    if (Array.isArray(data) && data.length > 0) {
      const member = data[0] as Record<string, unknown>;
      expect(typeof member.role).toBe('string');
      expect(['owner', 'admin', 'member']).toContain(member.role);
    }
  });

  test('POST /api/channels/1/members — returns 201 or 409 with valid body', async ({ request }) => {
    const response = await request.post('/api/channels/1/members', {
      data: { user_id: 3 },
    });
    // Accept 201 Created or 409 Conflict if user already a member
    expect([201, 409]).toContain(response.status());

    if (response.status() === 201) {
      const data = await response.json();
      expectFields(data as Record<string, unknown>, ['id', 'channel_id', 'user_id', 'role', 'joined_at']);
    }
  });

  test('POST /api/channels/1/members — returns 400 when user_id missing', async ({ request }) => {
    const response = await request.post('/api/channels/1/members', {
      data: {},
    });
    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('DELETE /api/channels/1/members — returns 200 or 404', async ({ request }) => {
    // First ensure the member exists
    await request.post('/api/channels/1/members', {
      data: { user_id: 3 },
    });

    const response = await request.delete('/api/channels/1/members', {
      data: { user_id: 3 },
    });
    expect([200, 404]).toContain(response.status());
  });
});

// ---------------------------------------------------------------------------
// 10. Channel Pins API — /api/channels/:id/pins
// ---------------------------------------------------------------------------

test.describe('Channel Pins API', () => {
  test('GET /api/channels/1/pins — returns 200 with array', async ({ request }) => {
    const response = await request.get('/api/channels/1/pins');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('GET /api/channels/1/pins — each pin has required fields', async ({ request }) => {
    const response = await request.get('/api/channels/1/pins');
    const data = await response.json();

    const fields = [
      'id', 'message_id', 'channel_id', 'content', 'username',
      'pinned_by', 'created_at', 'message_created_at',
    ];
    expectArrayOfObjects(data, fields);
  });
});

// ---------------------------------------------------------------------------
// 11. Channel Files API — /api/channels/:id/files
// ---------------------------------------------------------------------------

test.describe('Channel Files API', () => {
  test('GET /api/channels/1/files — returns 200 with array', async ({ request }) => {
    const response = await request.get('/api/channels/1/files');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('GET /api/channels/1/files — each file has required fields', async ({ request }) => {
    const response = await request.get('/api/channels/1/files');
    const data = await response.json();

    const fields = [
      'id', 'name', 'file_type', 'file_size', 'uploaded_by',
      'username', 'channel_id', 'thumbnail_url', 'created_at',
    ];
    expectArrayOfObjects(data, fields);
  });
});

// ---------------------------------------------------------------------------
// 12. Channel Browse API — /api/channels/browse
// ---------------------------------------------------------------------------

test.describe('Channel Browse API', () => {
  test('GET /api/channels/browse — returns 200 with array', async ({ request }) => {
    const response = await request.get('/api/channels/browse');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('GET /api/channels/browse — each channel has required fields', async ({ request }) => {
    const response = await request.get('/api/channels/browse');
    const data = await response.json();

    const channelFields = [
      'id', 'name', 'description', 'member_count', 'creator_name', 'created_at',
    ];
    expectArrayOfObjects(data, channelFields);
  });

  test('GET /api/channels/browse — supports pagination params', async ({ request }) => {
    const response = await request.get('/api/channels/browse?page=1&limit=2');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    // Limit should constrain results to at most 2
    expect((data as unknown[]).length).toBeLessThanOrEqual(2);
  });

  test('GET /api/channels/browse — supports search param', async ({ request }) => {
    const response = await request.get('/api/channels/browse?search=general');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 13. Search API — /api/search
// ---------------------------------------------------------------------------

test.describe('Search API', () => {
  test('GET /api/search?q=hello — returns 200 with search response', async ({ request }) => {
    const response = await request.get('/api/search?q=hello');
    expect(response.status()).toBe(200);

    const data = await response.json() as Record<string, unknown>;
    expectFields(data, ['results', 'total', 'query', 'filters']);
  });

  test('GET /api/search?q=hello — results array has required fields', async ({ request }) => {
    const response = await request.get('/api/search?q=hello');
    const data = await response.json() as Record<string, unknown>;

    const results = data.results as unknown[];
    expect(Array.isArray(results)).toBe(true);

    if (results.length > 0) {
      const resultFields = ['type', 'id', 'title', 'snippet', 'created_at', 'highlight'];
      expectFields(results[0] as Record<string, unknown>, resultFields);
    }
  });

  test('GET /api/search?q=hello — filters object has required fields', async ({ request }) => {
    const response = await request.get('/api/search?q=hello');
    const data = await response.json() as Record<string, unknown>;

    const filters = data.filters as Record<string, unknown>;
    expectFields(filters, ['type', 'from', 'in', 'before', 'after']);
  });

  test('GET /api/search — returns 400 when q is missing', async ({ request }) => {
    const response = await request.get('/api/search');
    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('GET /api/search — supports type filter', async ({ request }) => {
    const response = await request.get('/api/search?q=deployment&type=messages');
    expect(response.status()).toBe(200);

    const data = await response.json() as Record<string, unknown>;
    const results = data.results as Record<string, unknown>[];
    if (results.length > 0) {
      expect(results[0].type).toBe('message');
    }
  });

  test('GET /api/search — supports in filter', async ({ request }) => {
    const response = await request.get('/api/search?q=deployment&in=engineering');
    expect(response.status()).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// 14. Activity API — /api/activity
// ---------------------------------------------------------------------------

test.describe('Activity API', () => {
  test('GET /api/activity?user_id=1 — returns 200 with array', async ({ request }) => {
    const response = await request.get('/api/activity?user_id=1');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('GET /api/activity?user_id=1 — each item has required fields', async ({ request }) => {
    const response = await request.get('/api/activity?user_id=1');
    const data = await response.json();

    const fields = [
      'id', 'type', 'message_id', 'channel_id', 'channel_name',
      'actor_username', 'actor_avatar_color', 'content', 'created_at', 'read',
    ];
    expectArrayOfObjects(data, fields);

    // Validate type is one of the expected values
    if (Array.isArray(data) && data.length > 0) {
      const item = data[0] as Record<string, unknown>;
      expect(['mention', 'thread_reply', 'reaction', 'app_notification']).toContain(item.type);
      expect(typeof item.read).toBe('boolean');
    }
  });

  test('GET /api/activity — returns 400 when user_id is missing', async ({ request }) => {
    const response = await request.get('/api/activity');
    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });
});

// ---------------------------------------------------------------------------
// 15. Files API — /api/files
// ---------------------------------------------------------------------------

test.describe('Files API', () => {
  test('GET /api/files — returns 200 with array', async ({ request }) => {
    const response = await request.get('/api/files');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('GET /api/files — each file has required fields', async ({ request }) => {
    const response = await request.get('/api/files');
    const data = await response.json();

    const fields = [
      'id', 'name', 'file_type', 'file_size', 'uploaded_by',
      'uploader_name', 'channel_id', 'channel_name', 'thumbnail_url', 'created_at',
    ];
    expectArrayOfObjects(data, fields);
  });

  test('GET /api/files — supports channel_id filter', async ({ request }) => {
    const response = await request.get('/api/files?channel_id=1');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('GET /api/files — supports type filter', async ({ request }) => {
    const response = await request.get('/api/files?type=image');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('POST /api/files — returns 201 with valid body', async ({ request }) => {
    const response = await request.post('/api/files', {
      data: {
        name: 'test-file.pdf',
        file_type: 'pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
        uploaded_by: 1,
        channel_id: 1,
      },
    });
    expect(response.status()).toBe(201);

    const data = await response.json();
    expectFields(data as Record<string, unknown>, [
      'id', 'name', 'file_type', 'file_size', 'uploaded_by', 'channel_id', 'created_at',
    ]);
  });

  test('POST /api/files — returns 400 when required fields missing', async ({ request }) => {
    const response = await request.post('/api/files', {
      data: { name: 'incomplete.pdf' },
    });
    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });
});

// ---------------------------------------------------------------------------
// 16. Saved Items API — /api/saved
// ---------------------------------------------------------------------------

test.describe('Saved Items API', () => {
  test('GET /api/saved?user_id=1 — returns 200 with array', async ({ request }) => {
    const response = await request.get('/api/saved?user_id=1');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('GET /api/saved?user_id=1 — each item has required fields', async ({ request }) => {
    const response = await request.get('/api/saved?user_id=1');
    const data = await response.json();

    const fields = [
      'id', 'user_id', 'message_id', 'file_id', 'content',
      'channel_name', 'username', 'saved_at',
    ];
    expectArrayOfObjects(data, fields);
  });

  test('GET /api/saved — returns 400 when user_id is missing', async ({ request }) => {
    const response = await request.get('/api/saved');
    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('POST /api/saved — returns 201 with valid body', async ({ request }) => {
    const response = await request.post('/api/saved', {
      data: { user_id: 1, message_id: 1 },
    });
    // Accept 201 Created or 409 Conflict if already saved
    expect([201, 409]).toContain(response.status());

    if (response.status() === 201) {
      const data = await response.json();
      expectFields(data as Record<string, unknown>, ['id', 'user_id', 'message_id', 'saved_at']);
    }
  });

  test('POST /api/saved — returns 400 when required fields missing', async ({ request }) => {
    const response = await request.post('/api/saved', {
      data: {},
    });
    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('DELETE /api/saved — returns 200 or 404', async ({ request }) => {
    // First save an item so we can delete it
    const saveResponse = await request.post('/api/saved', {
      data: { user_id: 2, message_id: 3 },
    });

    let savedId = 999;
    if (saveResponse.status() === 201) {
      const saveData = await saveResponse.json() as Record<string, unknown>;
      savedId = saveData.id as number;
    }

    const response = await request.delete(`/api/saved?id=${savedId}&user_id=2`);
    expect([200, 404]).toContain(response.status());
  });
});

// ---------------------------------------------------------------------------
// 17. User Profile API — /api/users/:id
// ---------------------------------------------------------------------------

test.describe('User Profile API', () => {
  test('GET /api/users/1 — returns 200 with user profile', async ({ request }) => {
    const response = await request.get('/api/users/1');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(typeof data).toBe('object');
    expect(Array.isArray(data)).toBe(false);
  });

  test('GET /api/users/1 — profile has required fields', async ({ request }) => {
    const response = await request.get('/api/users/1');
    const data = await response.json() as Record<string, unknown>;

    const fields = [
      'id', 'username', 'avatar_color', 'display_name', 'title',
      'status_emoji', 'status_text', 'timezone', 'email', 'phone', 'created_at',
    ];
    expectFields(data, fields);
  });

  test('GET /api/users/1 — profile field types are correct', async ({ request }) => {
    const response = await request.get('/api/users/1');
    const data = await response.json() as Record<string, unknown>;

    expect(typeof data.id).toBe('number');
    expect(typeof data.username).toBe('string');
    expect(typeof data.avatar_color).toBe('string');
    expect(typeof data.created_at).toBe('string');
    // Nullable fields may be string or null
    expect(data.timezone === null || typeof data.timezone === 'string').toBeTruthy();
  });

  test('GET /api/users/99999 — returns 404 for non-existent user', async ({ request }) => {
    const response = await request.get('/api/users/99999');
    expect(response.status()).toBe(404);

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });
});

// ---------------------------------------------------------------------------
// 18. User Status API — /api/users/:id/status
// ---------------------------------------------------------------------------

test.describe('User Status API', () => {
  test('GET /api/users/1/status — returns 200 with status', async ({ request }) => {
    const response = await request.get('/api/users/1/status');
    expect(response.status()).toBe(200);

    const data = await response.json() as Record<string, unknown>;
    expectFields(data, ['user_id', 'status_emoji', 'status_text', 'expires_at', 'updated_at']);
  });

  test('GET /api/users/1/status — field types are correct', async ({ request }) => {
    const response = await request.get('/api/users/1/status');
    const data = await response.json() as Record<string, unknown>;

    expect(typeof data.user_id).toBe('number');
    // status_emoji, status_text, expires_at can be string or null
    expect(data.status_emoji === null || typeof data.status_emoji === 'string').toBeTruthy();
    expect(data.status_text === null || typeof data.status_text === 'string').toBeTruthy();
    expect(data.expires_at === null || typeof data.expires_at === 'string').toBeTruthy();
    expect(typeof data.updated_at).toBe('string');
  });

  test('PUT /api/users/1/status — returns 200 with valid body', async ({ request }) => {
    const response = await request.put('/api/users/1/status', {
      data: {
        emoji: '🏠',
        text: 'Working from home',
      },
    });
    expect(response.status()).toBe(200);

    const data = await response.json() as Record<string, unknown>;
    expectFields(data, ['user_id', 'status_emoji', 'status_text', 'updated_at']);
    expect(data.status_emoji).toBe('🏠');
    expect(data.status_text).toBe('Working from home');
  });

  test('GET /api/users/99999/status — returns 404 for non-existent user', async ({ request }) => {
    const response = await request.get('/api/users/99999/status');
    expect(response.status()).toBe(404);

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });
});

// ---------------------------------------------------------------------------
// 19. Workspace API — /api/workspace
// ---------------------------------------------------------------------------

test.describe('Workspace API', () => {
  test('GET /api/workspace — returns 200 with workspace object', async ({ request }) => {
    const response = await request.get('/api/workspace');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(typeof data).toBe('object');
    expect(Array.isArray(data)).toBe(false);
  });

  test('GET /api/workspace — has required fields', async ({ request }) => {
    const response = await request.get('/api/workspace');
    const data = await response.json() as Record<string, unknown>;

    const fields = ['id', 'name', 'icon_url', 'member_count', 'plan', 'created_at'];
    expectFields(data, fields);
  });

  test('GET /api/workspace — field types are correct', async ({ request }) => {
    const response = await request.get('/api/workspace');
    const data = await response.json() as Record<string, unknown>;

    expect(typeof data.id).toBe('number');
    expect(typeof data.name).toBe('string');
    expect(data.icon_url === null || typeof data.icon_url === 'string').toBeTruthy();
    expect(typeof data.member_count).toBe('number');
    expect(typeof data.plan).toBe('string');
    expect(typeof data.created_at).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// 20. Preferences API — /api/preferences
// ---------------------------------------------------------------------------

test.describe('Preferences API', () => {
  test('GET /api/preferences?user_id=1 — returns 200 with preferences object', async ({ request }) => {
    const response = await request.get('/api/preferences?user_id=1');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(typeof data).toBe('object');
    expect(Array.isArray(data)).toBe(false);
  });

  test('GET /api/preferences?user_id=1 — has required fields', async ({ request }) => {
    const response = await request.get('/api/preferences?user_id=1');
    const data = await response.json() as Record<string, unknown>;

    const fields = [
      'id', 'user_id', 'notification_sound', 'notification_desktop',
      'sidebar_sort', 'theme', 'language', 'timezone', 'updated_at',
    ];
    expectFields(data, fields);
  });

  test('GET /api/preferences?user_id=1 — field types are correct', async ({ request }) => {
    const response = await request.get('/api/preferences?user_id=1');
    const data = await response.json() as Record<string, unknown>;

    expect(typeof data.id).toBe('number');
    expect(typeof data.user_id).toBe('number');
    expect(typeof data.notification_sound).toBe('boolean');
    expect(typeof data.notification_desktop).toBe('boolean');
    expect(typeof data.sidebar_sort).toBe('string');
    expect(['alpha', 'recent', 'priority']).toContain(data.sidebar_sort);
    expect(typeof data.theme).toBe('string');
    expect(['light', 'dark', 'system']).toContain(data.theme);
    expect(typeof data.language).toBe('string');
    expect(typeof data.timezone).toBe('string');
  });

  test('GET /api/preferences — returns 400 when user_id is missing', async ({ request }) => {
    const response = await request.get('/api/preferences');
    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('PUT /api/preferences — returns 200 with valid body', async ({ request }) => {
    const response = await request.put('/api/preferences', {
      data: { user_id: 1, theme: 'dark' },
    });
    expect(response.status()).toBe(200);

    const data = await response.json() as Record<string, unknown>;
    expect(data.theme).toBe('dark');
    expect(data.user_id).toBe(1);

    // Restore original value
    await request.put('/api/preferences', {
      data: { user_id: 1, theme: 'light' },
    });
  });

  test('PUT /api/preferences — returns 400 when user_id is missing', async ({ request }) => {
    const response = await request.put('/api/preferences', {
      data: { theme: 'dark' },
    });
    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });
});

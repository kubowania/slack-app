-- Slack Clone Database Schema

-- Drop new tables first (most dependent tables dropped first, respecting FK order)
DROP TABLE IF EXISTS mentions CASCADE;
DROP TABLE IF EXISTS saved_items CASCADE;
DROP TABLE IF EXISTS pins CASCADE;
DROP TABLE IF EXISTS reactions CASCADE;
DROP TABLE IF EXISTS dm_messages CASCADE;
DROP TABLE IF EXISTS dm_members CASCADE;
DROP TABLE IF EXISTS direct_messages CASCADE;
DROP TABLE IF EXISTS files CASCADE;
DROP TABLE IF EXISTS channel_members CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS user_statuses CASCADE;
DROP TABLE IF EXISTS threads CASCADE;
DROP TABLE IF EXISTS workspace CASCADE;
-- Drop existing tables
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS channels CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  avatar_color VARCHAR(7) DEFAULT '#6B7280',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE channels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(80) UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  channel_id INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- New tables supporting expanded Slack clone features

CREATE TABLE threads (
  id SERIAL PRIMARY KEY,
  parent_message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  reply_message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  channel_id INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  reply_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE reactions (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (message_id, user_id, emoji)
);

CREATE TABLE pins (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  channel_id INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  pinned_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (message_id)
);

CREATE TABLE direct_messages (
  id SERIAL PRIMARY KEY,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_group BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE dm_members (
  id SERIAL PRIMARY KEY,
  dm_id INTEGER NOT NULL REFERENCES direct_messages(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE dm_messages (
  id SERIAL PRIMARY KEY,
  dm_id INTEGER NOT NULL REFERENCES direct_messages(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE files (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER DEFAULT 0,
  uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel_id INTEGER REFERENCES channels(id) ON DELETE SET NULL,
  thumbnail_url VARCHAR(500) DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE channel_members (
  id SERIAL PRIMARY KEY,
  channel_id INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_statuses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status_emoji VARCHAR(50) DEFAULT '',
  status_text VARCHAR(200) DEFAULT '',
  display_name VARCHAR(100) DEFAULT '',
  title VARCHAR(200) DEFAULT '',
  timezone VARCHAR(50) DEFAULT 'UTC',
  email VARCHAR(255) DEFAULT '',
  phone VARCHAR(50) DEFAULT '',
  expires_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE workspace (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon_url VARCHAR(500) DEFAULT '',
  member_count INTEGER DEFAULT 0,
  plan VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_sound BOOLEAN DEFAULT TRUE,
  notification_desktop BOOLEAN DEFAULT TRUE,
  sidebar_sort VARCHAR(20) DEFAULT 'alpha',
  theme VARCHAR(20) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'UTC',
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE saved_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
  file_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
  saved_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE mentions (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  mentioned_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel_id INTEGER REFERENCES channels(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for existing tables
CREATE INDEX idx_messages_channel ON messages(channel_id);
CREATE INDEX idx_messages_created ON messages(created_at);

-- Indexes for new tables
CREATE INDEX idx_threads_parent ON threads(parent_message_id);
CREATE INDEX idx_threads_reply ON threads(reply_message_id);
CREATE INDEX idx_threads_channel ON threads(channel_id);
CREATE INDEX idx_reactions_message ON reactions(message_id);
CREATE INDEX idx_pins_channel ON pins(channel_id);
CREATE INDEX idx_dm_members_dm ON dm_members(dm_id);
CREATE INDEX idx_dm_members_user ON dm_members(user_id);
CREATE INDEX idx_dm_messages_dm ON dm_messages(dm_id);
CREATE INDEX idx_files_channel ON files(channel_id);
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX idx_channel_members_channel ON channel_members(channel_id);
CREATE INDEX idx_channel_members_user ON channel_members(user_id);
CREATE INDEX idx_saved_items_user ON saved_items(user_id);
CREATE INDEX idx_mentions_user ON mentions(mentioned_user_id);
CREATE INDEX idx_mentions_message ON mentions(message_id);

-- Seed data

-- Existing seed data (3 users, 3 channels, 7 messages) — preserved exactly as-is
INSERT INTO users (username, avatar_color) VALUES
  ('alice',   '#EF4444'),
  ('bob',     '#3B82F6'),
  ('charlie', '#10B981');

INSERT INTO channels (name, description, created_by) VALUES
  ('general',      'Company-wide announcements and chat', 1),
  ('random',       'Non-work banter and water cooler chat', 1),
  ('engineering',  'Engineering team discussion', 2);

INSERT INTO messages (channel_id, user_id, content) VALUES
  (1, 1, 'Welcome to the general channel!'),
  (1, 2, 'Hey everyone, glad to be here!'),
  (1, 3, 'Hello world!'),
  (2, 2, 'Anyone watch the game last night?'),
  (2, 1, 'It was amazing!'),
  (3, 2, 'Just pushed the new deployment pipeline.'),
  (3, 3, 'Nice work! I will review it today.');

-- New seed data for expanded tables

-- Workspace metadata
INSERT INTO workspace (name, icon_url, member_count, plan) VALUES
  ('Acme Corp', '/acme-icon.png', 3, 'pro');

-- User statuses with profile details
INSERT INTO user_statuses (user_id, status_emoji, status_text, display_name, title, timezone, email, phone) VALUES
  (1, '🏠', 'Working from home', 'Alice Johnson', 'Senior Engineer', 'America/New_York', 'alice@acme.com', '+1-555-0101'),
  (2, '📅', 'In a meeting', 'Bob Smith', 'Product Manager', 'America/Chicago', 'bob@acme.com', '+1-555-0102'),
  (3, '', '', 'Charlie Brown', 'Designer', 'America/Los_Angeles', 'charlie@acme.com', '+1-555-0103');

-- Channel membership with roles
INSERT INTO channel_members (channel_id, user_id, role) VALUES
  (1, 1, 'admin'), (1, 2, 'member'), (1, 3, 'member'),
  (2, 1, 'member'), (2, 2, 'admin'), (2, 3, 'member'),
  (3, 2, 'admin'), (3, 3, 'member');

-- Thread reply messages (new messages serving as thread replies)
-- These become message IDs 8, 9, 10 (after the existing 7 messages)
INSERT INTO messages (channel_id, user_id, content) VALUES
  (1, 2, 'Thanks Alice, great to be here!'),
  (1, 3, 'Welcome channel is the best!'),
  (3, 3, 'Looks good! Ship it!');

-- Threads: junction table linking parent messages to their reply messages
-- Message 1 (general: "Welcome to the general channel!") has 2 replies (messages 8, 9)
-- Message 6 (engineering: "Just pushed the new deployment pipeline.") has 1 reply (message 10)
INSERT INTO threads (parent_message_id, reply_message_id, channel_id, reply_count, last_reply_at) VALUES
  (1, 8, 1, 2, NOW()),
  (1, 9, 1, 2, NOW()),
  (6, 10, 3, 1, NOW());

-- Reactions on existing messages
INSERT INTO reactions (message_id, user_id, emoji) VALUES
  (1, 2, '👋'), (1, 3, '👋'),
  (2, 1, '❤️'),
  (6, 3, '🚀'), (6, 1, '👍'),
  (7, 2, '✅');

-- Pinned messages
INSERT INTO pins (message_id, channel_id, pinned_by) VALUES
  (1, 1, 1),
  (6, 3, 2);

-- Direct message conversations
INSERT INTO direct_messages (created_by, is_group) VALUES
  (1, FALSE),
  (2, TRUE);

-- DM conversation membership
INSERT INTO dm_members (dm_id, user_id) VALUES
  (1, 1), (1, 2),
  (2, 1), (2, 2), (2, 3);

-- DM messages within conversations
INSERT INTO dm_messages (dm_id, user_id, content) VALUES
  (1, 1, 'Hey Bob, can you review my PR?'),
  (1, 2, 'Sure, I will take a look this afternoon!'),
  (2, 2, 'Team standup in 5 minutes!'),
  (2, 1, 'On my way!'),
  (2, 3, 'Joining now');

-- Shared files across workspace channels
INSERT INTO files (name, file_type, file_size, uploaded_by, channel_id, thumbnail_url) VALUES
  ('Q3-report.pdf', 'pdf', 2048576, 1, 1, '/thumbnails/pdf-icon.png'),
  ('architecture-diagram.png', 'image', 512000, 2, 3, '/thumbnails/arch-diagram-thumb.png'),
  ('meeting-notes.md', 'markdown', 4096, 3, 2, '/thumbnails/md-icon.png'),
  ('deploy-script.sh', 'script', 1024, 2, 3, '/thumbnails/script-icon.png');

-- Saved/bookmarked items (messages and files)
INSERT INTO saved_items (user_id, message_id) VALUES
  (1, 6),
  (2, 1);
INSERT INTO saved_items (user_id, file_id) VALUES
  (1, 1);

-- Mentions in messages
INSERT INTO mentions (message_id, mentioned_user_id, channel_id, read) VALUES
  (2, 1, 1, TRUE),
  (7, 2, 3, FALSE);

-- User notification and display preferences
INSERT INTO user_preferences (user_id, notification_sound, notification_desktop, sidebar_sort, theme) VALUES
  (1, TRUE, TRUE, 'alpha', 'light'),
  (2, TRUE, FALSE, 'recent', 'dark'),
  (3, FALSE, TRUE, 'alpha', 'light');

-- Slack Clone Database Schema

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

CREATE INDEX idx_messages_channel ON messages(channel_id);
CREATE INDEX idx_messages_created ON messages(created_at);

-- Seed data
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

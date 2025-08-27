-- D1 Database Schema for Cloudflare Tech Talk Presentations
-- This schema stores presentation templates and slide content
-- Real-time session data (participants, votes) is stored in Durable Object SQL

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 1
);

-- Sessions table for managing user sessions
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Presentations table: stores presentation metadata
CREATE TABLE IF NOT EXISTS presentations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  description TEXT,
  created_by TEXT,
  pin_code TEXT,
  user_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 1,
  adventure_config TEXT, -- JSON for adventure/flow configuration
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Slides table: stores individual slide content
CREATE TABLE IF NOT EXISTS slides (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  presentation_id TEXT NOT NULL,
  order_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT, -- JSON array of content strings
  bullets TEXT, -- JSON array of bullet points
  gif TEXT, -- URL to GIF image
  slide_type TEXT DEFAULT 'standard', -- 'initial', 'bio', 'standard', 'poll'
  poll_question TEXT,
  poll_options TEXT, -- JSON array of {id, label, emoji}
  poll_routes TEXT, -- JSON object mapping option_id to next_slide_id
  is_bio_slide BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (presentation_id) REFERENCES presentations(id) ON DELETE CASCADE,
  UNIQUE(presentation_id, order_number)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_slides_presentation ON slides(presentation_id);
CREATE INDEX IF NOT EXISTS idx_slides_order ON slides(presentation_id, order_number);
CREATE INDEX IF NOT EXISTS idx_presentations_active ON presentations(is_active);
CREATE INDEX IF NOT EXISTS idx_presentations_user ON presentations(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- Trigger to update the updated_at timestamp for presentations
CREATE TRIGGER IF NOT EXISTS update_presentations_timestamp 
AFTER UPDATE ON presentations
BEGIN
  UPDATE presentations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger to update the updated_at timestamp for users
CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
AFTER UPDATE ON users
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
-- Migration 001: Initial schema for presentations and slides
-- Run this migration to set up the D1 database

-- Presentations table: stores presentation metadata
CREATE TABLE IF NOT EXISTS presentations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  description TEXT,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 1,
  adventure_config TEXT -- JSON for adventure/flow configuration
);

-- Slides table: stores individual slide content
CREATE TABLE IF NOT EXISTS slides (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  presentation_id TEXT NOT NULL,
  order_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT, -- JSON array of content strings
  bullets TEXT, -- JSON array of bullet points
  slide_type TEXT DEFAULT 'standard', -- 'standard', 'poll', 'bio'
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

-- Trigger to update the updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_presentations_timestamp 
AFTER UPDATE ON presentations
BEGIN
  UPDATE presentations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
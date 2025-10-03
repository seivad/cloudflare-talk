-- Migration: Add presentation collaborators pivot table
-- This allows multiple users to work on the same presentation

-- Pivot table for presentation collaborators
CREATE TABLE IF NOT EXISTS presentation_collaborators (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  presentation_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  added_by TEXT NOT NULL,
  FOREIGN KEY (presentation_id) REFERENCES presentations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (added_by) REFERENCES users(id),
  UNIQUE(presentation_id, user_id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_collaborators_presentation
  ON presentation_collaborators(presentation_id);

CREATE INDEX IF NOT EXISTS idx_collaborators_user
  ON presentation_collaborators(user_id);

CREATE INDEX IF NOT EXISTS idx_collaborators_added_by
  ON presentation_collaborators(added_by);

-- Polls table
CREATE TABLE IF NOT EXISTS polls (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    ended_at INTEGER,
    winner_option_id TEXT
);

-- Poll options table
CREATE TABLE IF NOT EXISTS poll_options (
    id TEXT PRIMARY KEY,
    poll_id TEXT NOT NULL,
    label TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (poll_id) REFERENCES polls(id)
);

-- Votes table (one vote per user per poll)
CREATE TABLE IF NOT EXISTS votes (
    poll_id TEXT NOT NULL,
    option_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    PRIMARY KEY (poll_id, user_id),
    FOREIGN KEY (poll_id) REFERENCES polls(id),
    FOREIGN KEY (option_id) REFERENCES poll_options(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_votes_poll_option ON votes(poll_id, option_id);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll ON poll_options(poll_id);

-- View for vote counts
CREATE VIEW IF NOT EXISTS vote_counts AS
SELECT 
    po.poll_id,
    po.id as option_id,
    po.label,
    COUNT(v.user_id) as vote_count
FROM poll_options po
LEFT JOIN votes v ON po.id = v.option_id AND po.poll_id = v.poll_id
GROUP BY po.poll_id, po.id, po.label;
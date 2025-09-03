-- Migration to add AI Poll support to slides table
-- This migration adds support for AI-generated content polls

-- Add new columns for AI Poll functionality
ALTER TABLE slides 
ADD COLUMN ai_poll_prompts TEXT DEFAULT NULL;

ALTER TABLE slides 
ADD COLUMN generated_content_url TEXT DEFAULT NULL;

-- Update slide_type check constraint to include 'ai_poll'
-- Note: SQLite doesn't support ALTER COLUMN, so we need to recreate the table
-- However, since CloudFlare D1 uses SQLite, we'll just document the allowed values
-- The application will handle validation

-- Create an index for faster queries on slide type
CREATE INDEX IF NOT EXISTS idx_slides_type ON slides(slide_type);

-- Add comment to document allowed slide types
-- slide_type can be: 'standard', 'poll', 'bio', 'ai_poll'
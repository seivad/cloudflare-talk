// Script to import the default presentation into D1
// Run with: npx wrangler d1 execute tech-talk-db --command "SELECT 1" --json | node src/scripts/import-presentation.js

import { Hono } from 'hono';
import { runImport } from '../utils/import-json';

interface Env {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

// Special route for importing data
app.post('/admin/import-default', async (c) => {
  try {
    const presentationId = await runImport(c.env.DB);
    return c.json({ 
      success: true, 
      presentationId,
      message: 'Default presentation imported successfully'
    });
  } catch (error) {
    console.error('Import failed:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default app;
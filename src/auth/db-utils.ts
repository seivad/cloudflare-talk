import { D1Database } from '@cloudflare/workers-types';

export interface User {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

// User management functions
export async function getUserByEmail(db: D1Database, email: string): Promise<User | null> {
  const result = await db.prepare(
    'SELECT * FROM users WHERE email = ? AND is_active = 1'
  ).bind(email).first();
  
  return result as User | null;
}

export async function getUserById(db: D1Database, id: string): Promise<User | null> {
  const result = await db.prepare(
    'SELECT * FROM users WHERE id = ? AND is_active = 1'
  ).bind(id).first();
  
  return result as User | null;
}

export async function createUser(
  db: D1Database,
  data: { email: string; name: string; passwordHash: string }
): Promise<string> {
  const id = crypto.randomUUID().replace(/-/g, '').toLowerCase();
  
  await db.prepare(
    `INSERT INTO users (id, email, name, password_hash) 
     VALUES (?, ?, ?, ?)`
  ).bind(id, data.email, data.name, data.passwordHash).run();
  
  return id;
}

export async function getUserCount(db: D1Database): Promise<number> {
  const result = await db.prepare(
    'SELECT COUNT(*) as count FROM users WHERE is_active = 1'
  ).first();
  
  return result?.count as number || 0;
}

// Session management
export async function createSession(
  db: D1Database,
  userId: string,
  token: string,
  expiresIn: number = 86400 // 24 hours in seconds
): Promise<string> {
  const id = crypto.randomUUID().replace(/-/g, '').toLowerCase();
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
  
  await db.prepare(
    `INSERT INTO sessions (id, user_id, token, expires_at) 
     VALUES (?, ?, ?, ?)`
  ).bind(id, userId, token, expiresAt).run();
  
  return id;
}

export async function getSessionByToken(db: D1Database, token: string): Promise<Session | null> {
  const result = await db.prepare(
    `SELECT * FROM sessions 
     WHERE token = ? AND expires_at > datetime('now')`
  ).bind(token).first();
  
  return result as Session | null;
}

export async function deleteSession(db: D1Database, token: string): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
}

export async function cleanupExpiredSessions(db: D1Database): Promise<void> {
  await db.prepare(
    "DELETE FROM sessions WHERE expires_at < datetime('now')"
  ).run();
}

// Presentation management with user ownership
export async function getUserPresentations(db: D1Database, userId: string): Promise<any[]> {
  const result = await db.prepare(
    `SELECT p.*, 
            (SELECT COUNT(*) FROM slides WHERE presentation_id = p.id) as slide_count
     FROM presentations p 
     WHERE p.user_id = ? AND p.is_active = 1 
     ORDER BY p.updated_at DESC`
  ).bind(userId).all();
  
  return result.results || [];
}

export async function getPresentationWithOwnerCheck(
  db: D1Database, 
  presentationId: string, 
  userId: string
): Promise<any | null> {
  const result = await db.prepare(
    'SELECT * FROM presentations WHERE id = ? AND user_id = ? AND is_active = 1'
  ).bind(presentationId, userId).first();
  
  return result;
}

export async function updatePresentation(
  db: D1Database,
  presentationId: string,
  userId: string,
  data: { name?: string; description?: string; pin_code?: string }
): Promise<boolean> {
  const updates: string[] = [];
  const values: any[] = [];
  
  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  
  if (data.description !== undefined) {
    updates.push('description = ?');
    values.push(data.description);
  }
  
  if (data.pin_code !== undefined) {
    updates.push('pin_code = ?');
    values.push(data.pin_code);
  }
  
  if (updates.length === 0) return false;
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(presentationId, userId);
  
  const result = await db.prepare(
    `UPDATE presentations 
     SET ${updates.join(', ')} 
     WHERE id = ? AND user_id = ? AND is_active = 1`
  ).bind(...values).run();
  
  return result.meta.changes > 0;
}

export async function generatePinCode(): string {
  // Generate a 6-digit PIN
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Slide management with ownership check
export async function getSlidesForPresentation(
  db: D1Database,
  presentationId: string,
  userId: string
): Promise<any[]> {
  // First verify ownership
  const presentation = await getPresentationWithOwnerCheck(db, presentationId, userId);
  if (!presentation) return [];
  
  const result = await db.prepare(
    `SELECT * FROM slides 
     WHERE presentation_id = ? 
     ORDER BY order_number ASC`
  ).bind(presentationId).all();
  
  return result.results || [];
}

export async function createSlide(
  db: D1Database,
  userId: string,
  data: {
    presentation_id: string;
    title: string;
    content?: string;
    bullets?: string;
    gif?: string;
    slide_type?: string;
    poll_question?: string;
    poll_options?: string;
    poll_routes?: string;
    is_bio_slide?: boolean;
  }
): Promise<string | null> {
  // Verify ownership
  const presentation = await getPresentationWithOwnerCheck(db, data.presentation_id, userId);
  if (!presentation) return null;
  
  // Get the next order number
  const maxOrder = await db.prepare(
    'SELECT MAX(order_number) as max_order FROM slides WHERE presentation_id = ?'
  ).bind(data.presentation_id).first();
  
  const orderNumber = (maxOrder?.max_order ?? -1) + 1;
  const id = crypto.randomUUID().replace(/-/g, '').toLowerCase();
  
  await db.prepare(
    `INSERT INTO slides (
      id, presentation_id, order_number, title, content, bullets, gif,
      slide_type, poll_question, poll_options, poll_routes, is_bio_slide
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    data.presentation_id,
    orderNumber,
    data.title,
    data.content || null,
    data.bullets || null,
    data.gif || null,
    data.slide_type || 'standard',
    data.poll_question || null,
    data.poll_options || null,
    data.poll_routes || null,
    data.is_bio_slide ? 1 : 0
  ).run();
  
  return id;
}

export async function updateSlide(
  db: D1Database,
  slideId: string,
  userId: string,
  data: any
): Promise<boolean> {
  // Get slide and verify ownership through presentation
  const slide = await db.prepare(
    `SELECT s.*, p.user_id 
     FROM slides s 
     JOIN presentations p ON s.presentation_id = p.id 
     WHERE s.id = ?`
  ).bind(slideId).first();
  
  if (!slide || slide.user_id !== userId) return false;
  
  const updates: string[] = [];
  const values: any[] = [];
  
  const fields = [
    'title', 'content', 'bullets', 'gif', 'slide_type',
    'poll_question', 'poll_options', 'poll_routes'
  ];
  
  for (const field of fields) {
    if (data[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(data[field]);
    }
  }
  
  if (data.is_bio_slide !== undefined) {
    updates.push('is_bio_slide = ?');
    values.push(data.is_bio_slide ? 1 : 0);
  }
  
  if (updates.length === 0) return false;
  
  values.push(slideId);
  
  const result = await db.prepare(
    `UPDATE slides SET ${updates.join(', ')} WHERE id = ?`
  ).bind(...values).run();
  
  return result.meta.changes > 0;
}

export async function deleteSlide(
  db: D1Database,
  slideId: string,
  userId: string
): Promise<boolean> {
  try {
    // Verify ownership through presentation
    const slide = await db.prepare(
      `SELECT s.*, p.user_id 
       FROM slides s 
       JOIN presentations p ON s.presentation_id = p.id 
       WHERE s.id = ?`
    ).bind(slideId).first();
    
    if (!slide) {
      console.log(`Slide ${slideId} not found`);
      return false;
    }
    
    if (slide.user_id !== userId) {
      console.log(`User ${userId} not authorized to delete slide ${slideId}`);
      return false;
    }
    
    // Delete the slide
    const deleteResult = await db.prepare('DELETE FROM slides WHERE id = ?').bind(slideId).run();
    console.log(`Delete result:`, deleteResult.meta);
    
    // Reorder remaining slides
    const reorderResult = await db.prepare(
      `UPDATE slides 
       SET order_number = order_number - 1 
       WHERE presentation_id = ? AND order_number > ?`
    ).bind(slide.presentation_id, slide.order_number).run();
    console.log(`Reordered ${reorderResult.meta.changes} slides`);
    
    return true;
  } catch (error) {
    console.error('Error in deleteSlide:', error);
    throw error; // Re-throw to let the caller handle it
  }
}

export async function reorderSlides(
  db: D1Database,
  presentationId: string,
  userId: string,
  slideIds: string[]
): Promise<boolean> {
  // Verify ownership
  const presentation = await getPresentationWithOwnerCheck(db, presentationId, userId);
  if (!presentation) return false;
  
  try {
    // First, set all slides to temporary negative order numbers to avoid conflicts
    // This prevents unique constraint violations during reordering
    for (let i = 0; i < slideIds.length; i++) {
      await db.prepare(
        'UPDATE slides SET order_number = ? WHERE id = ? AND presentation_id = ?'
      ).bind(-(i + 1), slideIds[i], presentationId).run();
    }
    
    // Now set them to their final positions
    for (let i = 0; i < slideIds.length; i++) {
      await db.prepare(
        'UPDATE slides SET order_number = ? WHERE id = ? AND presentation_id = ?'
      ).bind(i, slideIds[i], presentationId).run();
    }
    
    return true;
  } catch (error) {
    console.error('Error reordering slides:', error);
    return false;
  }
}
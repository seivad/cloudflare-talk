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

// Create a new user (by an existing authenticated user)
export async function createUserByAdmin(
  db: D1Database,
  data: { email: string; name: string; password: string; passwordConfirmation: string }
): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    // Validate password
    if (data.password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' };
    }

    if (data.password !== data.passwordConfirmation) {
      return { success: false, error: 'Passwords do not match' };
    }

    // Check if email already exists
    const existing = await getUserByEmail(db, data.email);
    if (existing) {
      return { success: false, error: 'Email already exists' };
    }

    // Import bcrypt dynamically (it's already in dependencies)
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create the user
    const id = crypto.randomUUID().replace(/-/g, '').toLowerCase();

    await db.prepare(
      `INSERT INTO users (id, email, name, password_hash)
       VALUES (?, ?, ?, ?)`
    ).bind(id, data.email, data.name, passwordHash).run();

    return { success: true, userId: id };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: 'Failed to create user' };
  }
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
    // Validate PIN: cannot be empty
    if (!data.pin_code || data.pin_code.trim().length === 0) {
      console.error('PIN cannot be empty');
      return false;
    }
    updates.push('pin_code = ?');
    values.push(data.pin_code.trim());
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
    ai_poll_prompts?: string;
    is_bio_slide?: boolean;
  }
): Promise<string | null> {
  // Verify access (owner or collaborator)
  const presentation = await getPresentationWithAccess(db, data.presentation_id, userId);
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
      slide_type, poll_question, poll_options, poll_routes, ai_poll_prompts, is_bio_slide
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
    data.ai_poll_prompts || null,
    data.is_bio_slide ? 1 : 0
  ).run();

  return id;
}

export async function updateSlide(
  db: D1Database,
  slideId: string,
  userId: string | undefined,
  data: any
): Promise<boolean> {
  // Get slide info
  const slide = await db.prepare(
    `SELECT s.*, p.user_id, p.id as presentation_id
     FROM slides s
     JOIN presentations p ON s.presentation_id = p.id
     WHERE s.id = ?`
  ).bind(slideId).first();

  if (!slide) return false;

  // If userId is provided, verify access (owner or collaborator)
  if (userId) {
    const hasAccess = await getPresentationWithAccess(db, slide.presentation_id, userId);
    if (!hasAccess) return false;
  }

  const updates: string[] = [];
  const values: any[] = [];

  const fields = [
    'title', 'content', 'bullets', 'gif', 'slide_type',
    'poll_question', 'poll_options', 'poll_routes', 'ai_poll_prompts', 'generated_content_url'
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
    // Get slide and verify access through presentation
    const slide = await db.prepare(
      `SELECT s.*, p.user_id, p.id as presentation_id
       FROM slides s
       JOIN presentations p ON s.presentation_id = p.id
       WHERE s.id = ?`
    ).bind(slideId).first();

    if (!slide) {
      console.log(`Slide ${slideId} not found`);
      return false;
    }

    // Verify access (owner or collaborator)
    const hasAccess = await getPresentationWithAccess(db, slide.presentation_id, userId);
    if (!hasAccess) {
      console.log(`User ${userId} not authorized to delete slide ${slideId}`);
      return false;
    }

    // Use a transaction to ensure atomicity
    const statements = [];

    // Delete the slide first
    statements.push(
      db.prepare('DELETE FROM slides WHERE id = ?').bind(slideId)
    );

    // Get all slides that need reordering
    const slidesToReorder = await db.prepare(
      `SELECT id, order_number FROM slides
       WHERE presentation_id = ? AND order_number > ?
       ORDER BY order_number`
    ).bind(slide.presentation_id, slide.order_number).all();

    // Reorder each slide individually to avoid constraint violations
    let newOrder = slide.order_number;
    for (const slideToReorder of slidesToReorder.results) {
      statements.push(
        db.prepare('UPDATE slides SET order_number = ? WHERE id = ?')
          .bind(newOrder, slideToReorder.id)
      );
      newOrder++;
    }

    // Execute all statements in a batch
    const results = await db.batch(statements);
    console.log(`Deleted slide and reordered ${slidesToReorder.results.length} slides`);

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
  // Verify access (owner or collaborator)
  const presentation = await getPresentationWithAccess(db, presentationId, userId);
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

// ====== COLLABORATOR MANAGEMENT ======

export interface Collaborator {
  id: string;
  user_id: string;
  email: string;
  name: string;
  added_at: string;
  added_by: string;
}

// Add a collaborator to a presentation
export async function addCollaborator(
  db: D1Database,
  presentationId: string,
  userEmail: string,
  addedBy: string
): Promise<{ success: boolean; error?: string; collaboratorId?: string }> {
  try {
    // First check if the user exists
    const user = await getUserByEmail(db, userEmail);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Check if they're already a collaborator or owner
    const presentation = await db.prepare(
      'SELECT user_id FROM presentations WHERE id = ?'
    ).bind(presentationId).first();

    if (!presentation) {
      return { success: false, error: 'Presentation not found' };
    }

    if (presentation.user_id === user.id) {
      return { success: false, error: 'User is already the owner of this presentation' };
    }

    // Check if already a collaborator
    const existing = await db.prepare(
      'SELECT id FROM presentation_collaborators WHERE presentation_id = ? AND user_id = ?'
    ).bind(presentationId, user.id).first();

    if (existing) {
      return { success: false, error: 'User is already a collaborator' };
    }

    // Add the collaborator
    const id = crypto.randomUUID().replace(/-/g, '').toLowerCase();
    await db.prepare(
      `INSERT INTO presentation_collaborators (id, presentation_id, user_id, added_by)
       VALUES (?, ?, ?, ?)`
    ).bind(id, presentationId, user.id, addedBy).run();

    return { success: true, collaboratorId: id };
  } catch (error) {
    console.error('Error adding collaborator:', error);
    return { success: false, error: 'Failed to add collaborator' };
  }
}

// Remove a collaborator from a presentation
export async function removeCollaborator(
  db: D1Database,
  presentationId: string,
  userId: string,
  removedBy: string
): Promise<boolean> {
  try {
    // Verify the remover is the owner
    const presentation = await db.prepare(
      'SELECT user_id FROM presentations WHERE id = ?'
    ).bind(presentationId).first();

    if (!presentation || presentation.user_id !== removedBy) {
      return false;
    }

    const result = await db.prepare(
      'DELETE FROM presentation_collaborators WHERE presentation_id = ? AND user_id = ?'
    ).bind(presentationId, userId).run();

    return result.meta.changes > 0;
  } catch (error) {
    console.error('Error removing collaborator:', error);
    return false;
  }
}

// Get all collaborators for a presentation
export async function getCollaborators(
  db: D1Database,
  presentationId: string
): Promise<Collaborator[]> {
  try {
    const result = await db.prepare(
      `SELECT
        pc.id,
        pc.user_id,
        pc.added_at,
        pc.added_by,
        u.email,
        u.name
       FROM presentation_collaborators pc
       JOIN users u ON pc.user_id = u.id
       WHERE pc.presentation_id = ?
       ORDER BY pc.added_at DESC`
    ).bind(presentationId).all();

    return result.results as Collaborator[] || [];
  } catch (error) {
    console.error('Error getting collaborators:', error);
    return [];
  }
}

// Check if user has access to presentation (owner OR collaborator)
export async function getPresentationWithAccess(
  db: D1Database,
  presentationId: string,
  userId: string
): Promise<any | null> {
  try {
    // First check if user is the owner
    const ownerCheck = await db.prepare(
      'SELECT * FROM presentations WHERE id = ? AND user_id = ? AND is_active = 1'
    ).bind(presentationId, userId).first();

    if (ownerCheck) {
      return ownerCheck;
    }

    // Check if user is a collaborator
    const collaboratorCheck = await db.prepare(
      `SELECT p.*
       FROM presentations p
       JOIN presentation_collaborators pc ON p.id = pc.presentation_id
       WHERE p.id = ? AND pc.user_id = ? AND p.is_active = 1`
    ).bind(presentationId, userId).first();

    return collaboratorCheck || null;
  } catch (error) {
    console.error('Error checking presentation access:', error);
    return null;
  }
}

// Get presentations where user is owner OR collaborator
export async function getUserPresentationsWithCollaborations(
  db: D1Database,
  userId: string
): Promise<any[]> {
  try {
    const result = await db.prepare(
      `SELECT DISTINCT
        p.*,
        (SELECT COUNT(*) FROM slides WHERE presentation_id = p.id) as slide_count,
        CASE
          WHEN p.user_id = ? THEN 'owner'
          ELSE 'collaborator'
        END as role
       FROM presentations p
       LEFT JOIN presentation_collaborators pc ON p.id = pc.presentation_id
       WHERE (p.user_id = ? OR pc.user_id = ?) AND p.is_active = 1
       ORDER BY p.updated_at DESC`
    ).bind(userId, userId, userId).all();

    return result.results || [];
  } catch (error) {
    console.error('Error getting presentations with collaborations:', error);
    return [];
  }
}

// Get all active users (for autocomplete/search)
export async function getAllUsers(db: D1Database): Promise<{ id: string; email: string; name: string }[]> {
  try {
    const result = await db.prepare(
      'SELECT id, email, name FROM users WHERE is_active = 1 ORDER BY name ASC'
    ).all();

    return result.results as { id: string; email: string; name: string }[] || [];
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}

// Create a new presentation
export async function createPresentation(
  db: D1Database,
  userId: string,
  data: { name: string; description?: string }
): Promise<{ success: boolean; error?: string; presentationId?: string }> {
  try {
    if (!data.name || data.name.trim().length === 0) {
      return { success: false, error: 'Presentation name is required' };
    }

    const id = crypto.randomUUID().replace(/-/g, '').toLowerCase();

    // Generate a default 6-digit PIN
    const defaultPin = generatePinCode();

    await db.prepare(
      `INSERT INTO presentations (id, name, description, pin_code, user_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(id, data.name.trim(), data.description?.trim() || null, defaultPin, userId, 'user').run();

    return { success: true, presentationId: id };
  } catch (error) {
    console.error('Error creating presentation:', error);
    return { success: false, error: 'Failed to create presentation' };
  }
}
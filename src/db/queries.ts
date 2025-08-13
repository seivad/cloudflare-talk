// Data access layer for D1 database operations
import { D1Database } from '@cloudflare/workers-types';

export interface Presentation {
  id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  is_active: number;
  adventure_config: string | null;
}

export interface Slide {
  id: string;
  presentation_id: string;
  order_number: number;
  title: string;
  content: string | null; // JSON string
  bullets: string | null; // JSON string
  slide_type: 'standard' | 'poll' | 'bio';
  poll_question: string | null;
  poll_options: string | null; // JSON string
  poll_routes: string | null; // JSON string
  is_bio_slide: number;
  created_at: string;
}

export interface PollOption {
  id: string;
  label: string;
  emoji?: string;
}

export class PresentationQueries {
  constructor(private db: D1Database) {}

  // Get all active presentations
  async getAllPresentations(): Promise<Presentation[]> {
    const result = await this.db.prepare(
      `SELECT * FROM presentations WHERE is_active = 1 ORDER BY created_at DESC`
    ).all<Presentation>();
    
    return result.results || [];
  }

  // Get a specific presentation by ID
  async getPresentationById(id: string): Promise<Presentation | null> {
    const result = await this.db.prepare(
      `SELECT * FROM presentations WHERE id = ?`
    ).bind(id).first<Presentation>();
    
    return result;
  }

  // Create a new presentation
  async createPresentation(
    name: string,
    description?: string,
    created_by?: string,
    adventure_config?: any
  ): Promise<string> {
    const id = crypto.randomUUID();
    await this.db.prepare(
      `INSERT INTO presentations (id, name, description, created_by, adventure_config) 
       VALUES (?, ?, ?, ?, ?)`
    ).bind(
      id,
      name,
      description || null,
      created_by || null,
      adventure_config ? JSON.stringify(adventure_config) : null
    ).run();
    
    return id;
  }

  // Update a presentation
  async updatePresentation(
    id: string,
    updates: Partial<Omit<Presentation, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    
    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(updates.is_active);
    }
    if (updates.adventure_config !== undefined) {
      fields.push('adventure_config = ?');
      values.push(updates.adventure_config);
    }
    
    if (fields.length === 0) return;
    
    values.push(id);
    await this.db.prepare(
      `UPDATE presentations SET ${fields.join(', ')} WHERE id = ?`
    ).bind(...values).run();
  }

  // Delete a presentation (cascades to slides)
  async deletePresentation(id: string): Promise<void> {
    await this.db.prepare(
      `DELETE FROM presentations WHERE id = ?`
    ).bind(id).run();
  }
}

export class SlideQueries {
  constructor(private db: D1Database) {}

  // Get all slides for a presentation
  async getSlidesByPresentation(presentationId: string): Promise<Slide[]> {
    const result = await this.db.prepare(
      `SELECT * FROM slides WHERE presentation_id = ? ORDER BY order_number`
    ).bind(presentationId).all<Slide>();
    
    return result.results || [];
  }

  // Get a specific slide by ID
  async getSlideById(id: string): Promise<Slide | null> {
    const result = await this.db.prepare(
      `SELECT * FROM slides WHERE id = ?`
    ).bind(id).first<Slide>();
    
    return result;
  }

  // Get a slide by presentation and order number
  async getSlideByOrder(presentationId: string, orderNumber: number): Promise<Slide | null> {
    const result = await this.db.prepare(
      `SELECT * FROM slides WHERE presentation_id = ? AND order_number = ?`
    ).bind(presentationId, orderNumber).first<Slide>();
    
    return result;
  }

  // Create a new slide
  async createSlide(slide: Omit<Slide, 'id' | 'created_at'>): Promise<string> {
    const id = crypto.randomUUID();
    await this.db.prepare(
      `INSERT INTO slides (
        id, presentation_id, order_number, title, content, bullets,
        slide_type, poll_question, poll_options, poll_routes, is_bio_slide
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      slide.presentation_id,
      slide.order_number,
      slide.title,
      slide.content,
      slide.bullets,
      slide.slide_type,
      slide.poll_question,
      slide.poll_options,
      slide.poll_routes,
      slide.is_bio_slide
    ).run();
    
    return id;
  }

  // Update a slide
  async updateSlide(
    id: string,
    updates: Partial<Omit<Slide, 'id' | 'presentation_id' | 'created_at'>>
  ): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    
    if (updates.order_number !== undefined) {
      fields.push('order_number = ?');
      values.push(updates.order_number);
    }
    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.content !== undefined) {
      fields.push('content = ?');
      values.push(updates.content);
    }
    if (updates.bullets !== undefined) {
      fields.push('bullets = ?');
      values.push(updates.bullets);
    }
    if (updates.slide_type !== undefined) {
      fields.push('slide_type = ?');
      values.push(updates.slide_type);
    }
    if (updates.poll_question !== undefined) {
      fields.push('poll_question = ?');
      values.push(updates.poll_question);
    }
    if (updates.poll_options !== undefined) {
      fields.push('poll_options = ?');
      values.push(updates.poll_options);
    }
    if (updates.poll_routes !== undefined) {
      fields.push('poll_routes = ?');
      values.push(updates.poll_routes);
    }
    if (updates.is_bio_slide !== undefined) {
      fields.push('is_bio_slide = ?');
      values.push(updates.is_bio_slide);
    }
    
    if (fields.length === 0) return;
    
    values.push(id);
    await this.db.prepare(
      `UPDATE slides SET ${fields.join(', ')} WHERE id = ?`
    ).bind(...values).run();
  }

  // Delete a slide
  async deleteSlide(id: string): Promise<void> {
    await this.db.prepare(
      `DELETE FROM slides WHERE id = ?`
    ).bind(id).run();
  }

  // Reorder slides (update order numbers)
  async reorderSlides(presentationId: string, slideIds: string[]): Promise<void> {
    const statements = slideIds.map((id, index) => 
      this.db.prepare(
        `UPDATE slides SET order_number = ? WHERE id = ? AND presentation_id = ?`
      ).bind(index, id, presentationId)
    );
    
    await this.db.batch(statements);
  }

  // Create multiple slides in a batch
  async createSlidesBatch(slides: Omit<Slide, 'id' | 'created_at'>[]): Promise<string[]> {
    const ids: string[] = [];
    const statements = slides.map(slide => {
      const id = crypto.randomUUID();
      ids.push(id);
      return this.db.prepare(
        `INSERT INTO slides (
          id, presentation_id, order_number, title, content, bullets,
          slide_type, poll_question, poll_options, poll_routes, is_bio_slide
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        id,
        slide.presentation_id,
        slide.order_number,
        slide.title,
        slide.content,
        slide.bullets,
        slide.slide_type,
        slide.poll_question,
        slide.poll_options,
        slide.poll_routes,
        slide.is_bio_slide
      );
    });
    
    await this.db.batch(statements);
    return ids;
  }
}

// Helper function to parse JSON fields safely
export function parseJsonField<T>(field: string | null): T | null {
  if (!field) return null;
  try {
    return JSON.parse(field) as T;
  } catch {
    return null;
  }
}

// Helper function to stringify JSON fields safely
export function stringifyJsonField(value: any): string | null {
  if (value === null || value === undefined) return null;
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}
const pool = require('../../config/db');

const Service = {
  async getAll(limit = 100, offset = 0) {
    const result = await pool.query(
      `SELECT s.*, a.name as updater_name
       FROM services s
       LEFT JOIN admin_users a ON s.updated_by = a.id
       ORDER BY s.display_order ASC, s.updated_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  },

  async getFeatured() {
    const result = await pool.query(
      `SELECT * FROM services 
       WHERE featured = true 
       ORDER BY display_order ASC`,
    );
    return result.rows;
  },

  async getBySlug(slug) {
    const result = await pool.query(
      'SELECT * FROM services WHERE slug = $1',
      [slug]
    );
    return result.rows[0];
  },

  async getById(id) {
    const result = await pool.query(
      'SELECT * FROM services WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  async create(data, adminId, imagePath = null) {
    let techStackValue = '[]';
    if (data.tech_stack) {
      if (Array.isArray(data.tech_stack)) {
        techStackValue = JSON.stringify(data.tech_stack);
      } else if (typeof data.tech_stack === 'string') {
        try {
          JSON.parse(data.tech_stack);
          techStackValue = data.tech_stack;
        } catch {
          techStackValue = JSON.stringify([data.tech_stack]);
        }
      }
    }
    
    const result = await pool.query(
      `INSERT INTO services (title, title_fr, slug, description, description_fr, details, details_fr, icon, image, tech_stack, featured, display_order, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        data.title,
        data.title_fr || null,
        data.slug,
        data.description || null,
        data.description_fr || null,
        data.details || null,
        data.details_fr || null,
        data.icon || null,
        imagePath || data.image || null,
        techStackValue,
        data.featured || false,
        data.display_order || 0,
        adminId
      ]
    );
    return result.rows[0];
  },

  async update(id, data, adminId, imagePath = null) {
    let techStackValue = null;
    if (data.tech_stack !== undefined) {
      if (Array.isArray(data.tech_stack)) {
        techStackValue = JSON.stringify(data.tech_stack);
      } else if (typeof data.tech_stack === 'string') {
        try {
          JSON.parse(data.tech_stack);
          techStackValue = data.tech_stack;
        } catch {
          techStackValue = JSON.stringify([data.tech_stack]);
        }
      } else if (data.tech_stack === null) {
        techStackValue = null;
      }
    }
    
    const result = await pool.query(
      `UPDATE services SET
        title = COALESCE($1, title),
        title_fr = COALESCE($2, title_fr),
        slug = COALESCE($3, slug),
        description = COALESCE($4, description),
        description_fr = COALESCE($5, description_fr),
        details = COALESCE($6, details),
        details_fr = COALESCE($7, details_fr),
        icon = COALESCE($8, icon),
        image = COALESCE($9, image),
        tech_stack = COALESCE($10, tech_stack),
        featured = COALESCE($11, featured),
        display_order = COALESCE($12, display_order),
        updated_by = $13,
        updated_at = NOW()
       WHERE id = $14
       RETURNING *`,
      [
        data.title || null,
        data.title_fr || null,
        data.slug || null,
        data.description || null,
        data.description_fr || null,
        data.details || null,
        data.details_fr || null,
        data.icon || null,
        imagePath || data.image || null,
        techStackValue,
        data.featured !== undefined ? data.featured : null,
        data.display_order || null,
        adminId,
        id
      ]
    );
    return result.rows[0];
  },

  async delete(id) {
    const service = await this.getById(id);
    if (service && service.image && service.image.includes('/services/')) {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../../uploads', service.image);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    await pool.query('DELETE FROM services WHERE id = $1', [id]);
  },

  async updateOrder(orders) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const item of orders) {
        await client.query(
          'UPDATE services SET display_order = $1 WHERE id = $2',
          [item.order, item.id]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};

module.exports = Service;
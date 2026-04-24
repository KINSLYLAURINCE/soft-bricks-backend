const pool = require('../../config/db');

const BlogPost = {
  async getAll(limit = 100, offset = 0, status = null) {
    let query = `
      SELECT bp.*, a.name as author_name
      FROM blog_posts bp
      LEFT JOIN admin_users a ON bp.created_by = a.id
    `;
    const params = [];
    
    if (status) {
      query += ` WHERE bp.status = $1`;
      params.push(status);
      query += ` ORDER BY bp.published_at DESC NULLS LAST, bp.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
    } else {
      query += ` ORDER BY bp.created_at DESC LIMIT $1 OFFSET $2`;
      params.push(limit, offset);
    }
    
    const result = await pool.query(query, params);
    return result.rows;
  },

  async getPublished() {
    const result = await pool.query(
      `SELECT bp.*, a.name as author_name
       FROM blog_posts bp
       LEFT JOIN admin_users a ON bp.created_by = a.id
       WHERE bp.status = 'published' AND (bp.published_at <= NOW() OR bp.published_at IS NULL)
       ORDER BY bp.published_at DESC NULLS LAST, bp.created_at DESC`,
    );
    return result.rows;
  },

  async getBySlug(slug) {
    const result = await pool.query(
      `SELECT bp.*, a.name as author_name
       FROM blog_posts bp
       LEFT JOIN admin_users a ON bp.created_by = a.id
       WHERE bp.slug = $1`,
      [slug]
    );
    return result.rows[0];
  },

  async getById(id) {
    const result = await pool.query(
      'SELECT * FROM blog_posts WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  async incrementViews(id) {
    await pool.query(
      'UPDATE blog_posts SET views = views + 1 WHERE id = $1',
      [id]
    );
  },

  async create(data, adminId, imagePath = null) {
    const result = await pool.query(
      `INSERT INTO blog_posts (title, title_fr, slug, excerpt, content, featured_image, author, category, tags, status, published_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        data.title,
        data.title_fr || null,
        data.slug,
        data.excerpt || null,
        data.content || null,
        imagePath || data.featured_image || null,
        data.author || null,
        data.category || null,
        data.tags ? JSON.stringify(data.tags) : '[]',
        data.status || 'draft',
        data.status === 'published' ? new Date() : null,
        adminId
      ]
    );
    return result.rows[0];
  },

  async update(id, data, adminId, imagePath = null) {
    const updateFields = [];
    const values = [];
    let paramCount = 1;
    
    if (data.title !== undefined) {
      updateFields.push(`title = $${paramCount++}`);
      values.push(data.title);
    }
    if (data.title_fr !== undefined) {
      updateFields.push(`title_fr = $${paramCount++}`);
      values.push(data.title_fr);
    }
    if (data.slug !== undefined) {
      updateFields.push(`slug = $${paramCount++}`);
      values.push(data.slug);
    }
    if (data.excerpt !== undefined) {
      updateFields.push(`excerpt = $${paramCount++}`);
      values.push(data.excerpt);
    }
    if (data.content !== undefined) {
      updateFields.push(`content = $${paramCount++}`);
      values.push(data.content);
    }
    if (data.featured_image !== undefined || imagePath !== null) {
      updateFields.push(`featured_image = $${paramCount++}`);
      values.push(imagePath || data.featured_image);
    }
    if (data.author !== undefined) {
      updateFields.push(`author = $${paramCount++}`);
      values.push(data.author);
    }
    if (data.category !== undefined) {
      updateFields.push(`category = $${paramCount++}`);
      values.push(data.category);
    }
    if (data.tags !== undefined) {
      updateFields.push(`tags = $${paramCount++}`);
      let tagsValue = '[]';
      if (Array.isArray(data.tags)) {
        tagsValue = JSON.stringify(data.tags);
      } else if (typeof data.tags === 'string') {
        try {
          JSON.parse(data.tags);
          tagsValue = data.tags;
        } catch {
          tagsValue = JSON.stringify([data.tags]);
        }
      }
      values.push(tagsValue);
    }
    if (data.status !== undefined) {
      updateFields.push(`status = $${paramCount++}`);
      values.push(data.status);
    }
    
    if (data.status === 'published' && (!data.oldStatus || data.oldStatus !== 'published')) {
      updateFields.push(`published_at = $${paramCount++}`);
      values.push(new Date());
    }
    
    updateFields.push(`updated_at = NOW()`);
    values.push(id);
    
    const query = `UPDATE blog_posts SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async delete(id) {
    const post = await this.getById(id);
    if (post && post.featured_image && post.featured_image.includes('/blog/')) {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../../uploads', post.featured_image);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    await pool.query('DELETE FROM blog_posts WHERE id = $1', [id]);
  },

  async getByCategory(category) {
    const result = await pool.query(
      `SELECT * FROM blog_posts 
       WHERE category = $1 AND status = 'published'
       ORDER BY published_at DESC`,
      [category]
    );
    return result.rows;
  },

  async getCategories() {
    const result = await pool.query(
      `SELECT DISTINCT category, COUNT(*) as count
       FROM blog_posts 
       WHERE status = 'published' AND category IS NOT NULL
       GROUP BY category
       ORDER BY category`
    );
    return result.rows;
  }
};

module.exports = BlogPost;
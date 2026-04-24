const pool = require('../../config/db');

const TeamMember = {
  async getAll(limit = 100, offset = 0) {
    const result = await pool.query(
      `SELECT tm.*, a.name as creator_name
       FROM team_members tm
       LEFT JOIN admin_users a ON tm.created_by = a.id
       ORDER BY tm.display_order ASC, tm.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  },

  async getActive() {
    const result = await pool.query(
      `SELECT * FROM team_members 
       WHERE status = 'Active' 
       ORDER BY display_order ASC`,
    );
    return result.rows;
  },

  async getById(id) {
    const result = await pool.query(
      'SELECT * FROM team_members WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  async create(data, adminId, avatarPath = null) {
    const result = await pool.query(
      `INSERT INTO team_members (name, role, department, bio, avatar, email, linkedin, twitter, location, joined, status, display_order, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        data.name,
        data.role || null,
        data.department || null,
        data.bio || null,
        avatarPath || data.avatar || null,
        data.email || null,
        data.linkedin || null,
        data.twitter || null,
        data.location || null,
        data.joined || null,
        data.status || 'Active',
        data.display_order || 0,
        adminId
      ]
    );
    return result.rows[0];
  },

  async update(id, data, adminId, avatarPath = null) {
    const result = await pool.query(
      `UPDATE team_members SET
        name = COALESCE($1, name),
        role = COALESCE($2, role),
        department = COALESCE($3, department),
        bio = COALESCE($4, bio),
        avatar = COALESCE($5, avatar),
        email = COALESCE($6, email),
        linkedin = COALESCE($7, linkedin),
        twitter = COALESCE($8, twitter),
        location = COALESCE($9, location),
        joined = COALESCE($10, joined),
        status = COALESCE($11, status),
        display_order = COALESCE($12, display_order)
       WHERE id = $13
       RETURNING *`,
      [
        data.name || null,
        data.role || null,
        data.department || null,
        data.bio || null,
        avatarPath || data.avatar || null,
        data.email || null,
        data.linkedin || null,
        data.twitter || null,
        data.location || null,
        data.joined || null,
        data.status || null,
        data.display_order || null,
        id
      ]
    );
    return result.rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM team_members WHERE id = $1', [id]);
  },

  async updateOrder(orders) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const item of orders) {
        await client.query(
          'UPDATE team_members SET display_order = $1 WHERE id = $2',
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

module.exports = TeamMember;
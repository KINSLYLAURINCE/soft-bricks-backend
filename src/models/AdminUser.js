const pool = require('../../config/db');
const bcrypt = require('bcryptjs');

const AdminUser = {
  async findByEmail(email) {
    const result = await pool.query(
      'SELECT id, email, password_hash, name, role, avatar, last_login, created_at FROM admin_users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await pool.query(
      'SELECT id, email, name, role, avatar, last_login, created_at FROM admin_users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  async create({ email, password, name, role = 'admin' }) {
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO admin_users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role, created_at`,
      [email, passwordHash, name, role]
    );
    return result.rows[0];
  },

  async updateLastLogin(id) {
    await pool.query(
      'UPDATE admin_users SET last_login = NOW() WHERE id = $1',
      [id]
    );
  },

  async updateProfile(id, { name, avatar }) {
    const result = await pool.query(
      'UPDATE admin_users SET name = $1, avatar = $2 WHERE id = $3 RETURNING id, email, name, role, avatar',
      [name, avatar, id]
    );
    return result.rows[0];
  },

  async changePassword(id, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await pool.query(
      'UPDATE admin_users SET password_hash = $1 WHERE id = $2',
      [passwordHash, id]
    );
  },

  async getAll(limit = 100, offset = 0) {
    const result = await pool.query(
      `SELECT id, email, name, role, avatar, last_login, created_at
       FROM admin_users
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  },

  async delete(id) {
    await pool.query('DELETE FROM admin_users WHERE id = $1', [id]);
  }
};

module.exports = AdminUser;
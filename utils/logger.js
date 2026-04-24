const pool = require('../config/db');

const logActivity = async ({ adminId, action, entity, entityId, details, ip }) => {
  try {
    await pool.query(
      `INSERT INTO activity_log (admin_id, action, entity, entity_id, details, ip_address)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [adminId || null, action, entity || null, entityId || null, JSON.stringify(details || {}), ip || null]
    );
  } catch (err) {
    console.error('Activity log error:', err.message);
  }
};

module.exports = { logActivity };
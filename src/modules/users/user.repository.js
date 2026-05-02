const pool = require('../../config/database');

async function findAll({ page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit;
  const [rows] = await pool.query(
    `SELECT id, name, email, role, is_active, created_at
     FROM users
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM users');
  return { rows, total: Number(total) };
}

async function findById(id) {
  const [rows] = await pool.query(
    'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

async function update(id, fields) {
  const keys = Object.keys(fields);
  const values = Object.values(fields);
  const setClause = keys.map((k) => `\`${k}\` = ?`).join(', ');
  await pool.query(`UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = ?`, [
    ...values,
    id,
  ]);
  return findById(id);
}

async function remove(id) {
  await pool.query('DELETE FROM users WHERE id = ?', [id]);
}

module.exports = { findAll, findById, update, remove };

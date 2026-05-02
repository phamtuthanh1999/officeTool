const pool = require('../../config/database');

async function findAll({ userId, page = 1, limit = 20, status } = {}) {
  const offset = (page - 1) * limit;
  const params = [userId];
  let whereClause = 'WHERE user_id = ?';

  if (status) {
    whereClause += ' AND status = ?';
    params.push(status);
  }

  const [rows] = await pool.query(
    `SELECT * FROM tasks ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM tasks ${whereClause}`,
    params
  );

  return { rows, total: Number(total) };
}

async function findById(id, userId) {
  const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [
    id,
    userId,
  ]);
  return rows[0] || null;
}

async function create(userId, data) {
  const { title, description = null, status = 'pending', due_date = null } = data;
  const [result] = await pool.query(
    'INSERT INTO tasks (user_id, title, description, status, due_date) VALUES (?, ?, ?, ?, ?)',
    [userId, title, description, status, due_date]
  );
  return findById(result.insertId, userId);
}

async function update(id, userId, fields) {
  const keys = Object.keys(fields);
  const values = Object.values(fields);
  const setClause = keys.map((k) => `\`${k}\` = ?`).join(', ');
  await pool.query(
    `UPDATE tasks SET ${setClause}, updated_at = NOW() WHERE id = ? AND user_id = ?`,
    [...values, id, userId]
  );
  return findById(id, userId);
}

async function remove(id, userId) {
  await pool.query('DELETE FROM tasks WHERE id = ? AND user_id = ?', [id, userId]);
}

module.exports = { findAll, findById, create, update, remove };

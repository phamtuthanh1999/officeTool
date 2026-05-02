const taskRepository = require('./task.repository');
const AppError = require('../../utils/AppError');

async function getAllTasks(userId, query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
  const { status } = query;
  return taskRepository.findAll({ userId, page, limit, status });
}

async function getTaskById(id, userId) {
  const task = await taskRepository.findById(id, userId);
  if (!task) throw new AppError('Task not found', 404);
  return task;
}

async function createTask(userId, data) {
  return taskRepository.create(userId, data);
}

async function updateTask(id, userId, data) {
  await getTaskById(id, userId);
  return taskRepository.update(id, userId, data);
}

async function deleteTask(id, userId) {
  await getTaskById(id, userId);
  await taskRepository.remove(id, userId);
}

module.exports = { getAllTasks, getTaskById, createTask, updateTask, deleteTask };

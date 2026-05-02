const userRepository = require('./user.repository');
const AppError = require('../../utils/AppError');

async function getAllUsers(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
  return userRepository.findAll({ page, limit });
}

async function getUserById(id) {
  const user = await userRepository.findById(id);
  if (!user) throw new AppError('User not found', 404);
  return user;
}

async function updateUser(id, data) {
  await getUserById(id);
  return userRepository.update(id, data);
}

async function deleteUser(id) {
  await getUserById(id);
  await userRepository.remove(id);
}

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };

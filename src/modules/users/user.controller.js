const userService = require('./user.service');
const catchAsync = require('../../utils/catchAsync');
const { sendSuccess } = require('../../utils/response');
const AppError = require('../../utils/AppError');

const getAll = catchAsync(async (req, res) => {
  const { rows, total } = await userService.getAllUsers(req.query);
  sendSuccess(res, 200, { users: rows }, { total });
});

const getOne = catchAsync(async (req, res) => {
  const user = await userService.getUserById(parseInt(req.params.id, 10));
  sendSuccess(res, 200, { user });
});

// Authenticated user updates their own profile
const updateMe = catchAsync(async (req, res) => {
  const user = await userService.updateUser(req.user.id, req.body);
  sendSuccess(res, 200, { user });
});

const deleteUser = catchAsync(async (req, res) => {
  const targetId = parseInt(req.params.id, 10);

  // Only admins can delete other users
  if (req.user.role !== 'admin' && req.user.id !== targetId) {
    throw new AppError('You can only delete your own account', 403);
  }

  await userService.deleteUser(targetId);
  res.status(204).send();
});

module.exports = { getAll, getOne, updateMe, deleteUser };

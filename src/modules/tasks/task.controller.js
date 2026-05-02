const taskService = require('./task.service');
const catchAsync = require('../../utils/catchAsync');
const { sendSuccess } = require('../../utils/response');

const getAll = catchAsync(async (req, res) => {
  const { rows, total } = await taskService.getAllTasks(req.user.id, req.query);
  sendSuccess(res, 200, { tasks: rows }, { total });
});

const getOne = catchAsync(async (req, res) => {
  const task = await taskService.getTaskById(parseInt(req.params.id, 10), req.user.id);
  sendSuccess(res, 200, { task });
});

const create = catchAsync(async (req, res) => {
  const task = await taskService.createTask(req.user.id, req.body);
  sendSuccess(res, 201, { task });
});

const update = catchAsync(async (req, res) => {
  const task = await taskService.updateTask(parseInt(req.params.id, 10), req.user.id, req.body);
  sendSuccess(res, 200, { task });
});

const remove = catchAsync(async (req, res) => {
  await taskService.deleteTask(parseInt(req.params.id, 10), req.user.id);
  res.status(204).send();
});

module.exports = { getAll, getOne, create, update, remove };

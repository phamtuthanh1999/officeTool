const { Router } = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const userRoutes = require('../modules/users/user.routes');
const taskRoutes = require('../modules/tasks/task.routes');
const pdfRoutes = require('../modules/pdf/pdf.routes');
const driveRoutes = require('../modules/drive/drive.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/tasks', taskRoutes);
// Image routes removed (background removal feature deleted)
router.use('/pdf', pdfRoutes);
router.use('/drive', driveRoutes);

module.exports = router;

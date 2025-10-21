const router = require('express').Router();
const { authMiddleware, studentMiddleware, managerMiddleware } = require('../middlewares/auth');
const ctl = require('../controllers/registrations.controller');

router.use(authMiddleware);

// Student có thể đăng ký và hủy đăng ký hoạt động
router.post('/', studentMiddleware, ctl.register);
router.get('/my', studentMiddleware, ctl.getMyRegistrations);
router.get('/:id', studentMiddleware, ctl.getById);
router.delete('/:activityId', studentMiddleware, ctl.cancel);

// Manager có thể quản lý tất cả đăng ký
router.get('/', managerMiddleware, ctl.getAllRegistrations);
router.patch('/:id/status', managerMiddleware, ctl.updateStatus);
router.patch('/batch-status', managerMiddleware, ctl.batchUpdateStatus);
router.delete('/:id', managerMiddleware, ctl.deleteRegistration);
router.delete('/batch', managerMiddleware, ctl.batchDeleteRegistrations);
router.get('/export', managerMiddleware, ctl.exportRegistrations);

module.exports = router;

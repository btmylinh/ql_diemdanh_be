const router = require('express').Router();
const { authMiddleware, studentMiddleware, managerMiddleware } = require('../middlewares/auth');
const ctl = require('../controllers/registrations.controller');

router.use(authMiddleware);

// Student có thể đăng ký và hủy đăng ký hoạt động
router.post('/', studentMiddleware, ctl.register);
router.get('/my', studentMiddleware, ctl.getMyRegistrations);
// Đặt các route tĩnh trước khi khai báo route động
router.get('/export', managerMiddleware, ctl.exportRegistrations);
// Route động đặt SAU để tránh nuốt các route tĩnh như /export
router.get('/:id', studentMiddleware, ctl.getById);
router.delete('/:activityId', studentMiddleware, ctl.cancel);

// Manager có thể xem tất cả đăng ký (chỉ đọc) - Đã xóa vì không cần thiết

module.exports = router;

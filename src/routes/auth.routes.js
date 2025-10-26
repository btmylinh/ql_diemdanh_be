const router = require('express').Router();
const ctl = require('../controllers/auth.controller');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

// Student có thể đăng ký tự do
router.post('/register', ctl.register);
router.post('/login', ctl.login);
router.get('/me', authMiddleware, ctl.me);
router.put('/change-password', authMiddleware, ctl.changePassword);

// Chỉ admin mới có thể tạo manager/admin
router.post('/register-manager', adminMiddleware, ctl.register);
router.post('/register-admin', adminMiddleware, ctl.register);

module.exports = router;

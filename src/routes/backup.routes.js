const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backup.controller');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

// Tất cả routes đều cần xác thực và quyền admin
router.use(authMiddleware);
router.use(adminMiddleware);

// Lấy thống kê dashboard
router.get('/dashboard-stats', backupController.getDashboardStats);

// Tạo bản sao lưu
router.post('/create', backupController.createBackup);

// Khôi phục dữ liệu
router.post('/restore', backupController.restoreBackup);

// Khôi phục dữ liệu từ backup ID
router.post('/:id/restore', backupController.restoreBackupFromId);

// Lấy danh sách các bản sao lưu
router.get('/list', backupController.listBackups);

// Xóa bản sao lưu
router.delete('/:id', backupController.deleteBackup);

module.exports = router;

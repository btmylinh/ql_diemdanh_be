const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backup.controller');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

// Tất cả routes đều cần xác thực và quyền admin
router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

// Lấy thống kê dashboard
router.get('/dashboard-stats', backupController.getDashboardStats);

// Tạo bản sao lưu
router.post('/create', backupController.createBackup);

// Khôi phục dữ liệu
router.post('/restore', backupController.restoreBackup);

// Lấy danh sách các bản sao lưu
router.get('/list', backupController.listBackups);

// Xóa bản sao lưu
router.delete('/:id', backupController.deleteBackup);

// Xuất báo cáo
router.get('/export-report', backupController.exportReport);

module.exports = router;

const router = require('express').Router();
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');
const ctl = require('../controllers/reports.controller');

router.use(authMiddleware);
router.use(adminMiddleware); // Chỉ admin mới có quyền xem báo cáo

// Lấy thống kê tổng quan
router.get('/overview', ctl.getOverview);

// Lấy xu hướng đăng ký
router.get('/registrations-trend', ctl.getRegistrationsTrend);

// Lấy hoạt động theo trạng thái
router.get('/activities-status', ctl.getActivitiesByStatus);

// Lấy top hoạt động
router.get('/top-activities', ctl.getTopActivities);

// Lấy báo cáo định kỳ
router.get('/periodic', ctl.getPeriodicReport);

// Lấy danh sách báo cáo định kỳ đã lưu
router.get('/periodic/stored', ctl.getStoredPeriodicReports);

// Tạo báo cáo ngày
router.post('/periodic/generate', ctl.generateDailyReport);

module.exports = router;

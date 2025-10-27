const router = require('express').Router();
const { authMiddleware, studentMiddleware, managerMiddleware } = require('../middlewares/auth');
const ctl = require('../controllers/attendances.controller');

router.use(authMiddleware);
// Student có thể điểm danh và xem lịch sử
router.post('/checkin-qr', studentMiddleware, ctl.checkinQR);
router.post('/checkin-code', studentMiddleware, ctl.checkinByCode);
router.get('/my', studentMiddleware, ctl.getMyAttendances);
router.get('/:id', studentMiddleware, ctl.getById);

// Manager/admin có thể điểm danh thủ công và xem thống kê
router.post('/checkin-manual', managerMiddleware, ctl.checkinManual);
router.get('/activity/:activityId', managerMiddleware, ctl.getActivityAttendances);
router.get('/activity/:activityId/stats', managerMiddleware, ctl.getAttendanceStats);

module.exports = router;

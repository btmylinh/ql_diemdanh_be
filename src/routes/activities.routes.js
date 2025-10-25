const router = require('express').Router();
const { authMiddleware, studentMiddleware, managerMiddleware, adminMiddleware } = require('../middlewares/auth');
const ctl = require('../controllers/activities.controller');


router.use(authMiddleware);
// Student có thể xem và đăng ký
router.get('/', studentMiddleware, ctl.list);
router.get('/search', studentMiddleware, ctl.search);
router.get('/search/stats', studentMiddleware, ctl.getSearchStats);
router.get('/my-registered', studentMiddleware, ctl.getMyRegisteredActivities);

// Manager có thể xem hoạt động của mình (Đặt trước route động "/:id" để tránh xung đột)
router.get('/my', managerMiddleware, ctl.getMyActivities);

// Route động đặt sau cùng để không "ăn" các route tĩnh như "/my"
router.get('/:id', studentMiddleware, ctl.getById);

// Chỉ manager/admin mới có thể tạo, sửa, xóa
router.post('/', managerMiddleware, ctl.create);
router.put('/:id', managerMiddleware, ctl.update);
router.patch('/:id/status', managerMiddleware, ctl.updateStatus);
router.delete('/:id', managerMiddleware, ctl.delete);

// QR Code routes - manager/admin có thể tạo QR, student có thể validate
router.post('/:id/qr-code', managerMiddleware, ctl.generateQRCode);
router.get('/:id/qr-code', managerMiddleware, ctl.getQRCode);
router.post('/validate-qr', studentMiddleware, ctl.validateQRCode);

// Activity registrations routes - manager/admin có thể quản lý đăng ký của hoạt động
router.get('/:id/registrations', managerMiddleware, ctl.getActivityRegistrations);
router.get('/:id/registrations/export', managerMiddleware, ctl.exportActivityRegistrations);
router.get('/:id/registrations/stats', managerMiddleware, ctl.getActivityRegistrationStats);
router.post('/update-status-by-time', managerMiddleware, ctl.updateActivityStatusByTime);

// Admin-only routes for bulk operations
router.get('/admin/all', adminMiddleware, ctl.getAllActivities);
router.post('/bulk-delete', adminMiddleware, ctl.bulkDeleteActivities);
router.post('/export', adminMiddleware, ctl.exportAllActivities);

module.exports = router;

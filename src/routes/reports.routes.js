const router = require('express').Router();
const ctl = require('../controllers/reports.controller');
const { authMiddleware, adminMiddleware, managerMiddleware } = require('../middlewares/auth');

// Reports accessible to admin and manager
router.use(authMiddleware);
router.use((req, res, next) => {
  // allow if admin or manager
  if (req.user?.role === 'admin' || req.user?.role === 'manager') return next();
  return res.status(403).json({ success: false, error: 'Forbidden' });
});

router.get('/overview', ctl.overview);
router.get('/activities-status', ctl.activitiesStatus);
router.get('/registrations-trend', ctl.registrationsTrend);
router.get('/top-activities', ctl.topActivities);

module.exports = router;



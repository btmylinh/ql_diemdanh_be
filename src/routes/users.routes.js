const router = require('express').Router();
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');
const ctl = require('../controllers/users.controller');

// Admin middleware
const adminMiddleware = roleMiddleware(['admin']);

router.get('/', authMiddleware, adminMiddleware, ctl.list);
router.get('/search', authMiddleware, adminMiddleware, ctl.search);
router.get('/:id', authMiddleware, adminMiddleware, ctl.getById);
router.post('/', authMiddleware, adminMiddleware, ctl.create);
router.put('/:id', authMiddleware, adminMiddleware, ctl.update);
// Self-update profile
router.put('/me', authMiddleware, ctl.updateMe);
router.delete('/:id', authMiddleware, adminMiddleware, ctl.delete);
router.patch('/:id/soft-delete', authMiddleware, adminMiddleware, ctl.softDelete);
router.patch('/:id/restore', authMiddleware, adminMiddleware, ctl.restore);

module.exports = router;

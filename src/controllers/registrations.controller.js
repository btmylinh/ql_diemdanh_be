const registrationsService = require('../services/registrations.service');

// Đăng ký tham gia hoạt động
exports.register = async (req, res) => {
  try {
    const result = await registrationsService.register(req.body, req.user);
    if (result.error) return res.status(result.error.code).json({ message: result.error.message });
    res.status(201).json(result);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Hủy đăng ký hoạt động
exports.cancel = async (req, res) => {
  try {
    const result = await registrationsService.cancel(req.params, req.user);
    if (result.error) return res.status(result.error.code).json({ message: result.error.message });
    res.json(result);
  } catch (error) {
    console.error('Cancel registration error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy danh sách đăng ký của tôi
exports.getMyRegistrations = async (req, res) => {
  try {
    const result = await registrationsService.getMyRegistrations(req.query, req.user);
    if (result.error) return res.status(result.error.code).json({ message: result.error.message });
    res.json(result);
  } catch (error) {
    console.error('Get my registrations error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy chi tiết đăng ký theo ID
exports.getById = async (req, res) => {
  try {
    const result = await registrationsService.getById(req.params.id, req.user);
    if (result.error) return res.status(result.error.code).json({ message: result.error.message });
    res.json(result);
  } catch (error) {
    console.error('Get registration by ID error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Manager: Lấy tất cả đăng ký - Đã xóa vì không cần thiết


// Manager: Xuất đăng ký ra CSV
exports.exportRegistrations = async (req, res) => {
  try {
    const result = await registrationsService.exportRegistrations(req.query, req.user);
    if (result.error) return res.status(result.error.code).json({ message: result.error.message });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="registrations.csv"');
    res.send(result.csv);
  } catch (error) {
    console.error('Export registrations error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
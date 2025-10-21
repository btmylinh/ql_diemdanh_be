const attendancesService = require('../services/attendances.service');

// Điểm danh qua QR code scan
exports.checkinQR = async (req, res) => {
  try {
    const result = await attendancesService.checkinQR(req.body, req.user);
    if (result.error) return res.status(result.error.code).json({ message: result.error.message });
    res.json(result);
  } catch (error) {
    console.error('Checkin QR error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Điểm danh thủ công (admin/creator)
exports.checkinManual = async (req, res) => {
  try {
    const result = await attendancesService.checkinManual(req.body, req.user);
    if (result.error) return res.status(result.error.code).json({ message: result.error.message });
    res.json(result);
  } catch (error) {
    console.error('Checkin manual error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy danh sách điểm danh của tôi
exports.getMyAttendances = async (req, res) => {
  try {
    const result = await attendancesService.getMyAttendances(req.query, req.user);
    if (result.error) return res.status(result.error.code).json({ message: result.error.message });
    res.json(result);
  } catch (error) {
    console.error('Get my attendances error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy chi tiết điểm danh theo ID
exports.getById = async (req, res) => {
  try {
    const result = await attendancesService.getById(req.params.id, req.user);
    if (result.error) return res.status(result.error.code).json({ message: result.error.message });
    res.json(result);
  } catch (error) {
    console.error('Get attendance by ID error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy danh sách điểm danh của hoạt động
exports.getActivityAttendances = async (req, res) => {
  try {
    const result = await attendancesService.getActivityAttendances(req.params, req.query, req.user);
    if (result.error) return res.status(result.error.code).json({ message: result.error.message });
    res.json(result);
  } catch (error) {
    console.error('Get activity attendances error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy thống kê điểm danh của hoạt động
exports.getAttendanceStats = async (req, res) => {
  try {
    const result = await attendancesService.getAttendanceStats(req.params, req.user);
    if (result.error) return res.status(result.error.code).json({ message: result.error.message });
    res.json(result);
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

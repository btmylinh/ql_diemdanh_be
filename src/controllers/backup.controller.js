const backupService = require('../services/backup.service');

const respond = (res, result, successStatus = 200) => {
  if (!result) return res.status(500).json({ message: 'Unknown error' });
  if (result.error) return res.status(result.error.code || 500).json({ message: result.error.message || 'Lỗi server' });
  return res.status(successStatus).json(result);
};

// Lấy thống kê tổng quan cho dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    const result = await backupService.getDashboardStats();
    respond(res, result);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Tạo bản sao lưu dữ liệu
exports.createBackup = async (req, res) => {
  try {
    const result = await backupService.createBackup();
    respond(res, result, 201);
  } catch (error) {
    console.error('Create backup error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Khôi phục dữ liệu từ file
exports.restoreBackup = async (req, res) => {
  try {
    const result = await backupService.restoreBackup(req.body);
    respond(res, result);
  } catch (error) {
    console.error('Restore backup error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy danh sách các bản sao lưu
exports.listBackups = async (req, res) => {
  try {
    const result = await backupService.listBackups();
    respond(res, result);
  } catch (error) {
    console.error('List backups error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Xóa bản sao lưu
exports.deleteBackup = async (req, res) => {
  try {
    const result = await backupService.deleteBackup(req.params.id);
    respond(res, result);
  } catch (error) {
    console.error('Delete backup error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Xuất báo cáo
exports.exportReport = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    const result = await backupService.exportReport(type, { startDate, endDate });
    respond(res, result);
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

const reportsService = require('../services/reports.service');

// Lấy thống kê tổng quan
exports.getOverview = async (req, res) => {
  try {
    const data = await reportsService.getOverview();
    res.json({ data });
  } catch (error) {
    console.error('Get overview error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy xu hướng đăng ký
exports.getRegistrationsTrend = async (req, res) => {
  try {
    const { start, end } = req.query;
    const data = await reportsService.getRegistrationsTrend(start, end);
    res.json({ data });
  } catch (error) {
    console.error('Get registrations trend error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy hoạt động theo trạng thái
exports.getActivitiesByStatus = async (req, res) => {
  try {
    const { start, end } = req.query;
    const data = await reportsService.getActivitiesByStatus(start, end);
    res.json({ data });
  } catch (error) {
    console.error('Get activities by status error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy top hoạt động
exports.getTopActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '10');
    const { start, end } = req.query;
    const data = await reportsService.getTopActivities(limit, start, end);
    res.json({ data });
  } catch (error) {
    console.error('Get top activities error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

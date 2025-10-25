const activitiesService = require('../services/activities.service');

// Liệt kê hoạt động với phân trang, tìm kiếm và lọc nâng cao
exports.list = async (req, res) => {
  try {
    const result = await activitiesService.list(req.query, req.user);
    if (result.error) return res.status(result.error.code).json({ message: result.error.message });
    res.json(result);
  } catch (error) {
    console.error('List activities error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Tìm kiếm hoạt động nâng cao với các filter phức tạp
exports.search = async (req, res) => {
  try {
    const result = await activitiesService.search(req.query, req.user);
    if (result.error) return res.status(result.error.code).json({ message: result.error.message });
    res.json(result);
  } catch (error) {
    console.error('Search activities error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy thống kê tìm kiếm và filter cho activities
exports.getSearchStats = async (req, res) => {
  try {
    // Quick derive using service.search and aggregate on client if needed; for now keep existing response shape by delegating logic inside service.search if extended.
    const result = await activitiesService.search(req.query, req.user);
    if (result.error) return res.status(result.error.code).json({ message: result.error.message });
    res.json({ total: result.pagination.total, statusBreakdown: {}, creatorBreakdown: [], capacityStats: { average: null, minimum: null, maximum: null }, timeRange: { earliestStart: null, latestEnd: null }, appliedFilters: { ...req.query } });
  } catch (error) {
    console.error('Get search stats error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy hoạt động theo ID
exports.getById = async (req, res) => {
  try {
    const result = await activitiesService.getById(req.params.id, req.user);
    if (result.error) return res.status(result.error.code).json({ message: result.error.message });
    res.json(result);
  } catch (error) {
    console.error('Get activity by ID error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Tạo hoạt động mới
exports.create = async (req, res) => {
  try {
    const result = await activitiesService.create(req.body, req.user);
    if (result.error) return res.status(result.error.code).json({ message: result.error.message });
    res.status(201).json(result);
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Cập nhật hoạt động
exports.update = async (req, res) => {
  try {
    const result = await activitiesService.update(req.params.id, req.body, req.user);
    if (result.error) return res.status(result.error.code).json({ message: result.error.message });
    res.json(result);
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Xóa hoạt động
exports.delete = async (req, res) => {
  try {
    const result = await activitiesService.hardDelete(req.params.id, req.user);
    if (result?.error) return res.status(result.error.code).json({ message: result.error.message });
    res.json({ message: 'Xóa hoạt động thành công' });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Cập nhật hoạt động status
exports.updateStatus = async (req, res) => {
  try {
    const result = await activitiesService.updateStatus(req.params.id, req.body, req.user);
    if (result.error) return res.status(result.error.code).json({ message: result.error.message });
    res.json(result);
  } catch (error) {
    console.error('Update activity status error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy hoạt động của tôi (được tạo bởi người dùng hiện tại)
exports.getMyActivities = async (req, res) => {
  try {
    const result = await activitiesService.getMyActivities(req.query, req.user);
    if (result.error) return res.status(result.error.code).json({ message: result.error.message });
    res.json(result);
  } catch (error) {
    console.error('Get my activities error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy hoạt động mà student đã đăng ký
exports.getMyRegisteredActivities = async (req, res) => {
  try {
    const result = await activitiesService.getMyRegisteredActivities(req.query, req.user);
    if (result.error) return res.status(result.error.code).json({ message: result.error.message });
    res.json(result);
  } catch (error) {
    console.error('Get my registered activities error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Tạo QR code cho hoạt động
exports.generateQRCode = async (req, res) => {
  try {
    const result = await activitiesService.generateQRCode(req.params.id, req.user);
    if (result.error) return res.status(result.error.code).json({ message: result.error.message });
    res.json(result);
  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy QR code của hoạt động
exports.getQRCode = async (req, res) => {
  try {
    const result = await activitiesService.getQRCode(req.params.id, req.user);
    if (result.error) return res.status(result.error.code).json({ message: result.error.message });
    res.json(result);
  } catch (error) {
    console.error('Get QR code error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Xác thực dữ liệu QR code
exports.validateQRCode = async (req, res) => {
  try {
    const result = await activitiesService.validateQRCode(req.body);
    if (result.error) return res.status(result.error.code).json({ message: result.error.message });
    res.json(result);
  } catch (error) {
    console.error('Validate QR code error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy danh sách đăng ký của hoạt động
exports.getActivityRegistrations = async (req, res) => {
  try {
    const result = await activitiesService.getActivityRegistrations(req.params.id, req.query, req.user);
    if (result.error) return res.status(result.error.code).json({ message: result.error.message });
    res.json(result);
  } catch (error) {
    console.error('Get activity registrations error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Xuất đăng ký của hoạt động ra CSV
exports.exportActivityRegistrations = async (req, res) => {
  try {
    const result = await activitiesService.exportActivityRegistrations(req.params.id, req.query, req.user);
    if (result.error) return res.status(result.error.code).json({ message: result.error.message });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="activity_${req.params.id}_registrations.csv"`);
    res.send(result.csv);
  } catch (error) {
    console.error('Export activity registrations error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy thống kê đăng ký của hoạt động
exports.getActivityRegistrationStats = async (req, res) => {
  try {
    const result = await activitiesService.getActivityRegistrationStats(req.params.id, req.user);
    if (result.error) return res.status(result.error.code).json({ message: result.error.message });
    res.json(result);
  } catch (error) {
    console.error('Get activity registration stats error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Tự động cập nhật trạng thái hoạt động theo thời gian
exports.updateActivityStatusByTime = async (req, res) => {
  try {
    const result = await activitiesService.updateActivityStatusByTime();
    if (result.error) return res.status(result.error.code).json({ message: result.error.message });
    res.json(result);
  } catch (error) {
    console.error('Update activity status by time error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Admin-only: Get all activities (no pagination for admin)
exports.getAllActivities = async (req, res) => {
  try {
    const result = await activitiesService.getAllActivities(req.query);
    if (result.error) return res.status(result.error.code).json({ message: result.error.message });
    res.json(result);
  } catch (error) {
    console.error('Get all activities error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Admin-only: Bulk delete activities
exports.bulkDeleteActivities = async (req, res) => {
  try {
    const { activity_ids } = req.body;
    if (!activity_ids || !Array.isArray(activity_ids)) {
      return res.status(400).json({ message: 'activity_ids phải là một mảng' });
    }
    const result = await activitiesService.bulkDeleteActivities(activity_ids);
    if (result.error) return res.status(result.error.code).json({ message: result.error.message });
    res.json(result);
  } catch (error) {
    console.error('Bulk delete activities error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Admin-only: Export all activities
exports.exportAllActivities = async (req, res) => {
  try {
    const result = await activitiesService.exportAllActivities(req.query);
    if (result.error) return res.status(result.error.code).json({ message: result.error.message });
    res.json(result);
  } catch (error) {
    console.error('Export all activities error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

const usersService = require('../services/users.service');

const respond = (res, result, successStatus = 200) => {
  if (!result) return res.status(500).json({ message: 'Unknown error' });
  if (result.error) return res.status(result.error.code || 500).json({ message: result.error.message || 'Lỗi server' });
  return res.status(successStatus).json(result);
};

// Tạo người dùng
exports.create = async (req, res) => {
  try {
    const result = await usersService.create(req.body);
    respond(res, result, 201);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy tất cả người dùng với phân trang, tìm kiếm và lọc nâng cao
exports.list = async (req, res) => {
  try {
    const result = await usersService.list(req.query);
    respond(res, result);
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Tìm kiếm người dùng nâng cao (tạm dùng list)
exports.search = async (req, res) => {
  try {
    const result = await usersService.list(req.query);
    respond(res, result);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy người dùng theo ID
exports.getById = async (req, res) => {
  try {
    const result = await usersService.getById(req.params.id);
    respond(res, result);
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Cập nhật người dùng
exports.update = async (req, res) => {
  try {
    const result = await usersService.update(req.params.id, req.body);
    respond(res, result);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Self update current user
exports.updateMe = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const payload = {};
    if (req.body.email !== undefined) payload.email = req.body.email;
    if (req.body.phone !== undefined) payload.phone = req.body.phone;
    if (req.body.name !== undefined) payload.name = req.body.name;
    const result = await usersService.update(userId, payload);
    respond(res, result);
  } catch (error) {
    console.error('Update me error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Xóa người dùng (hard delete)
exports.delete = async (req, res) => {
  try {
    const result = await usersService.hardDelete(req.params.id);
    if (result && !result.error) return res.json({ message: 'Xóa người dùng thành công' });
    respond(res, result);
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Xóa mềm người dùng (thay đổi trạng thái thành 0)
exports.softDelete = async (req, res) => {
  try {
    const result = await usersService.softDelete(req.params.id);
    respond(res, result);
  } catch (error) {
    console.error('Soft delete user error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Khôi phục người dùng (thay đổi trạng thái về hoạt động)
exports.restore = async (req, res) => {
  try {
    const result = await usersService.restore(req.params.id);
    respond(res, result);
  } catch (error) {
    console.error('Restore user error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Reset mật khẩu người dùng
exports.resetPassword = async (req, res) => {
  try {
    const result = await usersService.resetPassword(req.params.id, req.body.password);
    respond(res, result);
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Thay đổi trạng thái người dùng (0: không hoạt động, 1: hoạt động, 2: khóa)
exports.changeStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (![0, 1, 2].includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ. Chỉ chấp nhận: 0 (không hoạt động), 1 (hoạt động), 2 (khóa)' });
    }
    const result = await usersService.changeStatus(req.params.id, status);
    respond(res, result);
  } catch (error) {
    console.error('Change status error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};



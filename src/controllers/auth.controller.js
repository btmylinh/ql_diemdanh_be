const authService = require('../services/auth.service');

exports.register = async (req, res) => {
  try {
    const result = await authService.register(req.body, req.user);
    if (result.error) return res.status(result.error.code).json({ message: result.error.message });
    res.status(201).json(result);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.login = async (req, res) => {
  try {
    const result = await authService.login(req.body);
    if (result.error) return res.status(result.error.code).json({ message: result.error.message });
    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.me = async (req, res) => {
  try {
    const result = await authService.me(req.user);
    if (result.error) return res.status(result.error.code).json({ message: result.error.message });
    res.json(result);
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const result = await authService.changePassword(req.body, req.user);
    if (result.error) return res.status(result.error.code).json({ message: result.error.message });
    res.json(result);
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
const jwt = require('jsonwebtoken');

exports.authMiddleware = (req, res, next) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    
    if (!token) {
      return res.status(401).json({ message: 'Token không được cung cấp' });
    }

    // Verify JWT token
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token is expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return res.status(401).json({ message: 'Token đã hết hạn' });
    }

    // Attach user info to request
    req.user = payload; // { sub, role, iat, exp }
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token không hợp lệ' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token đã hết hạn' });
    }
    
    return res.status(401).json({ message: 'Xác thực thất bại' });
  }
};

// Optional middleware for routes that don't require authentication
exports.optionalAuthMiddleware = (req, res, next) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    
    if (token) {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = payload;
    }
    
    next();
  } catch (error) {
    // Continue without authentication for optional routes
    next();
  }
};

// Role-based middleware
exports.roleMiddleware = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Chưa xác thực' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }

    next();
  };
};

// Middleware cho Student
exports.studentMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Chưa xác thực' });
  }
  
  if (!['student', 'manager', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Không có quyền truy cập' });
  }
  
  next();
};

// Middleware cho Manager
exports.managerMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Chưa xác thực' });
  }
  
  if (!['manager', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Chỉ manager và admin mới có quyền truy cập' });
  }
  
  next();
};

// Middleware cho Admin
exports.adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Chưa xác thực' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Chỉ admin mới có quyền truy cập' });
  }
  
  next();
};
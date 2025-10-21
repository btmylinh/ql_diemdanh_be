const prisma = require('../lib/prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { RegisterDTO, LoginDTO } = require('../models/auth.dto');

const sanitize = (u) => { const { password, ...rest } = u; return rest; };

class AuthService {
  async register(input, currentUser = null) {
    try {
      const dto = input instanceof RegisterDTO ? input : new RegisterDTO(input);
      const { email, password, name, mssv, class: clazz, phone, role } = dto;
      
      // Validation cơ bản
      if (!email || !password) return { error: { code: 400, message: 'Email và password là bắt buộc' } };
      if (!name) return { error: { code: 400, message: 'Tên là bắt buộc' } };
      
      // Validation email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return { error: { code: 400, message: 'Email không hợp lệ' } };
      
      // Validation password
      if (password.length < 6) return { error: { code: 400, message: 'Password phải có ít nhất 6 ký tự' } };
      
      // Kiểm tra role được yêu cầu
      const requestedRole = role || 'student';
      if (requestedRole === 'manager' || requestedRole === 'admin') {
        // Chỉ admin mới có thể tạo manager/admin
        if (!currentUser || currentUser.role !== 'admin') {
          return { error: { code: 403, message: 'Chỉ admin mới có thể tạo tài khoản manager/admin' } };
        }
      }
      
      // Validation cho admin (chỉ cần name, email, password, phone)
      if (requestedRole === 'admin') {
        if (!phone) return { error: { code: 400, message: 'Số điện thoại là bắt buộc cho admin' } };
      }
      
      // Kiểm tra email đã tồn tại
      const existed = await prisma.user.findUnique({ where: { email } });
      if (existed) return { error: { code: 409, message: 'Email đã được sử dụng' } };
      
      // Kiểm tra MSSV nếu có
      if (mssv) {
        const ms = await prisma.user.findUnique({ where: { mssv } }).catch(() => null);
        if (ms) return { error: { code: 409, message: 'MSSV đã được sử dụng' } };
      }
      
      // Tạo user
      const hash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({ 
        data: { 
          email, 
          password: hash, 
          name, 
          mssv, 
          class: clazz, 
          phone, 
          role: requestedRole 
        } 
      });
      
      const accessToken = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return { message: 'Đăng ký thành công', accessToken, user: sanitize(user) };
    } catch (e) {
      return { error: { code: 500, message: 'Lỗi server' } };
    }
  }

  async login(input) {
    try {
      const dto = input instanceof LoginDTO ? input : new LoginDTO(input);
      const { email, password } = dto;

      if (!email || !password) return { error: { code: 400, message: 'Email và password là bắt buộc' } };

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return { error: { code: 400, message: 'Email không hợp lệ' } };

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return { error: { code: 401, message: 'Sai email hoặc mật khẩu' } };

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) return { error: { code: 401, message: 'Sai email hoặc mật khẩu' } };

      if (user.status === 0) return { error: { code: 403, message: 'Tài khoản đã bị khóa' } };
      const accessToken = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
      
      return { message: 'Đăng nhập thành công', accessToken, user: sanitize(user) };
    } catch (e) {
      return { error: { code: 500, message: 'Lỗi server' } };
    }
  }

  async me(user) {
    try {
      const result = await prisma.user.findUnique({ where: { id: user.sub }, select: { id: true, email: true, name: true, mssv: true, class: true, phone: true, role: true, status: true, createdAt: true } });
      if (!result) return { error: { code: 404, message: 'Không tìm thấy người dùng' } };
      return { user: result };
    } catch (e) {
      return { error: { code: 500, message: 'Lỗi server' } };
    }
  }
}

module.exports = new AuthService();



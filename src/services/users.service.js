const prisma = require('../lib/prisma');
const bcrypt = require('bcrypt');
const { CreateUserDTO, UpdateUserDTO, UserFiltersDTO, sanitizeUser } = require('../models/user.dto');

class UsersService {
  async create(input) {
    const dto = new CreateUserDTO(input);
    const { email, password, name, mssv, class: clazz, phone, role } = dto;
    if (!email || !password || !name) return { error: { code: 400, message: 'Thiếu trường bắt buộc' } };
    const existed = await prisma.user.findUnique({ where: { email } });
    if (existed) return { error: { code: 409, message: 'Email đã được sử dụng' } };
    if (mssv) {
      const existedMssv = await prisma.user.findUnique({ where: { mssv } });
      if (existedMssv) return { error: { code: 409, message: 'MSSV đã được sử dụng' } };
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, password: hashed, name, mssv, class: clazz, phone, role } });
    return { data: sanitizeUser(user) };
  }

  async list(query) {
    const f = query instanceof UserFiltersDTO ? query : new UserFiltersDTO(query);
    const { page, limit, search, created_from, created_to, orderBy, orderDir } = f;
    const skip = (page - 1) * limit;
    const whereAND = [];
    if (created_from) whereAND.push({ createdAt: { gte: new Date(created_from) } });
    if (created_to) whereAND.push({ createdAt: { lte: new Date(created_to) } });
    if (search) {
      whereAND.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { mssv: { contains: search, mode: 'insensitive' } },
          { class: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      });
    }
    const where = whereAND.length ? { AND: whereAND } : {};
    const total = await prisma.user.count({ where });
    const users = await prisma.user.findMany({
      where, skip, take: limit,
      orderBy: { [orderBy]: orderDir },
      select: { id: true, email: true, name: true, mssv: true, class: true, phone: true, role: true, status: true, createdAt: true },
    });
    return { data: users.map(sanitizeUser), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id) {
    const userId = parseInt(id);
    if (isNaN(userId)) return { error: { code: 400, message: 'ID không hợp lệ' } };
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, mssv: true, class: true, phone: true, role: true, status: true, createdAt: true },
    });
    if (!user) return { error: { code: 404, message: 'Không tìm thấy người dùng' } };
    return { data: sanitizeUser(user) };
  }

  async update(id, input) {
    const userId = parseInt(id);
    if (isNaN(userId)) return { error: { code: 400, message: 'ID không hợp lệ' } };
    const exists = await prisma.user.findUnique({ where: { id: userId } });
    if (!exists) return { error: { code: 404, message: 'Không tìm thấy người dùng' } };
    const dto = new UpdateUserDTO(input);
    const { email, mssv, password } = dto;
    if (email && email !== exists.email) {
      const emailExists = await prisma.user.findUnique({ where: { email } });
      if (emailExists) return { error: { code: 409, message: 'Email đã được sử dụng' } };
    }
    if (mssv && mssv !== exists.mssv) {
      const mssvExists = await prisma.user.findUnique({ where: { mssv } });
      if (mssvExists) return { error: { code: 409, message: 'MSSV đã được sử dụng' } };
    }
    const data = { ...dto };
    if (password) data.password = await bcrypt.hash(password, 10);
    const updated = await prisma.user.update({ where: { id: userId }, data });
    return { data: sanitizeUser(updated) };
  }

  async hardDelete(id) {
    const userId = parseInt(id);
    if (isNaN(userId)) return { error: { code: 400, message: 'ID không hợp lệ' } };
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) return { error: { code: 404, message: 'Không tìm thấy người dùng' } };
    const userActivities = await prisma.activity.count({ where: { createdBy: userId } });
    if (userActivities > 0) return { error: { code: 400, message: 'Không thể xóa người dùng đã tạo hoạt động. Vui lòng chuyển quyền sở hữu trước.' } };
    await prisma.user.delete({ where: { id: userId } });
    return { data: true };
  }

  async softDelete(id) {
    const userId = parseInt(id);
    if (isNaN(userId)) return { error: { code: 400, message: 'ID không hợp lệ' } };
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) return { error: { code: 404, message: 'Không tìm thấy người dùng' } };
    const updated = await prisma.user.update({ where: { id: userId }, data: { status: 0 } });
    return { data: sanitizeUser(updated) };
  }

  async restore(id) {
    const userId = parseInt(id);
    if (isNaN(userId)) return { error: { code: 400, message: 'ID không hợp lệ' } };
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) return { error: { code: 404, message: 'Không tìm thấy người dùng' } };
    const updated = await prisma.user.update({ where: { id: userId }, data: { status: 2 } });
    return { data: sanitizeUser(updated) };
  }
}

module.exports = new UsersService();





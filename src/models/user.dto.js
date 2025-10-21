class CreateUserDTO {
  constructor({ email, password, name, mssv, class: clazz, phone, role }) {
    this.email = email;
    this.password = password;
    this.name = name;
    this.mssv = mssv;
    this.class = clazz;
    this.phone = phone;
    this.role = role || 'student';
  }
}

class UpdateUserDTO {
  constructor({ email, password, name, mssv, class: clazz, phone, role, status }) {
    this.email = email;
    this.password = password;
    this.name = name;
    this.mssv = mssv;
    this.class = clazz;
    this.phone = phone;
    this.role = role;
    this.status = status !== undefined ? parseInt(status) : undefined;
  }
}

class UserFiltersDTO {
  constructor({ page = 1, limit = 10, q, search, created_from, created_to, orderBy = 'createdAt', orderDir = 'desc' } = {}) {
    this.page = parseInt(page);
    this.limit = parseInt(limit);
    this.search = search || q;
    this.created_from = created_from;
    this.created_to = created_to;
    this.orderBy = orderBy;
    this.orderDir = (orderDir || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
  }
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}

module.exports = {
  CreateUserDTO,
  UpdateUserDTO,
  UserFiltersDTO,
  sanitizeUser,
};





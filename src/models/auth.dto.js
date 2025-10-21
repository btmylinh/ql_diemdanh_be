class RegisterDTO {
  constructor(input = {}) {
    this.email = input.email?.toString().trim();
    this.password = input.password?.toString();
    this.name = input.name?.toString().trim();
    this.mssv = input.mssv ?? null;
    this.class = input.class ?? null;
    this.phone = input.phone ?? null;
    this.role = input.role || 'student';
  }
}

class LoginDTO {
  constructor(input = {}) {
    this.email = input.email?.toString().trim();
    this.password = input.password?.toString();
  }
}

module.exports = {
  RegisterDTO,
  LoginDTO,
};



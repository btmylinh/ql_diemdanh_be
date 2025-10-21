class RegisterActivityDTO {
  constructor(input = {}) {
    this.activityId = input.activityId !== undefined ? Number.parseInt(input.activityId) : undefined;
  }
}

class CancelRegistrationParamsDTO {
  constructor(params = {}) {
    this.activityId = params.activityId !== undefined ? Number.parseInt(params.activityId) : undefined;
  }
}

class MyRegistrationsQueryDTO {
  constructor(query = {}) {
    this.page = Number.parseInt(query.page ?? 1);
    this.limit = Number.parseInt(query.limit ?? 10);
    this.status = query.status?.toString();
    this.sortBy = query.sortBy || 'createdAt';
    this.sortOrder = query.sortOrder || 'desc';
  }
}

class RegistrationIdDTO {
  constructor(id) {
    const parsed = Number.parseInt(id);
    this.id = Number.isNaN(parsed) ? undefined : parsed;
  }
}

module.exports = {
  RegisterActivityDTO,
  CancelRegistrationParamsDTO,
  MyRegistrationsQueryDTO,
  RegistrationIdDTO,
};



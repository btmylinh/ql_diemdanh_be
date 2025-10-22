class ActivitiesListQueryDTO {
  constructor(query = {}) {
    this.page = Number.parseInt(query.page ?? 1);
    this.limit = Number.parseInt(query.limit ?? 10);
    this.q = query.q?.toString().trim() || undefined;
    this.status = query.status !== undefined ? Number.parseInt(query.status) : undefined;
    this.location = query.location?.toString().trim() || undefined;
    this.start_date = query.start_date ? new Date(query.start_date) : undefined;
    this.end_date = query.end_date ? new Date(query.end_date) : undefined;
    this.capacity_min = query.capacity_min !== undefined ? Number.parseInt(query.capacity_min) : undefined;
    this.capacity_max = query.capacity_max !== undefined ? Number.parseInt(query.capacity_max) : undefined;
    this.creator_id = query.creator_id !== undefined ? Number.parseInt(query.creator_id) : undefined;
    this.sortBy = query.sortBy || 'startTime';
    this.sortOrder = query.sortOrder || 'asc';
  }
}

class ActivitiesSearchQueryDTO extends ActivitiesListQueryDTO {
  constructor(query = {}) {
    super(query);
    this.registered_by_me = query.registered_by_me;
    this.is_full = query.is_full;
  }
}

class CreateActivityDTO {
  constructor(input = {}) {
    this.name = input.name?.toString().trim();
    this.description = input.description ?? null;
    this.location = input.location ?? null;
    this.start_time = input.start_time ? new Date(input.start_time) : undefined;
    this.end_time = input.end_time ? new Date(input.end_time) : undefined;
    this.max_participants = input.max_participants !== undefined && input.max_participants !== null
      ? Number.parseInt(input.max_participants)
      : null;
    this.training_points = input.training_points !== undefined && input.training_points !== null
      ? Number.parseInt(input.training_points)
      : 0;
    this.registration_deadline = input.registration_deadline ? new Date(input.registration_deadline) : undefined;
    this.status = input.status !== undefined ? Number.parseInt(input.status) : undefined;
  }
}

class UpdateActivityDTO extends CreateActivityDTO {
  constructor(input = {}) {
    super(input);
    this.status = input.status !== undefined ? Number.parseInt(input.status) : undefined;
  }
}

class ActivityStatusDTO {
  constructor(input = {}) {
    this.status = input.status !== undefined ? Number.parseInt(input.status) : undefined;
  }
}

module.exports = {
  ActivitiesListQueryDTO,
  ActivitiesSearchQueryDTO,
  CreateActivityDTO,
  UpdateActivityDTO,
  ActivityStatusDTO,
};



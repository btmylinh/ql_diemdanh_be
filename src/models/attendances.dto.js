class CheckinQRDTO {
  constructor(input = {}) {
    this.qrData = input.qrData;
  }
}

class CheckinManualDTO {
  constructor(input = {}) {
    this.activityId = input.activityId !== undefined ? Number.parseInt(input.activityId) : undefined;
    this.userId = input.userId !== undefined ? Number.parseInt(input.userId) : undefined;
  }
}

class MyAttendancesQueryDTO {
  constructor(query = {}) {
    this.page = Number.parseInt(query.page ?? 1);
    this.limit = Number.parseInt(query.limit ?? 10);
    this.activityId = query.activityId !== undefined ? Number.parseInt(query.activityId) : undefined;
    this.sortBy = query.sortBy || 'checkinTime';
    this.sortOrder = query.sortOrder || 'desc';
  }
}

class AttendanceIdDTO {
  constructor(id) {
    const parsed = Number.parseInt(id);
    this.id = Number.isNaN(parsed) ? undefined : parsed;
  }
}

class ActivityIdParamsDTO {
  constructor(params = {}) {
    this.activityId = params.activityId !== undefined ? Number.parseInt(params.activityId) : undefined;
  }
}

module.exports = {
  CheckinQRDTO,
  CheckinManualDTO,
  MyAttendancesQueryDTO,
  AttendanceIdDTO,
  ActivityIdParamsDTO,
};



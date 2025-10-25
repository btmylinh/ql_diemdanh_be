const prisma = require('../lib/prisma');
const { Prisma } = require('@prisma/client');
const { generateActivityQRCode, validateQRCodeData } = require('../utils/qrcode');
const { ActivitiesListQueryDTO, ActivitiesSearchQueryDTO, CreateActivityDTO, UpdateActivityDTO, ActivityStatusDTO } = require('../models/activities.dto');

class ActivitiesService {
  async list(query, user) {
    try {
      const dto = query instanceof ActivitiesListQueryDTO ? query : new ActivitiesListQueryDTO(query);
      const { page, limit, q, status, location, start_date, end_date, capacity_min, capacity_max, creator_id, sortBy, sortOrder } = dto;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;
      const whereConditions = [];
      if (status) whereConditions.push({ status: parseInt(status) });
      if (location) whereConditions.push({ location: { contains: location, mode: 'insensitive' } });
      if (start_date) whereConditions.push({ startTime: { gte: new Date(start_date) } });
      if (end_date) whereConditions.push({ endTime: { lte: new Date(end_date) } });
      if (capacity_min) whereConditions.push({ maxParticipants: { gte: parseInt(capacity_min) } });
      if (capacity_max) whereConditions.push({ maxParticipants: { lte: parseInt(capacity_max) } });
      if (creator_id) whereConditions.push({ createdBy: parseInt(creator_id) });
      if (q) {
        whereConditions.push({ OR: [ { name: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }, { location: { contains: q, mode: 'insensitive' } } ] });
      }
      const where = whereConditions.length > 0 ? { AND: whereConditions } : {};
      const total = await prisma.activity.count({ where });
      const activities = await prisma.activity.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy]: sortOrder },
        include: {
          creator: { select: { id: true, name: true, email: true } },
          _count: { select: { registrations: true, attendances: true } },
          registrations: { where: { iduser: user?.sub ?? -1, status: '1' }, select: { id: true }, take: 1 },
        },
      });
      const result = activities.map(a => ({
        id: a.id,
        name: a.name,
        description: a.description,
        location: a.location,
        start_time: a.startTime,
        end_time: a.endTime,
        max_participants: a.maxParticipants,
        training_points: a.trainingPoints,
        registration_deadline: a.registrationDeadline,
        status: a.status,
        qr_code: a.qrCode,
        created_by: a.createdBy,
        creator: a.creator,
        created_at: a.createdAt,
        registered_count: a._count.registrations,
        attendance_count: a._count.attendances,
        registered_by_me: a.registrations.length > 0,
        is_full: a.maxParticipants ? a._count.registrations >= a.maxParticipants : false,
      }));
      return { activities: result, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } };
    } catch (error) {
      return { error: { code: 500, message: 'Lỗi server' } };
    }
  }

  async search(query, user) {
    try {
      const dto = query instanceof ActivitiesSearchQueryDTO ? query : new ActivitiesSearchQueryDTO(query);
      const { page, limit, q, status, location, start_date, end_date, capacity_min, capacity_max, creator_id, registered_by_me, is_full, sortBy, sortOrder } = dto;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;
      const userId = user?.sub;
      const whereConditions = [];
      if (status) whereConditions.push({ status: parseInt(status) });
      if (location) whereConditions.push({ location: { contains: location, mode: 'insensitive' } });
      if (start_date) whereConditions.push({ startTime: { gte: new Date(start_date) } });
      if (end_date) whereConditions.push({ endTime: { lte: new Date(end_date) } });
      if (capacity_min) whereConditions.push({ maxParticipants: { gte: parseInt(capacity_min) } });
      if (capacity_max) whereConditions.push({ maxParticipants: { lte: parseInt(capacity_max) } });
      if (creator_id) whereConditions.push({ createdBy: parseInt(creator_id) });
      if (registered_by_me === 'true' && userId) {
        whereConditions.push({ registrations: { some: { iduser: userId, status: '1' } } });
      } else if (registered_by_me === 'false' && userId) {
        whereConditions.push({ registrations: { none: { iduser: userId, status: '1' } } });
      }
      if (is_full === 'true') {
        whereConditions.push({ AND: [ { maxParticipants: { not: null } }, { registrations: { some: { status: '1' } } } ] });
      } else if (is_full === 'false') {
        whereConditions.push({ OR: [ { maxParticipants: null }, { AND: [ { maxParticipants: { not: null } }, { registrations: { none: { status: '1' } } } ] } ] });
      }
      if (q) {
        whereConditions.push({ OR: [ { name: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }, { location: { contains: q, mode: 'insensitive' } }, { creator: { name: { contains: q, mode: 'insensitive' } } } ] });
      }
      const where = whereConditions.length > 0 ? { AND: whereConditions } : {};
      const total = await prisma.activity.count({ where });
      const activities = await prisma.activity.findMany({
        where, skip, take: limitNum, orderBy: { [sortBy]: sortOrder },
        include: {
          creator: { select: { id: true, name: true, email: true, mssv: true, class: true } },
          _count: { select: { registrations: { where: { status: '1' } }, attendances: true } },
          registrations: { where: { iduser: userId ?? -1, status: '1' }, select: { id: true }, take: 1 },
        },
      });
      const result = activities.map(a => ({
        id: a.id, name: a.name, description: a.description, location: a.location,
        start_time: a.startTime, end_time: a.endTime, max_participants: a.maxParticipants,
        training_points: a.trainingPoints, registration_deadline: a.registrationDeadline,
        status: a.status, qr_code: a.qrCode, created_by: a.createdBy, creator: a.creator,
        created_at: a.createdAt, registered_count: a._count.registrations, attendance_count: a._count.attendances,
        registered_by_me: a.registrations.length > 0,
        is_full: a.maxParticipants ? a._count.registrations >= a.maxParticipants : false,
        available_spots: a.maxParticipants ? Math.max(0, a.maxParticipants - a._count.registrations) : null,
      }));
      return { activities: result, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }, filters: { q, status, location, start_date, end_date, capacity_min, capacity_max, creator_id, registered_by_me, is_full } };
    } catch (error) {
      return { error: { code: 500, message: 'Lỗi server' } };
    }
  }

  async getById(id, user) {
    try {
      const activityId = parseInt(id);
      if (isNaN(activityId)) return { error: { code: 400, message: 'ID không hợp lệ' } };
      const activity = await prisma.activity.findUnique({
        where: { id: activityId },
        include: {
          creator: { select: { id: true, name: true, email: true } },
          _count: { select: { registrations: true, attendances: true } },
          registrations: { where: { iduser: user?.sub ?? -1, status: '1' }, select: { id: true }, take: 1 },
        },
      });
      if (!activity) return { error: { code: 404, message: 'Không tìm thấy hoạt động' } };
      const result = {
        id: activity.id, name: activity.name, description: activity.description, location: activity.location,
        start_time: activity.startTime, end_time: activity.endTime, max_participants: activity.maxParticipants,
        training_points: activity.trainingPoints, registration_deadline: activity.registrationDeadline,
        status: activity.status, qr_code: activity.qrCode, created_by: activity.createdBy,
        creator: activity.creator, created_at: activity.createdAt, registered_count: activity._count.registrations,
        attendance_count: activity._count.attendances, registered_by_me: activity.registrations.length > 0,
        is_full: activity.maxParticipants ? activity._count.registrations >= activity.maxParticipants : false,
      };
      return { activity: result };
    } catch (error) {
      return { error: { code: 500, message: 'Lỗi server' } };
    }
  }

  async create(input, user) {
    try {
      const dto = input instanceof CreateActivityDTO ? input : new CreateActivityDTO(input);
      const { name, description, location, start_time, end_time, max_participants, training_points, registration_deadline, status } = dto;
      if (!name) return { error: { code: 400, message: 'Tên hoạt động là bắt buộc' } };
      if (!start_time || !end_time) return { error: { code: 400, message: 'Thời gian bắt đầu và kết thúc là bắt buộc' } };
      const startTime = new Date(start_time);
      const endTime = new Date(end_time);
      if (startTime >= endTime) return { error: { code: 400, message: 'Thời gian kết thúc phải sau thời gian bắt đầu' } };
      if (startTime < new Date()) return { error: { code: 400, message: 'Thời gian bắt đầu không được ở quá khứ' } };
      
      // Validate registration deadline
      if (registration_deadline) {
        const deadline = new Date(registration_deadline);
        if (deadline >= startTime) return { error: { code: 400, message: 'Hạn chót đăng ký phải trước thời gian bắt đầu hoạt động' } };
        if (deadline < new Date()) return { error: { code: 400, message: 'Hạn chót đăng ký không được ở quá khứ' } };
      }
      
      // Determine initial status: always start as upcoming (1)
      let initialStatus = 1;
      
      // Note: We intentionally ignore provided status on creation.
      // Status will auto-transition to 2 (ongoing) at start time via scheduler.

      const activity = await prisma.activity.create({
        data: {
          name, description, location, startTime, endTime,
          maxParticipants: max_participants ? parseInt(max_participants) : null,
          trainingPoints: training_points ? parseInt(training_points) : 0,
          registrationDeadline: registration_deadline ? new Date(registration_deadline) : null,
          createdBy: parseInt(user.sub), status: initialStatus,
        },
        include: { creator: { select: { id: true, name: true, email: true } } },
      });
      const result = { 
        id: activity.id, name: activity.name, description: activity.description, location: activity.location, 
        start_time: activity.startTime, end_time: activity.endTime, max_participants: activity.maxParticipants,
        training_points: activity.trainingPoints, registration_deadline: activity.registrationDeadline,
        status: activity.status, created_by: activity.createdBy, creator: activity.creator, created_at: activity.createdAt 
      };
      return { message: 'Tạo hoạt động thành công', activity: result };
    } catch (error) {
      return { error: { code: 500, message: 'Lỗi server' } };
    }
  }

  async update(id, input, user) {
    try {
      const activityId = parseInt(id);
      if (isNaN(activityId)) return { error: { code: 400, message: 'ID không hợp lệ' } };
      const existingActivity = await prisma.activity.findUnique({ where: { id: activityId } });
      if (!existingActivity) return { error: { code: 404, message: 'Không tìm thấy hoạt động' } };
      if (existingActivity.createdBy !== parseInt(user.sub) && user.role !== 'admin') return { error: { code: 403, message: 'Không có quyền chỉnh sửa hoạt động này' } };
      const dto = input instanceof UpdateActivityDTO ? input : new UpdateActivityDTO(input);
      const { name, description, location, start_time, end_time, max_participants, training_points, registration_deadline, status } = dto;
      
      const updateData = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (location !== undefined) updateData.location = location;
      if (max_participants !== undefined) updateData.maxParticipants = max_participants ? parseInt(max_participants) : null;
      if (training_points !== undefined) updateData.trainingPoints = training_points ? parseInt(training_points) : 0;
      if (registration_deadline !== undefined) updateData.registrationDeadline = registration_deadline ? new Date(registration_deadline) : null;
      if (status !== undefined) updateData.status = parseInt(status);
      if (start_time || end_time) {
        const startTime = start_time ? new Date(start_time) : existingActivity.startTime;
        const endTime = end_time ? new Date(end_time) : existingActivity.endTime;
        if (startTime >= endTime) return { error: { code: 400, message: 'Thời gian kết thúc phải sau thời gian bắt đầu' } };
        if (start_time) updateData.startTime = startTime;
        if (end_time) updateData.endTime = endTime;
      }
      
      // Validate registration deadline if provided
      if (registration_deadline !== undefined) {
        const deadline = new Date(registration_deadline);
        const startTime = updateData.startTime || existingActivity.startTime;
        if (deadline >= startTime) return { error: { code: 400, message: 'Hạn chót đăng ký phải trước thời gian bắt đầu hoạt động' } };
        if (deadline < new Date()) return { error: { code: 400, message: 'Hạn chót đăng ký không được ở quá khứ' } };
      }
      
      const updated = await prisma.activity.update({ where: { id: activityId }, data: updateData, include: { creator: { select: { id: true, name: true, email: true } } } });
      const result = { 
        id: updated.id, name: updated.name, description: updated.description, location: updated.location, 
        start_time: updated.startTime, end_time: updated.endTime, max_participants: updated.maxParticipants,
        training_points: updated.trainingPoints, registration_deadline: updated.registrationDeadline,
        status: updated.status, qr_code: updated.qrCode, created_by: updated.createdBy, creator: updated.creator, created_at: updated.createdAt 
      };
      return { message: 'Cập nhật hoạt động thành công', activity: result };
    } catch (error) {
      return { error: { code: 500, message: 'Lỗi server' } };
    }
  }

  async hardDelete(id, user) {
    try {
      const activityId = parseInt(id);
      if (isNaN(activityId)) return { error: { code: 400, message: 'ID không hợp lệ' } };
      const existingActivity = await prisma.activity.findUnique({ where: { id: activityId } });
      if (!existingActivity) return { error: { code: 404, message: 'Không tìm thấy hoạt động' } };
      if (existingActivity.createdBy !== parseInt(user.sub) && user.role !== 'admin') return { error: { code: 403, message: 'Không có quyền xóa hoạt động này' } };
      const registrationCount = await prisma.registration.count({ where: { idactivity: activityId } });
      if (registrationCount > 0) return { error: { code: 400, message: 'Không thể xóa hoạt động đã có người đăng ký. Vui lòng hủy hoạt động thay vì xóa.' } };
      await prisma.activity.delete({ where: { id: activityId } });
      return { data: true };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        return { error: { code: 400, message: 'Không thể xóa hoạt động có dữ liệu liên quan' } };
      }
      return { error: { code: 500, message: 'Lỗi server' } };
    }
  }

  async updateStatus(id, input, user) {
    try {
      const activityId = parseInt(id);
      const dto = input instanceof ActivityStatusDTO ? input : new ActivityStatusDTO(input);
      const { status } = dto;
      if (isNaN(activityId)) return { error: { code: 400, message: 'ID không hợp lệ' } };
      if (!status || ![1, 2, 3, 4].includes(parseInt(status))) return { error: { code: 400, message: 'Status phải là 1 (upcoming), 2 (ongoing), 3 (completed), hoặc 4 (cancelled)' } };
      const existingActivity = await prisma.activity.findUnique({ where: { id: activityId } });
      if (!existingActivity) return { error: { code: 404, message: 'Không tìm thấy hoạt động' } };
      if (existingActivity.createdBy !== parseInt(user.sub) && user.role !== 'admin') return { error: { code: 403, message: 'Không có quyền thay đổi trạng thái hoạt động này' } };
      const updated = await prisma.activity.update({ where: { id: activityId }, data: { status: parseInt(status) }, include: { creator: { select: { id: true, name: true, email: true } } } });
      const statusNames = { 1: 'upcoming', 2: 'ongoing', 3: 'completed', 4: 'cancelled' };
      return { message: `Cập nhật trạng thái hoạt động thành ${statusNames[parseInt(status)]}`, activity: { id: updated.id, name: updated.name, status: updated.status, status_name: statusNames[updated.status] } };
    } catch (error) {
      return { error: { code: 500, message: 'Lỗi server' } };
    }
  }

  async getMyActivities(query, user) {
    try {
      const { page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'desc' } = query;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;
      const where = { createdBy: user.sub, ...(status ? { status: parseInt(status) } : {}) };
      const total = await prisma.activity.count({ where });
      const activities = await prisma.activity.findMany({ 
        where, 
        skip, 
        take: limitNum, 
        orderBy: [
          { status: 'asc' }, // Status 2 (upcoming) sẽ lên đầu
          { [sortBy]: sortOrder }
        ], 
        include: { 
          _count: { 
            select: { 
              registrations: { where: { status: '1' } }, // Only count successful registrations
              attendances: true 
            } 
          } 
        } 
      });
      const result = activities.map(a => ({ id: a.id, name: a.name, description: a.description, location: a.location, start_time: a.startTime, end_time: a.endTime, max_participants: a.maxParticipants, status: a.status, qr_code: a.qrCode, created_at: a.createdAt, registered_count: a._count.registrations, attendance_count: a._count.attendances, is_full: a.maxParticipants ? a._count.registrations >= a.maxParticipants : false }));
      return { activities: result, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } };
    } catch (error) {
      return { error: { code: 500, message: 'Lỗi server' } };
    }
  }

  async getMyRegisteredActivities(query, user) {
    try {
      const { page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'desc' } = query;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;
      
      // Tìm các hoạt động mà user đã đăng ký
      const where = {
        registrations: {
          some: {
            iduser: user.sub,
            status: '1' // Chỉ lấy các đăng ký đã được duyệt
          }
        },
        ...(status ? { status: parseInt(status) } : {})
      };
      
      const total = await prisma.activity.count({ where });
      const activities = await prisma.activity.findMany({ 
        where, 
        skip, 
        take: limitNum, 
        orderBy: { [sortBy]: sortOrder }, 
        include: { 
          _count: { select: { registrations: true, attendances: true } },
          registrations: {
            where: { iduser: user.sub },
            select: { id: true, status: true, createdAt: true }
          }
        } 
      });
      
      const result = activities.map(a => ({
        id: a.id,
        name: a.name,
        description: a.description,
        location: a.location,
        start_time: a.startTime,
        end_time: a.endTime,
        max_participants: a.maxParticipants,
        status: a.status,
        qr_code: a.qrCode,
        created_at: a.createdAt,
        registered_count: a._count.registrations,
        attendance_count: a._count.attendances,
        is_full: a.maxParticipants ? a._count.registrations >= a.maxParticipants : false,
        my_registration: a.registrations[0] // Thông tin đăng ký của user
      }));
      
      return { activities: result, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } };
    } catch (error) {
      console.error('Get my registered activities error:', error);
      return { error: { code: 500, message: 'Lỗi server' } };
    }
  }

  async generateQRCode(id, user) {
    try {
      const activityId = parseInt(id);
      if (isNaN(activityId)) return { error: { code: 400, message: 'ID hoạt động không hợp lệ' } };
      const activity = await prisma.activity.findUnique({ where: { id: activityId }, select: { id: true, name: true, startTime: true, endTime: true, status: true, createdBy: true } });
      if (!activity) return { error: { code: 404, message: 'Không tìm thấy hoạt động' } };
      if (activity.createdBy !== user.sub && user.role !== 'admin') return { error: { code: 403, message: 'Không có quyền tạo QR code cho hoạt động này' } };
      if (activity.status === 4) return { error: { code: 400, message: 'Không thể tạo QR code cho hoạt động đã bị hủy' } };
      const qrCodeResult = await generateActivityQRCode(activity);
      const updated = await prisma.activity.update({ where: { id: activityId }, data: { qrCode: qrCodeResult.data }, select: { id: true, name: true, startTime: true, endTime: true, status: true, qrCode: true } });
      return { message: 'Tạo QR code thành công', activity: updated, qrCode: { data: qrCodeResult.data, image: qrCodeResult.image, generatedAt: qrCodeResult.generatedAt } };
    } catch (error) {
      return { error: { code: 500, message: 'Lỗi server' } };
    }
  }

  async getQRCode(id, user) {
    try {
      const activityId = parseInt(id);
      if (isNaN(activityId)) return { error: { code: 400, message: 'ID hoạt động không hợp lệ' } };
      const activity = await prisma.activity.findUnique({ where: { id: activityId }, select: { id: true, name: true, startTime: true, endTime: true, status: true, qrCode: true, createdBy: true } });
      if (!activity) return { error: { code: 404, message: 'Không tìm thấy hoạt động' } };
      if (activity.createdBy !== user.sub && user.role !== 'admin') return { error: { code: 403, message: 'Không có quyền xem QR code của hoạt động này' } };
      if (!activity.qrCode) return { error: { code: 404, message: 'QR code chưa được tạo cho hoạt động này' } };
      const qrCodeResult = await generateActivityQRCode(activity);
      return { activity: { id: activity.id, name: activity.name, startTime: activity.startTime, endTime: activity.endTime, status: activity.status }, qrCode: { data: qrCodeResult.data, image: qrCodeResult.image, generatedAt: qrCodeResult.generatedAt } };
    } catch (error) {
      return { error: { code: 500, message: 'Lỗi server' } };
    }
  }

  async validateQRCode(input) {
    try {
      const { qrData } = input;
      if (!qrData) return { error: { code: 400, message: 'QR code data là bắt buộc' } };
      const validation = validateQRCodeData(qrData);
      if (!validation.valid) return { error: { code: 400, message: 'QR code không hợp lệ' } };
      const activity = await prisma.activity.findUnique({ where: { id: validation.data.activityId }, select: { id: true, name: true, startTime: true, endTime: true, status: true } });
      if (!activity) return { error: { code: 404, message: 'Không tìm thấy hoạt động' } };
      if (activity.status !== 2) return { error: { code: 400, message: 'Chỉ có thể tạo/kiểm tra QR khi hoạt động đang diễn ra' } };
      return { message: 'QR code hợp lệ', activity, qrData: validation.data };
    } catch (error) {
      return { error: { code: 500, message: 'Lỗi server' } };
    }
  }

  // Lấy danh sách đăng ký của hoạt động
  async getActivityRegistrations(activityId, query, user) {
    try {
      const activityIdNum = parseInt(activityId);
      if (isNaN(activityIdNum)) return { error: { code: 400, message: 'ID hoạt động không hợp lệ' } };

      const { page = 1, limit = 20, search, status } = query;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const whereConditions = [{ idactivity: activityIdNum }];
      
      if (search) {
        whereConditions.push({
          OR: [
            { user: { name: { contains: search, mode: 'insensitive' } } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
            { user: { mssv: { contains: search, mode: 'insensitive' } } }
          ]
        });
      }
      
      if (status) {
        whereConditions.push({ status });
      }

      const where = { AND: whereConditions };
      const total = await prisma.registration.count({ where });
      
      const registrations = await prisma.registration.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, mssv: true, class: true } }
        }
      });

      const result = registrations.map(reg => ({
        id: reg.id,
        status: reg.status,
        created_at: reg.createdAt,
        user: reg.user
      }));

      return {
        registrations: result,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      };
    } catch (error) {
      return { error: { code: 500, message: 'Lỗi server' } };
    }
  }

  // Xuất đăng ký của hoạt động ra CSV
  async exportActivityRegistrations(activityId, query, user) {
    try {
      const activityIdNum = parseInt(activityId);
      if (isNaN(activityIdNum)) return { error: { code: 400, message: 'ID hoạt động không hợp lệ' } };

      const { status } = query;
      
      const whereConditions = [{ idactivity: activityIdNum }];
      if (status) whereConditions.push({ status });
      
      const where = { AND: whereConditions };
      
      const registrations = await prisma.registration.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, mssv: true, class: true } },
          activity: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      // Tạo CSV
      let csv = 'Tên,Email,MSSV,Lớp,Trạng thái,Ngày đăng ký\n';
      
      registrations.forEach(reg => {
        const name = `"${reg.user.name || 'N/A'}"`;
        const email = `"${reg.user.email || 'N/A'}"`;
        const mssv = `"${reg.user.mssv || 'N/A'}"`;
        const className = `"${reg.user.class || 'N/A'}"`;
        const statusText = reg.status === '1' ? 'Đã đăng ký' : reg.status === '0' ? 'Đã hủy' : 'Không xác định';
        const date = new Date(reg.createdAt).toLocaleDateString('vi-VN');
        
        csv += `${name},${email},${mssv},${className},${statusText},${date}\n`;
      });
      
      return { csv };
    } catch (error) {
      return { error: { code: 500, message: 'Lỗi server' } };
    }
  }

  // Lấy thống kê đăng ký của hoạt động
  async getActivityRegistrationStats(activityId, user) {
    try {
      const activityIdNum = parseInt(activityId);
      if (isNaN(activityIdNum)) return { error: { code: 400, message: 'ID hoạt động không hợp lệ' } };

      const totalRegistrations = await prisma.registration.count({
        where: { idactivity: activityIdNum }
      });

      const activeRegistrations = await prisma.registration.count({
        where: { idactivity: activityIdNum, status: '1' }
      });

      const cancelledRegistrations = await prisma.registration.count({
        where: { idactivity: activityIdNum, status: '0' }
      });

      const activity = await prisma.activity.findUnique({
        where: { id: activityIdNum },
        select: { maxParticipants: true, name: true }
      });

      return {
        totalRegistrations,
        activeRegistrations,
        cancelledRegistrations,
        maxParticipants: activity?.maxParticipants,
        activityName: activity?.name,
        isFull: activity?.maxParticipants ? activeRegistrations >= activity.maxParticipants : false
      };
    } catch (error) {
      return { error: { code: 500, message: 'Lỗi server' } };
    }
  }

  // Auto-update activity status based on time
  async updateActivityStatusByTime() {
    try {
      const now = new Date();
      
      // Update activities that should be ongoing (status 1 -> 2)
      const upcomingToOngoing = await prisma.activity.updateMany({
        where: {
          status: 1, // upcoming
          startTime: { lte: now },
          endTime: { gt: now }
        },
        data: { status: 2 } // ongoing
      });
      
      // Update activities that should be completed (status 2 -> 3)
      const ongoingToCompleted = await prisma.activity.updateMany({
        where: {
          status: 2, // ongoing only
          endTime: { lte: now }
        },
        data: { status: 3 } // completed
      });
      
      return {
        upcoming_to_ongoing: upcomingToOngoing.count,
        ongoing_to_completed: ongoingToCompleted.count
      };
    } catch (error) {
      console.error('Error updating activity status:', error);
      return { error: { code: 500, message: 'Lỗi cập nhật trạng thái hoạt động' } };
    }
  }

  // Admin-only: Get all activities without pagination
  async getAllActivities(query) {
    try {
      const dto = query instanceof ActivitiesListQueryDTO ? query : new ActivitiesListQueryDTO(query);
      const { q, status, location, start_date, end_date, capacity_min, capacity_max, creator_id, sortBy, sortOrder } = dto;
      const whereConditions = [];
      if (status) whereConditions.push({ status: parseInt(status) });
      if (location) whereConditions.push({ location: { contains: location, mode: 'insensitive' } });
      if (start_date) whereConditions.push({ startTime: { gte: new Date(start_date) } });
      if (end_date) whereConditions.push({ endTime: { lte: new Date(end_date) } });
      if (capacity_min) whereConditions.push({ maxParticipants: { gte: parseInt(capacity_min) } });
      if (capacity_max) whereConditions.push({ maxParticipants: { lte: parseInt(capacity_max) } });
      if (creator_id) whereConditions.push({ createdBy: parseInt(creator_id) });
      if (q) {
        whereConditions.push({ OR: [ { name: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }, { location: { contains: q, mode: 'insensitive' } } ] });
      }
      const where = whereConditions.length > 0 ? { AND: whereConditions } : {};
      const activities = await prisma.activity.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        include: {
          creator: { select: { id: true, name: true, email: true, mssv: true, class: true } },
          _count: { select: { registrations: { where: { status: '1' } }, attendances: true } },
        },
      });
      const result = activities.map(a => ({
        id: a.id,
        name: a.name,
        description: a.description,
        location: a.location,
        start_time: a.startTime,
        end_time: a.endTime,
        max_participants: a.maxParticipants,
        training_points: a.trainingPoints,
        registration_deadline: a.registrationDeadline,
        status: a.status,
        qr_code: a.qrCode,
        created_by: a.createdBy,
        creator: a.creator,
        created_at: a.createdAt,
        registered_count: a._count.registrations,
        attendance_count: a._count.attendances,
      }));
      return { activities: result };
    } catch (error) {
      return { error: { code: 500, message: 'Lỗi server' } };
    }
  }

  // Admin-only: Bulk delete activities
  async bulkDeleteActivities(activityIds) {
    try {
      const result = await prisma.activity.deleteMany({
        where: { id: { in: activityIds } }
      });
      return { data: { deletedCount: result.count } };
    } catch (error) {
      console.error('Bulk delete activities error:', error);
      return { error: { code: 500, message: 'Lỗi xóa hàng loạt hoạt động' } };
    }
  }

  // Admin-only: Export all activities
  async exportAllActivities(query) {
    try {
      const result = await this.getAllActivities(query);
      if (result.error) return result;
      
      // Format data for export
      const exportData = {
        activities: result.activities,
        exportDate: new Date().toISOString(),
        totalCount: result.activities.length,
      };
      
      return { data: exportData };
    } catch (error) {
      console.error('Export activities error:', error);
      return { error: { code: 500, message: 'Lỗi xuất dữ liệu hoạt động' } };
    }
  }
}

module.exports = new ActivitiesService();



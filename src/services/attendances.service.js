const prisma = require('../lib/prisma');
const { Prisma } = require('@prisma/client');
const { validateQRCodeData } = require('../utils/qrcode');
const { CheckinQRDTO, CheckinManualDTO, MyAttendancesQueryDTO, AttendanceIdDTO, ActivityIdParamsDTO } = require('../models/attendances.dto');

class AttendancesService {
  async checkinQR(input, user) {
    try {
      const userId = user.sub;
      const dto = input instanceof CheckinQRDTO ? input : new CheckinQRDTO(input);
      const { qrData } = dto;
      if (!qrData) return { error: { code: 400, message: 'QR code data là bắt buộc' } };
      const validation = validateQRCodeData(qrData);
      if (!validation.valid) return { error: { code: 400, message: 'QR code không hợp lệ' } };
      const { activityId } = validation.data;
      const registration = await prisma.registration.findUnique({ where: { idactivity_iduser: { idactivity: activityId, iduser: userId } }, include: { activity: { select: { id: true, name: true, startTime: true, endTime: true, status: true } } } });
      if (!registration) return { error: { code: 400, message: 'Bạn chưa đăng ký tham gia hoạt động này' } };
      if (registration.status !== '1') return { error: { code: 400, message: 'Đăng ký của bạn đã bị hủy, không thể điểm danh' } };
      if (registration.activity.status !== 2) return { error: { code: 400, message: 'Chỉ có thể điểm danh khi hoạt động đang diễn ra' } };
      const now = new Date();
      if (now < registration.activity.startTime) return { error: { code: 400, message: 'Hoạt động chưa bắt đầu' } };
      if (now > registration.activity.endTime) return { error: { code: 400, message: 'Hoạt động đã kết thúc' } };
      const existingAttendance = await prisma.attendance.findFirst({ where: { idactivity: activityId, iduser: userId } });
      if (existingAttendance) return { error: { code: 409, message: 'Bạn đã điểm danh rồi', attendance: { id: existingAttendance.id, checkinTime: existingAttendance.checkinTime, method: existingAttendance.method } } };
      const attendance = await prisma.attendance.create({ data: { idactivity: activityId, iduser: userId, checkinTime: now, method: 'qr_scan' }, include: { activity: { select: { id: true, name: true, startTime: true, endTime: true, location: true } }, user: { select: { id: true, name: true, email: true, mssv: true, class: true } } } });
      return { message: 'Điểm danh thành công', attendance: { id: attendance.id, checkinTime: attendance.checkinTime, method: attendance.method, activity: attendance.activity, user: attendance.user } };
    } catch (error) {
      return { error: { code: 500, message: 'Lỗi server' } };
    }
  }

  async checkinManual(input, user) {
    try {
      const { activityId, userId } = input instanceof CheckinManualDTO ? input : new CheckinManualDTO(input);
      const adminId = user.sub; const adminRole = user.role;
      if (!activityId || !userId) return { error: { code: 400, message: 'Activity ID và User ID là bắt buộc' } };
      const activityIdNum = parseInt(activityId); const userIdNum = parseInt(userId);
      if (isNaN(activityIdNum) || isNaN(userIdNum)) return { error: { code: 400, message: 'ID không hợp lệ' } };
      const activity = await prisma.activity.findUnique({ where: { id: activityIdNum }, select: { id: true, name: true, startTime: true, endTime: true, status: true, createdBy: true } });
      if (!activity) return { error: { code: 404, message: 'Không tìm thấy hoạt động' } };
      if (activity.createdBy !== parseInt(adminId) && adminRole !== 'admin') return { error: { code: 403, message: 'Không có quyền điểm danh thủ công' } };
      const userEntity = await prisma.user.findUnique({ where: { id: userIdNum }, select: { id: true, name: true, email: true, mssv: true, class: true, status: true } });
      if (!userEntity) return { error: { code: 404, message: 'Không tìm thấy người dùng' } };
      if (userEntity.status === 0) return { error: { code: 400, message: 'Tài khoản người dùng đã bị khóa' } };
      const registration = await prisma.registration.findUnique({ where: { idactivity_iduser: { idactivity: activityIdNum, iduser: userIdNum } } });
      if (!registration) return { error: { code: 400, message: 'Người dùng chưa đăng ký tham gia hoạt động này' } };
      if (registration.status !== '1') return { error: { code: 400, message: 'Đăng ký của người dùng đã bị hủy' } };
      if (activity.status !== 2) return { error: { code: 400, message: 'Chỉ có thể điểm danh khi hoạt động đang diễn ra' } };
      const existingAttendance = await prisma.attendance.findFirst({ where: { idactivity: activityIdNum, iduser: userIdNum } });
      if (existingAttendance) return { error: { code: 409, message: 'Người dùng đã điểm danh rồi', attendance: { id: existingAttendance.id, checkinTime: existingAttendance.checkinTime, method: existingAttendance.method } } };
      const attendance = await prisma.attendance.create({ data: { idactivity: activityIdNum, iduser: userIdNum, checkinTime: new Date(), method: 'manual' }, include: { activity: { select: { id: true, name: true, startTime: true, endTime: true, location: true } }, user: { select: { id: true, name: true, email: true, mssv: true, class: true } } } });
      return { message: 'Điểm danh thủ công thành công', attendance: { id: attendance.id, checkinTime: attendance.checkinTime, method: attendance.method, activity: attendance.activity, user: attendance.user } };
    } catch (error) {
      return { error: { code: 500, message: 'Lỗi server' } };
    }
  }

  async getMyAttendances(query, user) {
    try {
      const userId = user.sub;
      const dto = query instanceof MyAttendancesQueryDTO ? query : new MyAttendancesQueryDTO(query);
      const { page, limit, activityId, sortBy, sortOrder } = dto;
      const pageNum = parseInt(page); const limitNum = parseInt(limit); const skip = (pageNum - 1) * limitNum;
      const where = { iduser: userId, ...(activityId ? { idactivity: parseInt(activityId) } : {}) };
      const total = await prisma.attendance.count({ where });
      const attendances = await prisma.attendance.findMany({ where, skip, take: limitNum, orderBy: { [sortBy]: sortOrder }, include: { activity: { select: { id: true, name: true, description: true, location: true, startTime: true, endTime: true, status: true, creator: { select: { id: true, name: true, email: true } } } } } });
      const result = attendances.map(att => ({ id: att.id, checkinTime: att.checkinTime, method: att.method, activity: att.activity }));
      return { attendances: result, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } };
    } catch (error) {
      return { error: { code: 500, message: 'Lỗi server' } };
    }
  }

  async getById(id, user) {
    try {
      const attendanceId = (new AttendanceIdDTO(id)).id;
      if (isNaN(attendanceId)) return { error: { code: 400, message: 'ID điểm danh không hợp lệ' } };
      const attendance = await prisma.attendance.findUnique({ where: { id: attendanceId }, include: { activity: { select: { id: true, name: true, description: true, location: true, startTime: true, endTime: true, status: true, creator: { select: { id: true, name: true, email: true } } } }, user: { select: { id: true, name: true, email: true, mssv: true, class: true } } } });
      if (!attendance) return { error: { code: 404, message: 'Không tìm thấy bản ghi điểm danh' } };
      if (attendance.iduser !== user.sub && user.role !== 'admin') return { error: { code: 403, message: 'Không có quyền xem bản ghi điểm danh này' } };
      return { attendance: { id: attendance.id, checkinTime: attendance.checkinTime, method: attendance.method, activity: attendance.activity, user: attendance.user } };
    } catch (error) {
      return { error: { code: 500, message: 'Lỗi server' } };
    }
  }

  async getActivityAttendances(params, query, user) {
    try {
      const activityIdNum = (new ActivityIdParamsDTO(params)).activityId;
      if (isNaN(activityIdNum)) return { error: { code: 400, message: 'ID hoạt động không hợp lệ' } };
      const { page = 1, limit = 10, q, sortBy = 'checkinTime', sortOrder = 'desc' } = query;
      const pageNum = parseInt(page); const limitNum = parseInt(limit); const skip = (pageNum - 1) * limitNum;
      const activity = await prisma.activity.findUnique({ where: { id: activityIdNum }, select: { id: true, name: true, createdBy: true } });
      if (!activity) return { error: { code: 404, message: 'Không tìm thấy hoạt động' } };
      if (activity.createdBy !== parseInt(user.sub) && user.role !== 'admin') return { error: { code: 403, message: 'Không có quyền xem danh sách điểm danh của hoạt động này' } };
      const where = { idactivity: activityIdNum, ...(q ? { user: { OR: [ { name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }, { mssv: { contains: q, mode: 'insensitive' } }, { class: { contains: q, mode: 'insensitive' } } ] } } : {}) };
      const total = await prisma.attendance.count({ where });
      const attendances = await prisma.attendance.findMany({ where, skip, take: limitNum, orderBy: { [sortBy]: sortOrder }, include: { user: { select: { id: true, name: true, email: true, mssv: true, class: true } } } });
      const result = attendances.map(att => ({ id: att.id, checkinTime: att.checkinTime, method: att.method, user: att.user }));
      return { activity: { id: activity.id, name: activity.name }, attendances: result, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } };
    } catch (error) {
      return { error: { code: 500, message: 'Lỗi server' } };
    }
  }

  async getAttendanceStats(params, user) {
    try {
      const activityIdNum = (new ActivityIdParamsDTO(params)).activityId;
      if (isNaN(activityIdNum)) return { error: { code: 400, message: 'ID hoạt động không hợp lệ' } };
      const activity = await prisma.activity.findUnique({ where: { id: activityIdNum }, select: { id: true, name: true, startTime: true, endTime: true, maxParticipants: true, createdBy: true } });
      if (!activity) return { error: { code: 404, message: 'Không tìm thấy hoạt động' } };
      if (activity.createdBy !== parseInt(user.sub) && user.role !== 'admin') return { error: { code: 403, message: 'Không có quyền xem thống kê điểm danh của hoạt động này' } };
      const totalRegistrations = await prisma.registration.count({ where: { idactivity: activityIdNum, status: '1' } });
      const totalAttendances = await prisma.attendance.count({ where: { idactivity: activityIdNum } });
      const attendanceRate = totalRegistrations > 0 ? Math.round((totalAttendances / totalRegistrations) * 100) : 0;
      const attendanceByMethod = await prisma.attendance.groupBy({ by: ['method'], where: { idactivity: activityIdNum }, _count: { method: true } });
      const methodStats = attendanceByMethod.reduce((acc, item) => { acc[item.method] = item._count.method; return acc; }, {});
      return { activity: { id: activity.id, name: activity.name, startTime: activity.startTime, endTime: activity.endTime, maxParticipants: activity.maxParticipants }, statistics: { totalRegistrations, totalAttendances, attendanceRate, methodStats: { qr_scan: methodStats.qr_scan || 0, manual: methodStats.manual || 0 } } };
    } catch (error) {
      return { error: { code: 500, message: 'Lỗi server' } };
    }
  }
}

module.exports = new AttendancesService();



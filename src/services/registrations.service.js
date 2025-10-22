const prisma = require('../lib/prisma');
const { Prisma } = require('@prisma/client');
const { RegisterActivityDTO, CancelRegistrationParamsDTO, MyRegistrationsQueryDTO, RegistrationIdDTO } = require('../models/registrations.dto');

class RegistrationsService {
  async register(input, user) {
    try {
      const userId = user.sub;
      const dto = input instanceof RegisterActivityDTO ? input : new RegisterActivityDTO(input);
      const { activityId } = dto;
      if (!activityId) return { error: { code: 400, message: 'ID hoạt động là bắt buộc' } };
      const activityIdNum = parseInt(activityId);
      if (isNaN(activityIdNum)) return { error: { code: 400, message: 'ID hoạt động không hợp lệ' } };
      const activity = await prisma.activity.findUnique({ where: { id: activityIdNum }, include: { _count: { select: { registrations: true } } } });
      if (!activity) return { error: { code: 404, message: 'Không tìm thấy hoạt động' } };
      if (activity.status !== 1) return { error: { code: 400, message: 'Chỉ có thể đăng ký hoạt động ở trạng thái "upcoming"' } };
      if (new Date() >= activity.startTime) return { error: { code: 400, message: 'Không thể đăng ký hoạt động đã bắt đầu' } };
      const activeRegistrationsCount = await prisma.registration.count({ where: { idactivity: activityIdNum, status: '1' } });
      if (activity.maxParticipants && activeRegistrationsCount >= activity.maxParticipants) return { error: { code: 409, message: 'Hoạt động đã đầy, không thể đăng ký thêm' } };
      const existingRegistration = await prisma.registration.findUnique({ where: { idactivity_iduser: { idactivity: activityIdNum, iduser: userId } } });
      if (existingRegistration) {
        if (existingRegistration.status === '1') return { error: { code: 409, message: 'Bạn đã đăng ký hoạt động này rồi' } };
        if (existingRegistration.status === '3') {
          const updatedRegistration = await prisma.registration.update({
            where: { idactivity_iduser: { idactivity: activityIdNum, iduser: userId } },
            data: { status: '1' },
            include: { activity: { select: { id: true, name: true, startTime: true, endTime: true, location: true } } },
          });
          return { message: 'Đăng ký lại hoạt động thành công', registration: { id: updatedRegistration.id, activity: updatedRegistration.activity, status: updatedRegistration.status, registered_at: updatedRegistration.createdAt } };
        }
      }
      const registration = await prisma.registration.create({
        data: { idactivity: activityIdNum, iduser: userId, status: '1' },
        include: { activity: { select: { id: true, name: true, startTime: true, endTime: true, location: true } } },
      });
      return { message: 'Đăng ký hoạt động thành công', registration: { id: registration.id, activity: registration.activity, status: registration.status, registered_at: registration.createdAt } };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return { error: { code: 409, message: 'Bạn đã đăng ký hoạt động này rồi' } };
      }
      return { error: { code: 500, message: 'Lỗi server' } };
    }
  }

  async cancel(params, user) {
    try {
      const userId = user.sub;
      const p = params instanceof CancelRegistrationParamsDTO ? params : new CancelRegistrationParamsDTO(params);
      const activityIdNum = p.activityId;
      if (isNaN(activityIdNum)) return { error: { code: 400, message: 'ID hoạt động không hợp lệ' } };
      const registration = await prisma.registration.findUnique({ where: { idactivity_iduser: { idactivity: activityIdNum, iduser: userId } }, include: { activity: { select: { id: true, name: true, startTime: true, status: true } } } });
      if (!registration) return { error: { code: 404, message: 'Không tìm thấy đăng ký hoạt động' } };
      if (registration.status === '3') return { error: { code: 400, message: 'Bạn đã hủy đăng ký hoạt động này rồi' } };
      if (new Date() >= registration.activity.startTime) return { error: { code: 400, message: 'Không thể hủy đăng ký hoạt động đã bắt đầu' } };
      const updated = await prisma.registration.update({ where: { idactivity_iduser: { idactivity: activityIdNum, iduser: userId } }, data: { status: '3' }, include: { activity: { select: { id: true, name: true } } } });
      return { message: 'Hủy đăng ký hoạt động thành công', registration: { id: updated.id, activity: updated.activity, status: updated.status, cancelled_at: new Date() } };
    } catch (error) {
      return { error: { code: 500, message: 'Lỗi server' } };
    }
  }

  async getMyRegistrations(query, user) {
    try {
      const userId = user.sub;
      const dto = query instanceof MyRegistrationsQueryDTO ? query : new MyRegistrationsQueryDTO(query);
      const { page, limit, status, sortBy, sortOrder } = dto;
      const pageNum = parseInt(page); const limitNum = parseInt(limit); const skip = (pageNum - 1) * limitNum;
      const where = { iduser: userId, ...(status ? { status } : {}) };
      const total = await prisma.registration.count({ where });
      const registrations = await prisma.registration.findMany({ where, skip, take: limitNum, orderBy: { [sortBy]: sortOrder }, include: { activity: { select: { id: true, name: true, description: true, location: true, startTime: true, endTime: true, maxParticipants: true, status: true, creator: { select: { id: true, name: true, email: true } }, _count: { select: { registrations: true } } } } } });
      const result = registrations.map(reg => ({ id: reg.id, status: reg.status, registered_at: reg.createdAt, activity: { id: reg.activity.id, name: reg.activity.name, description: reg.activity.description, location: reg.activity.location, start_time: reg.activity.startTime, end_time: reg.activity.endTime, max_participants: reg.activity.maxParticipants, status: reg.activity.status, creator: reg.activity.creator, registered_count: reg.activity._count.registrations, is_full: reg.activity.maxParticipants ? reg.activity._count.registrations >= reg.activity.maxParticipants : false } }));
      return { registrations: result, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } };
    } catch (error) {
      return { error: { code: 500, message: 'Lỗi server' } };
    }
  }

  async getById(id, user) {
    try {
      const registrationId = (new RegistrationIdDTO(id)).id;
      if (isNaN(registrationId)) return { error: { code: 400, message: 'ID đăng ký không hợp lệ' } };
      const reg = await prisma.registration.findUnique({ where: { id: registrationId }, include: { activity: { select: { id: true, name: true, description: true, location: true, startTime: true, endTime: true, maxParticipants: true, status: true, creator: { select: { id: true, name: true, email: true } } } }, user: { select: { id: true, name: true, email: true, mssv: true, class: true } } } });
      if (!reg) return { error: { code: 404, message: 'Không tìm thấy đăng ký' } };
      if (reg.iduser !== user.sub && user.role !== 'admin') return { error: { code: 403, message: 'Không có quyền xem đăng ký này' } };
      return { registration: { id: reg.id, status: reg.status, registered_at: reg.createdAt, activity: reg.activity, user: reg.user } };
    } catch (error) {
      return { error: { code: 500, message: 'Lỗi server' } };
    }
  }

  // Manager: Lấy tất cả đăng ký
  async getAllRegistrations(query, user) {
    try {
      const { page = 1, limit = 20, search, status, activity_id } = query;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const whereConditions = [];
      
      if (search) {
        whereConditions.push({
          OR: [
            { user: { name: { contains: search, mode: 'insensitive' } } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
            { user: { mssv: { contains: search, mode: 'insensitive' } } },
            { activity: { name: { contains: search, mode: 'insensitive' } } }
          ]
        });
      }
      
      if (status) {
        whereConditions.push({ status });
      }
      
      if (activity_id) {
        whereConditions.push({ idactivity: parseInt(activity_id) });
      }

      const where = whereConditions.length > 0 ? { AND: whereConditions } : {};
      const total = await prisma.registration.count({ where });
      
      const registrations = await prisma.registration.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, mssv: true, class: true } },
          activity: { select: { id: true, name: true, description: true, location: true, startTime: true, endTime: true, status: true } }
        }
      });

      const result = registrations.map(reg => ({
        id: reg.id,
        status: reg.status,
        created_at: reg.createdAt,
        user: reg.user,
        activity: reg.activity
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

  // Manager: Cập nhật trạng thái đăng ký
  async updateStatus(id, body, user) {
    try {
      const registrationId = parseInt(id);
      const { status } = body;
      
      if (isNaN(registrationId)) return { error: { code: 400, message: 'ID đăng ký không hợp lệ' } };
      if (!status) return { error: { code: 400, message: 'Trạng thái là bắt buộc' } };
      
      const registration = await prisma.registration.findUnique({
        where: { id: registrationId },
        include: { activity: { select: { id: true, name: true } } }
      });
      
      if (!registration) return { error: { code: 404, message: 'Không tìm thấy đăng ký' } };
      
      const updated = await prisma.registration.update({
        where: { id: registrationId },
        data: { status },
        include: {
          user: { select: { id: true, name: true, email: true, mssv: true, class: true } },
          activity: { select: { id: true, name: true } }
        }
      });
      
      return {
        message: 'Cập nhật trạng thái đăng ký thành công',
        registration: {
          id: updated.id,
          status: updated.status,
          user: updated.user,
          activity: updated.activity
        }
      };
    } catch (error) {
      return { error: { code: 500, message: 'Lỗi server' } };
    }
  }

  // Manager: Cập nhật trạng thái hàng loạt
  async batchUpdateStatus(body, user) {
    try {
      const { registration_ids, status } = body;
      
      if (!registration_ids || !Array.isArray(registration_ids) || registration_ids.length === 0) {
        return { error: { code: 400, message: 'Danh sách ID đăng ký là bắt buộc' } };
      }
      if (!status) return { error: { code: 400, message: 'Trạng thái là bắt buộc' } };
      
      const updated = await prisma.registration.updateMany({
        where: { id: { in: registration_ids } },
        data: { status }
      });
      
      return {
        message: `Cập nhật trạng thái thành công cho ${updated.count} đăng ký`,
        updated_count: updated.count
      };
    } catch (error) {
      return { error: { code: 500, message: 'Lỗi server' } };
    }
  }

  // Manager: Xóa đăng ký
  async deleteRegistration(id, user) {
    try {
      const registrationId = parseInt(id);
      if (isNaN(registrationId)) return { error: { code: 400, message: 'ID đăng ký không hợp lệ' } };
      
      const registration = await prisma.registration.findUnique({
        where: { id: registrationId }
      });
      
      if (!registration) return { error: { code: 404, message: 'Không tìm thấy đăng ký' } };
      
      await prisma.registration.delete({
        where: { id: registrationId }
      });
      
      return { message: 'Xóa đăng ký thành công' };
    } catch (error) {
      return { error: { code: 500, message: 'Lỗi server' } };
    }
  }

  // Manager: Xóa đăng ký hàng loạt
  async batchDeleteRegistrations(body, user) {
    try {
      const { registration_ids } = body;
      
      if (!registration_ids || !Array.isArray(registration_ids) || registration_ids.length === 0) {
        return { error: { code: 400, message: 'Danh sách ID đăng ký là bắt buộc' } };
      }
      
      const deleted = await prisma.registration.deleteMany({
        where: { id: { in: registration_ids } }
      });
      
      return {
        message: `Xóa thành công ${deleted.count} đăng ký`,
        deleted_count: deleted.count
      };
    } catch (error) {
      return { error: { code: 500, message: 'Lỗi server' } };
    }
  }

  // Manager: Xuất đăng ký ra CSV
  async exportRegistrations(query, user) {
    try {
      const { activity_id, status } = query;
      
      const whereConditions = [];
      if (activity_id) whereConditions.push({ idactivity: parseInt(activity_id) });
      if (status) whereConditions.push({ status });
      
      const where = whereConditions.length > 0 ? { AND: whereConditions } : {};
      
      const registrations = await prisma.registration.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, mssv: true, class: true } },
          activity: { select: { id: true, name: true, description: true, location: true, startTime: true, endTime: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      // Tạo CSV
      let csv = 'Tên,Email,MSSV,Lớp,Hoạt động,Trạng thái,Ngày đăng ký\n';
      
      registrations.forEach(reg => {
        const name = `"${reg.user.name || 'N/A'}"`;
        const email = `"${reg.user.email || 'N/A'}"`;
        const mssv = `"${reg.user.mssv || 'N/A'}"`;
        const className = `"${reg.user.class || 'N/A'}"`;
        const activityName = `"${reg.activity.name || 'N/A'}"`;
        const statusText = reg.status === '1' ? 'Đã đăng ký' : reg.status === '0' ? 'Đã hủy' : 'Không xác định';
        const date = new Date(reg.createdAt).toLocaleDateString('vi-VN');
        
        csv += `${name},${email},${mssv},${className},${activityName},${statusText},${date}\n`;
      });
      
      return { csv };
    } catch (error) {
      return { error: { code: 500, message: 'Lỗi server' } };
    }
  }
}

module.exports = new RegistrationsService();



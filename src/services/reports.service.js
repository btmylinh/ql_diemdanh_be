const prisma = require('../lib/prisma');

class ReportsService {
  // Lấy dữ liệu thống kê tổng quan
  async getOverview() {
    try {
      // Thống kê hoạt động
      const totalActivities = await prisma.activity.count();
      const activeActivities = await prisma.activity.count({ where: { status: 1 } });
      const upcomingActivities = await prisma.activity.count({ where: { status: 0 } });
      const completedActivities = await prisma.activity.count({ where: { status: 2 } });

      // Thống kê người dùng
      const totalUsers = await prisma.user.count();
      const adminUsers = await prisma.user.count({ where: { role: 'admin' } });
      const managerUsers = await prisma.user.count({ where: { role: 'manager' } });
      const studentUsers = await prisma.user.count({ where: { role: 'student' } });

      // Thống kê đăng ký
      const totalRegistrations = await prisma.registration.count();

      // Thống kê điểm danh
      const totalAttendances = await prisma.attendance.count();

  return {
        activities: {
          total: totalActivities,
          active: activeActivities,
          upcoming: upcomingActivities,
          completed: completedActivities,
        },
        users: {
          total: totalUsers,
          admin: adminUsers,
          manager: managerUsers,
          student: studentUsers,
        },
        registrations: {
          total: totalRegistrations,
        },
        attendances: {
          total: totalAttendances,
        },
      };
    } catch (error) {
      console.error('Error getting overview stats:', error);
      throw error;
    }
  }

  // Lấy xu hướng đăng ký theo thời gian
  async getRegistrationsTrend(startDate, endDate) {
    try {
      const where = {};
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const registrations = await prisma.registration.findMany({
        where,
        select: {
          createdAt: true,
        },
      });

      // Nhóm theo ngày
      const grouped = {};
      registrations.forEach(reg => {
        const date = reg.createdAt.toISOString().split('T')[0];
        grouped[date] = (grouped[date] || 0) + 1;
      });

      return Object.entries(grouped).map(([date, count]) => ({
        date,
        count,
      }));
    } catch (error) {
      console.error('Error getting registrations trend:', error);
      throw error;
    }
  }

  // Lấy hoạt động theo trạng thái
  async getActivitiesByStatus(startDate, endDate) {
    try {
  const where = {};
      
      if (startDate || endDate) {
    where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const statuses = await prisma.activity.groupBy({
        by: ['status'],
        where,
        _count: true,
      });

      return statuses.map(item => ({
        status: item.status,
        count: item._count,
        label: this.getStatusLabel(item.status),
      }));
    } catch (error) {
      console.error('Error getting activities by status:', error);
      throw error;
    }
  }

  // Lấy top hoạt động được đăng ký nhiều nhất
  async getTopActivities(limit = 10, startDate, endDate) {
    try {
      const where = {};
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const activities = await prisma.activity.findMany({
        where,
        include: {
          _count: {
            select: {
              registrations: {
                where: {
                  status: '1', // Chỉ đếm đăng ký đã duyệt
                },
              },
            },
          },
        },
        take: limit,
        orderBy: {
          registrations: {
            _count: 'desc',
          },
        },
      });

      return activities.map(activity => ({
        id: activity.id,
        name: activity.name,
        registrations: activity._count.registrations,
      }));
    } catch (error) {
      console.error('Error getting top activities:', error);
      throw error;
    }
  }

  // Helper method
  getStatusLabel(status) {
    switch (status) {
      case 0: return 'Mở đăng ký';
      case 1: return 'Đang diễn ra';
      case 2: return 'Đã kết thúc';
      case 3: return 'Đã hủy';
      default: return 'Không xác định';
    }
  }
}

module.exports = new ReportsService();

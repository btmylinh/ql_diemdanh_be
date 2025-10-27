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

  // Tạo báo cáo theo ngày với nhiều thông tin tổng hợp
  async generateDailyReport(date = null) {
    try {
      const reportDate = date ? new Date(date) : new Date();
      reportDate.setHours(0, 0, 0, 0);
      
      // Kiểm tra xem đã có báo cáo cho ngày này chưa
      const existing = await prisma.periodic_report.findFirst({
        where: {
          reportDate: reportDate,
        },
      });
      
      if (existing) {
        console.log(`Báo cáo ngày ${reportDate.toISOString()} đã tồn tại`);
        return existing;
      }

      // Tạo khoảng thời gian cho ngày
      const startOfDay = new Date(reportDate);
      const endOfDay = new Date(reportDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Thống kê hoạt động tạo trong ngày
      const [totalActivities, 
             activitiesCreated,
             activeActivities,
             completedActivities] = await Promise.all([
        prisma.activity.count(),
        prisma.activity.count({
          where: {
            createdAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        }),
        prisma.activity.count({ where: { status: 1 } }),
        prisma.activity.count({ where: { status: 2 } }),
      ]);

      // Thống kê người dùng
      const [totalUsers, 
             newUsersToday,
             activeUsers] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: {
            createdAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
            status: 1,
          },
        }),
        prisma.user.count({ where: { status: 1 } }),
      ]);

      // Thống kê đăng ký trong ngày và tổng
      const [registrationsToday, totalRegistrations] = await Promise.all([
        prisma.registration.count({
          where: {
            createdAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        }),
        prisma.registration.count(),
      ]);

      // Thống kê điểm danh trong ngày và tổng
      const [attendancesToday, totalAttendances] = await Promise.all([
        prisma.attendance.count({
          where: {
            checkinTime: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        }),
        prisma.attendance.count(),
      ]);

      // Thống kê theo vai trò
      const [adminUsers, managerUsers, studentUsers] = await Promise.all([
        prisma.user.count({ where: { role: 'admin' } }),
        prisma.user.count({ where: { role: 'manager' } }),
        prisma.user.count({ where: { role: 'student' } }),
      ]);

      // Top hoạt động được đăng ký nhiều nhất
      const topActivities = await prisma.activity.findMany({
        include: {
          _count: {
            select: {
              registrations: true,
              attendances: true,
            },
          },
        },
        orderBy: {
          registrations: {
            _count: 'desc',
          },
        },
        take: 5,
      });

      const summary = {
        reportDate: reportDate.toISOString(),
        totalActivities,
        activitiesCreated,
        activeActivities,
        completedActivities,
        totalUsers,
        newUsersToday,
        activeUsers,
        adminUsers,
        managerUsers,
        studentUsers,
        registrationsToday,
        totalRegistrations,
        attendancesToday,
        totalAttendances,
        topActivities: topActivities.map(a => ({
          id: a.id,
          name: a.name,
          registrations: a._count.registrations,
          attendances: a._count.attendances,
        })),
      };

      // Lưu vào database
      const report = await prisma.periodic_report.create({
        data: {
          reportDate: reportDate,
          totalActivities,
          activitiesCreated,
          activeActivities,
          completedActivities,
          totalUsers,
          newUsers: newUsersToday,
          activeUsers,
          adminUsers,
          managerUsers,
          studentUsers,
          registrationsToday,
          totalRegistrations,
          attendancesToday,
          totalAttendances,
          topActivities: JSON.stringify(summary.topActivities),
        },
      });

      return report;
    } catch (error) {
      console.error('Error generating daily report:', error);
      throw error;
    }
  }

  // Lấy báo cáo định kỳ từ các báo cáo đã lưu theo date range
  async getPeriodicReport(period, startDate, endDate) {
    try {
      const start = startDate ? new Date(startDate) : new Date();
      start.setHours(0, 0, 0, 0);
      const end = endDate ? new Date(endDate) : new Date();
      end.setHours(23, 59, 59, 999);

      // Lấy tất cả báo cáo trong khoảng thời gian
      const reports = await prisma.periodic_report.findMany({
        where: {
          reportDate: {
            gte: start,
            lte: end,
          },
          type: 'daily',
        },
        orderBy: {
          reportDate: 'asc',
        },
      });

      if (reports.length === 0) {
        // Nếu chưa có báo cáo, tạo real-time
        return this.getRealTimeReport(start, end);
      }

      // Aggregate data từ các báo cáo
      const aggregated = {
        totalActivities: reports[0]?.totalActivities || 0,
        activitiesCreated: reports.reduce((sum, r) => sum + r.activitiesCreated, 0),
        activeActivities: reports[reports.length - 1]?.activeActivities || 0,
        completedActivities: reports[reports.length - 1]?.completedActivities || 0,
        totalUsers: reports[0]?.totalUsers || 0,
        newUsers: reports.reduce((sum, r) => sum + r.newUsers, 0),
        activeUsers: reports[0]?.activeUsers || 0,
        adminUsers: reports[0]?.adminUsers || 0,
        managerUsers: reports[0]?.managerUsers || 0,
        studentUsers: reports[0]?.studentUsers || 0,
        registrations: reports.reduce((sum, r) => sum + r.registrationsToday, 0),
        totalRegistrations: reports[reports.length - 1]?.totalRegistrations || 0,
        attendances: reports.reduce((sum, r) => sum + r.attendancesToday, 0),
        totalAttendances: reports[reports.length - 1]?.totalAttendances || 0,
        topActivities: reports[0]?.topActivities ? JSON.parse(reports[0].topActivities) : [],
        trendsByDay: reports.map(r => ({
          date: r.reportDate.toISOString(),
          count: r.activitiesCreated,
        })),
        period,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      };

      return aggregated;
    } catch (error) {
      console.error('Error getting periodic report:', error);
      throw error;
    }
  }

  // Lấy báo cáo real-time (fallback khi chưa có báo cáo)
  async getRealTimeReport(startDate, endDate) {
    const where = {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    };

    const [totalActivities, activeActivities, completedActivities] = await Promise.all([
      prisma.activity.count({ where }),
      prisma.activity.count({ where: { ...where, status: 1 } }),
      prisma.activity.count({ where: { ...where, status: 2 } }),
    ]);

    const [totalRegistrations, totalAttendances] = await Promise.all([
      prisma.registration.count({ where }),
      prisma.attendance.count({ where }),
    ]);

    return {
      totalActivities,
      activeActivities,
      completedActivities,
      totalRegistrations,
      totalAttendances,
      topActivities: [],
      trendsByDay: [],
    };
  }

  // Lấy danh sách báo cáo định kỳ đã lưu
  async getStoredPeriodicReports(limit = 20) {
    try {
      const reports = await prisma.periodic_report.findMany({
        take: limit,
        orderBy: { reportDate: 'desc' },
      });

      return reports.map(r => ({
        id: r.id,
        reportDate: r.reportDate,
        createdAt: r.createdAt,
        totalActivities: r.totalActivities,
        activitiesCreated: r.activitiesCreated,
        activeActivities: r.activeActivities,
        completedActivities: r.completedActivities,
        totalUsers: r.totalUsers,
        newUsers: r.newUsers,
        activeUsers: r.activeUsers,
        adminUsers: r.adminUsers,
        managerUsers: r.managerUsers,
        studentUsers: r.studentUsers,
        registrationsToday: r.registrationsToday,
        totalRegistrations: r.totalRegistrations,
        attendancesToday: r.attendancesToday,
        totalAttendances: r.totalAttendances,
        topActivities: r.topActivities ? JSON.parse(r.topActivities) : [],
      }));
    } catch (error) {
      console.error('Error getting stored periodic reports:', error);
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

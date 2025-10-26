const fs = require('fs').promises;
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class BackupService {
  constructor() {
    this.backupDir = path.join(__dirname, '../../backups');
    this.ensureBackupDir();
  }

  async ensureBackupDir() {
    try {
      await fs.access(this.backupDir);
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true });
    }
  }

  // Lấy thống kê tổng quan cho dashboard
  async getDashboardStats() {
    try {
      const [
        totalActivities,
        activeActivities,
        upcomingActivities,
        completedActivities,
        totalUsers,
        totalRegistrations,
        totalAttendances
      ] = await Promise.all([
        prisma.activity.count(),
        prisma.activity.count({ where: { status: 1 } }),
        prisma.activity.count({ where: { status: 0 } }),
        prisma.activity.count({ where: { status: 2 } }),
        prisma.user.count({ where: { status: 1 } }),
        prisma.registration.count(),
        prisma.attendance.count()
      ]);

      return {
        success: true,
        data: {
          totalActivities,
          activeActivities,
          upcomingActivities,
          completedActivities,
          totalUsers,
          totalRegistrations,
          totalAttendances
        }
      };
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      return {
        error: {
          code: 500,
          message: 'Không thể lấy thống kê: ' + error.message
        }
      };
    }
  }

  // Tạo bản sao lưu toàn bộ dữ liệu
  async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupData = await this.exportAllData();
      
      const backupFile = {
        id: `backup_${timestamp}`,
        fileName: `backup_${timestamp}.json`,
        createdAt: new Date().toISOString(),
        metadata: {
          totalActivities: backupData.activities.length,
          totalUsers: backupData.users.length,
          totalRegistrations: backupData.registrations.length,
          totalAttendances: backupData.attendances.length,
        },
        data: backupData
      };

      const filePath = path.join(this.backupDir, backupFile.fileName);
      await fs.writeFile(filePath, JSON.stringify(backupFile, null, 2));

      return {
        success: true,
        message: 'Tạo bản sao lưu thành công',
        data: {
          id: backupFile.id,
          fileName: backupFile.fileName,
          filePath: filePath,
          metadata: backupFile.metadata,
          createdAt: backupFile.createdAt
        }
      };
    } catch (error) {
      console.error('Create backup error:', error);
      return {
        error: {
          code: 500,
          message: 'Không thể tạo bản sao lưu: ' + error.message
        }
      };
    }
  }

  // Khôi phục dữ liệu từ file
  async restoreBackup(backupData) {
    try {
      // Validate backup data
      if (!backupData || !backupData.data) {
        return {
          error: {
            code: 400,
            message: 'Dữ liệu sao lưu không hợp lệ'
          }
        };
      }

      // Clear existing data (be careful in production!)
      await this.clearAllData();

      // Restore data
      const { activities, users, registrations, attendances } = backupData.data;

      // Restore users first (due to foreign key constraints)
      if (users && users.length > 0) {
        await prisma.user.createMany({
          data: users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            password: user.password,
            role: user.role,
            mssv: user.mssv,
            class: user.class,
            phone: user.phone,
            status: user.status,
            created_at: new Date(user.created_at),
            updated_at: new Date(user.updated_at)
          })),
          skipDuplicates: true
        });
      }

      // Restore activities
      if (activities && activities.length > 0) {
        await prisma.activity.createMany({
          data: activities.map(activity => ({
            id: activity.id,
            name: activity.name,
            description: activity.description,
            location: activity.location,
            start_time: new Date(activity.start_time),
            end_time: new Date(activity.end_time),
            max_participants: activity.max_participants,
            training_points: activity.training_points,
            status: activity.status,
            creator_id: activity.creator_id,
            created_at: new Date(activity.created_at),
            updated_at: new Date(activity.updated_at)
          })),
          skipDuplicates: true
        });
      }

      // Restore registrations
      if (registrations && registrations.length > 0) {
        await prisma.registration.createMany({
          data: registrations.map(registration => ({
            id: registration.id,
            user_id: registration.user_id,
            activity_id: registration.activity_id,
            status: registration.status,
            created_at: new Date(registration.created_at),
            updated_at: new Date(registration.updated_at)
          })),
          skipDuplicates: true
        });
      }

      // Restore attendances
      if (attendances && attendances.length > 0) {
        await prisma.attendance.createMany({
          data: attendances.map(attendance => ({
            id: attendance.id,
            user_id: attendance.user_id,
            activity_id: attendance.activity_id,
            check_in_time: attendance.check_in_time ? new Date(attendance.check_in_time) : null,
            check_out_time: attendance.check_out_time ? new Date(attendance.check_out_time) : null,
            status: attendance.status,
            created_at: new Date(attendance.created_at),
            updated_at: new Date(attendance.updated_at)
          })),
          skipDuplicates: true
        });
      }

      return {
        success: true,
        message: 'Khôi phục dữ liệu thành công',
        data: {
          restored: {
            users: users?.length || 0,
            activities: activities?.length || 0,
            registrations: registrations?.length || 0,
            attendances: attendances?.length || 0
          }
        }
      };
    } catch (error) {
      console.error('Restore backup error:', error);
      return {
        error: {
          code: 500,
          message: 'Không thể khôi phục dữ liệu: ' + error.message
        }
      };
    }
  }

  // Lấy danh sách các bản sao lưu
  async listBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.stat(filePath);
          const content = await fs.readFile(filePath, 'utf8');
          const backupData = JSON.parse(content);

          backups.push({
            id: backupData.id,
            fileName: file,
            createdAt: backupData.createdAt,
            metadata: backupData.metadata,
            size: stats.size
          });
        }
      }

      // Sort by creation date (newest first)
      backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return {
        success: true,
        data: backups
      };
    } catch (error) {
      console.error('List backups error:', error);
      return {
        error: {
          code: 500,
          message: 'Không thể lấy danh sách sao lưu: ' + error.message
        }
      };
    }
  }

  // Xóa bản sao lưu
  async deleteBackup(backupId) {
    try {
      const filePath = path.join(this.backupDir, `${backupId}.json`);
      await fs.unlink(filePath);

      return {
        success: true,
        message: 'Xóa bản sao lưu thành công'
      };
    } catch (error) {
      console.error('Delete backup error:', error);
      return {
        error: {
          code: 500,
          message: 'Không thể xóa bản sao lưu: ' + error.message
        }
      };
    }
  }

  // Xuất báo cáo
  async exportReport(type, options = {}) {
    try {
      let data;
      let fileName;

      switch (type) {
        case 'activities':
          data = await this.exportActivities(options);
          fileName = `activities_report_${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'users':
          data = await this.exportUsers(options);
          fileName = `users_report_${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'attendances':
          data = await this.exportAttendances(options);
          fileName = `attendances_report_${new Date().toISOString().split('T')[0]}.json`;
          break;
        default:
          return {
            error: {
              code: 400,
              message: 'Loại báo cáo không hợp lệ'
            }
          };
      }

      const filePath = path.join(this.backupDir, fileName);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));

      return {
        success: true,
        message: 'Xuất báo cáo thành công',
        data: {
          fileName,
          filePath,
          recordCount: data.length
        }
      };
    } catch (error) {
      console.error('Export report error:', error);
      return {
        error: {
          code: 500,
          message: 'Không thể xuất báo cáo: ' + error.message
        }
      };
    }
  }

  // Export tất cả dữ liệu
  async exportAllData() {
    const [activities, users, registrations, attendances] = await Promise.all([
      prisma.activity.findMany({
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.user.findMany(),
      prisma.registration.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
          activity: { select: { id: true, name: true } }
        }
      }),
      prisma.attendance.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
          activity: { select: { id: true, name: true } }
        }
      })
    ]);

    return { activities, users, registrations, attendances };
  }

  // Export activities
  async exportActivities(options = {}) {
    const where = {};
    
    if (options.startDate) {
      where.start_time = { gte: new Date(options.startDate) };
    }
    if (options.endDate) {
      where.end_time = { lte: new Date(options.endDate) };
    }

    return await prisma.activity.findMany({
      where,
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: {
            registrations: true,
            attendances: true
          }
        }
      }
    });
  }

  // Export users
  async exportUsers(options = {}) {
    const where = { status: 1 };
    
    if (options.role) {
      where.role = options.role;
    }

    return await prisma.user.findMany({
      where,
      include: {
        _count: {
          select: {
            registrations: true,
            attendances: true
          }
        }
      }
    });
  }

  // Export attendances
  async exportAttendances(options = {}) {
    const where = {};
    
    if (options.startDate) {
      where.created_at = { gte: new Date(options.startDate) };
    }
    if (options.endDate) {
      where.created_at = { lte: new Date(options.endDate) };
    }

    return await prisma.attendance.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        activity: { select: { id: true, name: true } }
      }
    });
  }

  // Clear all data (use with caution!)
  async clearAllData() {
    await prisma.attendance.deleteMany();
    await prisma.registration.deleteMany();
    await prisma.activity.deleteMany();
    await prisma.user.deleteMany();
  }
}

module.exports = new BackupService();

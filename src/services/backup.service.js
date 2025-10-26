const fs = require("fs").promises;
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

class BackupService {
  constructor() {
    this.backupDir = path.join(__dirname, "../../backups");
    // Không await trong constructor; sẽ đảm bảo ở createBackup
    this.ensureBackupDir();
  }

  async ensureBackupDir() {
    try {
      await fs.access(this.backupDir);
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true });
    }
  }

  // ===== Dashboard stats =====
  async getDashboardStats() {
    try {
      const [
        totalActivities,
        activeActivities,
        upcomingActivities,
        completedActivities,
        totalUsers,
        totalRegistrations,
        totalAttendances,
      ] = await Promise.all([
        prisma.activity.count(),
        prisma.activity.count({ where: { status: 1 } }),
        prisma.activity.count({ where: { status: 0 } }),
        prisma.activity.count({ where: { status: 2 } }),
        prisma.user.count({ where: { status: 1 } }),
        prisma.registration.count(),
        prisma.attendance.count(),
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
          totalAttendances,
        },
      };
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      return {
        error: { code: 500, message: "Không thể lấy thống kê: " + error.message },
      };
    }
  }

  // ===== Create full backup =====
  async createBackup(userId) {
    try {
      await this.ensureBackupDir();

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
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
        data: backupData,
      };

      const filePath = path.join(this.backupDir, backupFile.fileName);
      await fs.writeFile(filePath, JSON.stringify(backupFile, null, 2));

      const stats = await fs.stat(filePath);
      const fileSize = `${(stats.size / 1024 / 1024).toFixed(2)} MB`;

      const backupRecord = await prisma.backup.create({
        data: {
          name: `Backup ${new Date().toLocaleDateString("vi-VN")}`,
          path: filePath,
          createdBy: userId,
          fileSize,
        },
      });

      return {
        success: true,
        message: "Tạo bản sao lưu thành công",
        data: {
          id: backupRecord.id,
          fileName: backupFile.fileName,
          filePath,
          metadata: backupFile.metadata,
          createdAt: backupFile.createdAt,
          fileSize,
        },
      };
    } catch (error) {
      console.error("Create backup error:", error);
      return {
        error: { code: 500, message: "Không thể tạo bản sao lưu: " + error.message },
      };
    }
  }

  // ===== Restore from backup ID (đọc path trong DB) =====
  async restoreBackupFromId(backupId) {
    try {
      const backupRecord = await prisma.backup.findUnique({
        where: { id: parseInt(backupId, 10) },
      });

      if (!backupRecord) {
        return { error: { code: 404, message: "Không tìm thấy bản sao lưu" } };
      }

      const content = await fs.readFile(backupRecord.path, "utf8");
      const backupData = JSON.parse(content);

      if (!backupData || !backupData.data) {
        return { error: { code: 400, message: "Dữ liệu sao lưu không hợp lệ" } };
      }

      // Khôi phục dữ liệu (KHÔNG xóa bảng backup để giữ lại lịch sử)
      return await this.restoreBackupData(backupData.data);
    } catch (error) {
      console.error("Restore backup from ID error:", error);
        return {
        error: { code: 500, message: "Không thể khôi phục dữ liệu: " + error.message },
      };
    }
  }

  // Khôi phục dữ liệu từ backup object (KHÔNG xóa bảng backup)
  async restoreBackupData(data) {
    try {
      const { activities = [], users = [], registrations = [], attendances = [] } = data;

      // Xóa dữ liệu cũ (NHƯNG KHÔNG XÓA BẢNG BACKUP)
      await prisma.$transaction([
        prisma.attendance.deleteMany(),
        prisma.registration.deleteMany(),
        prisma.activity.deleteMany(),
        prisma.user.deleteMany(),
      ]);

      // Import dữ liệu mới trong transaction
      await prisma.$transaction(async (tx) => {
        if (users.length > 0) {
          await tx.user.createMany({
            data: users.map((u) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              password: u.password,
              role: u.role,
              mssv: u.mssv,
              class: u.class,
              phone: u.phone,
              status: u.status,
              createdAt: new Date(u.createdAt || u.created_at),
            })),
            skipDuplicates: true,
          });
        }

        if (activities.length > 0) {
          await tx.activity.createMany({
            data: activities.map((a) => ({
              id: a.id,
              name: a.name,
              description: a.description,
              location: a.location,
              startTime: new Date(a.startTime || a.start_time),
              endTime: new Date(a.endTime || a.end_time),
              maxParticipants: a.maxParticipants || a.max_participants,
              trainingPoints: a.trainingPoints || a.training_points,
              status: a.status,
              createdBy: a.createdBy || a.creator_id,
              createdAt: new Date(a.createdAt || a.created_at),
            })),
            skipDuplicates: true,
          });
        }

        if (registrations.length > 0) {
          await tx.registration.createMany({
            data: registrations.map((r) => ({
              id: r.id,
              iduser: r.iduser || r.user_id,
              idactivity: r.idactivity || r.activity_id,
              status: r.status,
              createdAt: new Date(r.createdAt || r.created_at),
            })),
            skipDuplicates: true,
          });
        }

        if (attendances.length > 0) {
          await tx.attendance.createMany({
            data: attendances.map((a) => ({
              id: a.id,
              iduser: a.iduser || a.user_id,
              idactivity: a.idactivity || a.activity_id,
              checkinTime: a.checkinTime || a.check_in_time ? new Date(a.checkinTime || a.check_in_time) : null,
              method: a.method,
            })),
            skipDuplicates: true,
          });
        }
      });

      return {
        success: true,
        message: "Khôi phục dữ liệu thành công",
        data: {
          restored: {
            users: users.length,
            activities: activities.length,
            registrations: registrations.length,
            attendances: attendances.length,
          },
        },
      };
    } catch (error) {
      console.error("Restore data error:", error);
      return {
        error: { code: 500, message: "Không thể khôi phục dữ liệu: " + error.message },
      };
    }
  }

  // ===== Restore from backup object =====
  async restoreBackup(backupData) {
    try {
      if (!backupData || !backupData.data) {
        return { error: { code: 400, message: "Dữ liệu sao lưu không hợp lệ" } };
      }

      const { activities = [], users = [], registrations = [], attendances = [] } =
        backupData.data;

      // Xóa dữ liệu cũ trước khi import
      await this.clearAllData();

      // Thực hiện theo transaction để đảm bảo tính toàn vẹn
      await prisma.$transaction(async (tx) => {
        // Users trước (FK)
        if (users.length > 0) {
          await tx.user.createMany({
            data: users.map((u) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              password: u.password,
              role: u.role,
              mssv: u.mssv,
              class: u.class,
              phone: u.phone,
              status: u.status,
              createdAt: new Date(u.createdAt || u.created_at),
            })),
            skipDuplicates: true,
          });
        }

        // Activities
        if (activities.length > 0) {
          await tx.activity.createMany({
            data: activities.map((a) => ({
              id: a.id,
              name: a.name,
              description: a.description,
              location: a.location,
              startTime: new Date(a.startTime || a.start_time),
              endTime: new Date(a.endTime || a.end_time),
              maxParticipants: a.maxParticipants ?? a.max_participants,
              trainingPoints: a.trainingPoints ?? a.training_points,
              status: a.status,
              createdBy: a.createdBy ?? a.creator_id,
              createdAt: new Date(a.createdAt || a.created_at),
            })),
            skipDuplicates: true,
          });
        }

        // Registrations
        if (registrations.length > 0) {
          await tx.registration.createMany({
            data: registrations.map((r) => ({
              id: r.id,
              iduser: r.iduser ?? r.user_id,
              idactivity: r.idactivity ?? r.activity_id,
              status: r.status,
              createdAt: new Date(r.createdAt || r.created_at),
            })),
            skipDuplicates: true,
          });
        }

        // Attendances (sửa toán tử ưu tiên cho checkinTime)
        if (attendances.length > 0) {
          await tx.attendance.createMany({
            data: attendances.map((at) => ({
              id: at.id,
              iduser: at.iduser ?? at.user_id,
              idactivity: at.idactivity ?? at.activity_id,
              checkinTime:
                (at.checkinTime || at.check_in_time)
                  ? new Date(at.checkinTime || at.check_in_time)
                  : null,
              method: at.method,
            })),
            skipDuplicates: true,
          });
        }
      });

      return {
        success: true,
        message: "Khôi phục dữ liệu thành công",
        data: {
          restored: {
            users: users.length,
            activities: activities.length,
            registrations: registrations.length,
            attendances: attendances.length,
          },
        },
      };
    } catch (error) {
      console.error("Restore backup error:", error);
      return {
        error: { code: 500, message: "Không thể khôi phục dữ liệu: " + error.message },
      };
    }
  }

  // ===== List backups =====
  async listBackups() {
    try {
      const backups = await prisma.backup.findMany({
        include: {
          creator: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return {
        success: true,
        data: backups.map((b) => ({
          id: b.id,
          name: b.name,
          path: b.path,
          fileSize: b.fileSize,
          createdAt: b.createdAt,
          createdBy: b.creator?.name || b.creator?.email || null,
        })),
      };
    } catch (error) {
      console.error("List backups error:", error);
      return {
        error: { code: 500, message: "Không thể lấy danh sách sao lưu: " + error.message },
      };
    }
  }

  // ===== Delete backup =====
  async deleteBackup(backupId) {
    try {
      const id = parseInt(backupId, 10);
      const backupRecord = await prisma.backup.findUnique({ where: { id } });

      if (!backupRecord) {
        return { error: { code: 404, message: "Không tìm thấy bản sao lưu" } };
      }

      try {
        await fs.unlink(backupRecord.path);
      } catch {
        console.warn("File không tồn tại hoặc đã bị xóa:", backupRecord.path);
      }

      await prisma.backup.delete({ where: { id } });

      return { success: true, message: "Xóa bản sao lưu thành công" };
    } catch (error) {
      console.error("Delete backup error:", error);
      return {
        error: { code: 500, message: "Không thể xóa bản sao lưu: " + error.message },
      };
    }
  }

  // ===== Export all data =====
  async exportAllData() {
    const [activities, users, registrations, attendances] = await Promise.all([
      prisma.activity.findMany({
        include: { creator: { select: { id: true, name: true, email: true } } },
      }),
      prisma.user.findMany(),
      prisma.registration.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
          activity: { select: { id: true, name: true } },
        },
      }),
      prisma.attendance.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
          activity: { select: { id: true, name: true } },
        },
      }),
    ]);

    return { activities, users, registrations, attendances };
  }

  // ===== Danger: clear all =====
  async clearAllData() {
    await prisma.$transaction([
      prisma.backup.deleteMany(), // Xóa backup trước vì có foreign key reference đến user
      prisma.attendance.deleteMany(),
      prisma.registration.deleteMany(),
      prisma.activity.deleteMany(),
      prisma.user.deleteMany(),
    ]);
  }
}

module.exports = new BackupService();

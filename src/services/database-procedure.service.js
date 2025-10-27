const prisma = require('../lib/prisma');

class DatabaseProcedureService {
  // Sử dụng procedure để cập nhật status hoạt động
  async updateActivityStatus() {
    try {
      const result = await prisma.$queryRaw`SELECT update_activity_status() as updated_count`;
      return { success: true, updatedCount: result[0].updated_count };
    } catch (error) {
      console.error('Error calling update_activity_status procedure:', error);
      return { success: false, error: error.message };
    }
  }

  // Sử dụng procedure để tính toán thống kê hoạt động
  async getActivityStats(activityId) {
    try {
      const result = await prisma.$queryRaw`
        SELECT * FROM calculate_activity_stats(${activityId})
      `;
      return { success: true, stats: result[0] };
    } catch (error) {
      console.error('Error calling calculate_activity_stats procedure:', error);
      return { success: false, error: error.message };
    }
  }

  // Sử dụng procedure để tạo báo cáo định kỳ
  async generateDailyReport(reportDate = null) {
    try {
      const date = reportDate || new Date();
      const result = await prisma.$queryRaw`
        SELECT generate_daily_report(${date}::DATE) as report_id
      `;
      return { success: true, reportId: result[0].report_id };
    } catch (error) {
      console.error('Error calling generate_daily_report procedure:', error);
      return { success: false, error: error.message };
    }
  }

  // Kiểm tra xem procedures có tồn tại không
  async checkProceduresExist() {
    try {
      const procedures = await prisma.$queryRaw`
        SELECT proname 
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND proname IN ('update_activity_status', 'calculate_activity_stats', 'generate_daily_report')
      `;
      return { success: true, procedures: procedures.map(p => p.proname) };
    } catch (error) {
      console.error('Error checking procedures:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new DatabaseProcedureService();

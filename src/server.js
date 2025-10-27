require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Set JWT_SECRET if not provided
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'your-secret-key-here';
}

const app = express();
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Middleware để ghi log URL mỗi khi được gọi
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

app.get('/', (_, res) => res.json({ ok: true, message: 'Server is running' }));

// Manual trigger for testing
app.post('/test-update-status', async (req, res) => {
  try {
    const activitiesService = require('./services/activities.service');
    const result = await activitiesService.updateActivityStatusByTime();
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Debug endpoint to check activities status
app.get('/debug-activities', async (req, res) => {
  try {
    const prisma = require('./lib/prisma');
    const now = new Date();
    
    const activities = await prisma.activity.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        startTime: true,
        endTime: true
      },
      orderBy: { startTime: 'asc' }
    });
    
    const result = activities.map(activity => ({
      id: activity.id,
      name: activity.name,
      status: activity.status,
      startTime: activity.startTime,
      endTime: activity.endTime,
      shouldBeStatus: getCorrectStatus(activity.startTime, activity.endTime, now)
    }));
    
    res.json({ 
      success: true, 
      currentTime: now,
      activities: result 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper function to determine correct status
function getCorrectStatus(startTime, endTime, now) {
  if (now < startTime) return 1; // Sắp diễn ra
  if (now >= startTime && now < endTime) return 2; // Đang diễn ra
  if (now >= endTime) return 3; // Đã hoàn thành
  return 0; // Nháp
}
app.use('/auth', require('./routes/auth.routes'));
app.use('/activities', require('./routes/activities.routes'));
app.use('/registrations', require('./routes/registrations.routes'));
app.use('/attendances', require('./routes/attendances.routes'));
app.use('/users', require('./routes/users.routes'));
app.use('/reports', require('./routes/reports.routes'));
app.use('/backup', require('./routes/backup.routes'));

// Auto-update activity status every 1 second using database procedure
let lastUpdateResult = null;
setInterval(async () => {
  try {
    const prisma = require('./lib/prisma');
    const result = await prisma.$queryRaw`SELECT update_activity_status() as updated_count`;
    const updatedCount = result[0].updated_count;
    
    // Chỉ ghi log khi có thay đổi
    if (updatedCount > 0) {
      console.log(`[${new Date().toISOString()}] Auto-updated ${updatedCount} activities`);
    }
  } catch (error) {
    console.error('Auto-update activity status error:', error);
  }
}, 1000); // 1 second

// Auto-generate daily report once per day at 23:59
let lastGeneratedReportDate = null;
setInterval(async () => {
  try {
    const reportsService = require('./services/reports.service');
    const now = new Date();
    
    // Chỉ generate 1 lần mỗi ngày
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (lastGeneratedReportDate && lastGeneratedReportDate.getTime() === today.getTime()) {
      return; // Đã generate rồi
    }

    // Generate report cho hôm nay
    await reportsService.generateDailyReport();
    lastGeneratedReportDate = today;
    console.log(`[${now.toISOString()}] Daily report generated for ${today.toISOString().split('T')[0]}`);
  } catch (error) {
    console.error('Auto-generate daily report error:', error);
  }
}, 60000); // Check every minute

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => console.log(`API on http://localhost:${PORT}`));

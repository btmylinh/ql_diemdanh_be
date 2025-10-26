require('dotenv').config();
const express = require('express');
const cors = require('cors');

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
app.use('/auth', require('./routes/auth.routes'));
app.use('/activities', require('./routes/activities.routes'));
app.use('/registrations', require('./routes/registrations.routes'));
app.use('/attendances', require('./routes/attendances.routes'));
app.use('/users', require('./routes/users.routes'));
app.use('/reports', require('./routes/reports.routes'));
app.use('/backup', require('./routes/backup.routes'));

// Auto-update activity status every 1 second
let lastUpdateResult = null;
setInterval(async () => {
  try {
    const activitiesService = require('./services/activities.service');
    const result = await activitiesService.updateActivityStatusByTime();
    
    // Chỉ ghi log khi có thay đổi hoặc có lỗi
    const hasChanged = JSON.stringify(result) !== JSON.stringify(lastUpdateResult);
    
    if (result.error) {
      console.error('Auto-update activity status error:', result.error.message);
    } else if (hasChanged) {
      console.log(`[${new Date().toISOString()}] Auto-updated activity status:`, result);
      lastUpdateResult = result;
    }
  } catch (error) {
    console.error('Auto-update activity status error:', error);
  }
}, 1000); // 1 second

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => console.log(`API on http://localhost:${PORT}`));

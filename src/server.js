require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*', credentials: true })); // có thể siết chặt sau
app.use(express.json());

app.get('/', (_, res) => res.json({ ok: true }));

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

// Auto-update activity status every 5 minutes
setInterval(async () => {
  try {
    const activitiesService = require('./services/activities.service');
    const result = await activitiesService.updateActivityStatusByTime();
    if (result.error) {
      console.error('Auto-update activity status error:', result.error.message);
    } else {
      console.log('Auto-updated activity status:', result);
    }
  } catch (error) {
    console.error('Auto-update activity status error:', error);
  }
}, 5 * 60 * 1000); // 5 minutes

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));

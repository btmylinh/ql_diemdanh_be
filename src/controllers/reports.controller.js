const svc = require('../services/reports.service');

module.exports = {
  async overview(req, res) {
    try {
      const start = svc.coerceDate(req.query.start);
      const end = svc.coerceDate(req.query.end);
      const data = await svc.getOverview({ start, end });
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async activitiesStatus(req, res) {
    try {
      const data = await svc.activitiesByStatus();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async registrationsTrend(req, res) {
    try {
      const start = svc.coerceDate(req.query.start);
      const end = svc.coerceDate(req.query.end);
      const interval = req.query.interval || 'day';
      const data = await svc.registrationsTrend({ start, end, interval });
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async topActivities(req, res) {
    try {
      const limit = Number(req.query.limit || 10);
      const data = await svc.topActivities({ limit });
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};



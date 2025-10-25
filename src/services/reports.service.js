const prisma = require('../lib/prisma');

function coerceDate(value, fallback) {
  const d = value ? new Date(value) : null;
  return Number.isFinite(d?.getTime?.()) ? d : fallback;
}

async function getOverview({ start, end }) {
  const whereActivity = {};
  if (start || end) {
    whereActivity.createdAt = {};
    if (start) whereActivity.createdAt.gte = start;
    if (end) whereActivity.createdAt.lte = end;
  }

  const [
    totalUsers,
    adminUsers,
    managerUsers,
    studentUsers,
    totalActivities,
    activeActivities,
    completedActivities,
    upcomingActivities,
    totalRegistrations,
    totalAttendances,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'admin' } }),
    prisma.user.count({ where: { role: 'manager' } }),
    prisma.user.count({ where: { role: 'student' } }),
    prisma.activity.count({ where: whereActivity }),
    prisma.activity.count({ where: { status: 1 } }),
    prisma.activity.count({ where: { status: 0 } }),
    prisma.activity.count({ where: { startTime: { gt: new Date() } } }),
    prisma.registration.count(),
    prisma.attendance.count(),
  ]);

  return {
    users: { total: totalUsers, admin: adminUsers, manager: managerUsers, student: studentUsers },
    activities: { total: totalActivities, active: activeActivities, completed: completedActivities, upcoming: upcomingActivities },
    registrations: { total: totalRegistrations },
    attendances: { total: totalAttendances },
  };
}

async function activitiesByStatus() {
  const groups = await prisma.activity.groupBy({ by: ['status'], _count: { _all: true } });
  return groups.map(g => ({ status: g.status, count: g._count._all }));
}

async function registrationsTrend({ start, end, interval = 'day' }) {
  // For simplicity, return counts grouped by day using JS after fetch
  const where = {};
  if (start || end) {
    where.createdAt = {};
    if (start) where.createdAt.gte = start;
    if (end) where.createdAt.lte = end;
  }
  const rows = await prisma.registration.findMany({ where, select: { createdAt: true } });
  const buckets = {};
  for (const r of rows) {
    const d = new Date(r.createdAt);
    const key = d.toISOString().slice(0, 10);
    buckets[key] = (buckets[key] || 0) + 1;
  }
  return Object.entries(buckets)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, count]) => ({ date, count }));
}

async function topActivities({ limit = 10 }) {
  // Count registrations per activity
  const regs = await prisma.registration.groupBy({ by: ['idactivity'], _count: { _all: true }, orderBy: { _count: { _all: 'desc' } }, take: Number(limit) });
  const ids = regs.map(r => r.idactivity);
  const activities = await prisma.activity.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
  const map = Object.fromEntries(activities.map(a => [a.id, a.name]));
  return regs.map(r => ({ id: r.idactivity, name: map[r.idactivity] || `#${r.idactivity}`, registrations: r._count._all }));
}

module.exports = {
  coerceDate,
  getOverview,
  activitiesByStatus,
  registrationsTrend,
  topActivities,
};



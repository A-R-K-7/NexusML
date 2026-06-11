const AuditLog = require('../models/AuditLog');

// @desc    Get audit log events
// @route   GET /api/audit
const getAuditLogs = async (req, res) => {
  const { projectId, userId, action, entityType, from, to, page = 1, limit = 50 } = req.query;

  const filter = {};
  if (projectId) filter.projectId = projectId;
  if (userId) filter.userId = userId;
  if (action) filter.action = action;
  if (entityType) filter.entityType = entityType;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const total = await AuditLog.countDocuments(filter);
  const logs = await AuditLog.find(filter)
    .populate('userId', 'name email')
    .populate('projectId', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({ success: true, data: logs, total, page: Number(page) });
};

module.exports = { getAuditLogs };

const Project = require('../models/Project');
const Dataset = require('../models/Dataset');
const Run = require('../models/Run');
const MLModel = require('../models/Model');
const Deployment = require('../models/Deployment');
const AuditLog = require('../models/AuditLog');
const MonitoringMetric = require('../models/MonitoringMetric');

// @desc    Get dashboard summary stats
// @route   GET /api/dashboard/summary
const getSummary = async (req, res) => {
  const userId = req.user._id;

  // Get user's projects
  const projectFilter = { $or: [{ owner: userId }, { 'members.user': userId }] };
  const projectIds = await Project.find(projectFilter).distinct('_id');

  const [projects, datasets, runs, models, deployments] = await Promise.all([
    Project.countDocuments(projectFilter),
    Dataset.countDocuments({ projectId: { $in: projectIds } }),
    Run.countDocuments({ projectId: { $in: projectIds } }),
    MLModel.countDocuments({ projectId: { $in: projectIds } }),
    Deployment.countDocuments({ projectId: { $in: projectIds } }),
  ]);

  const runningDeployments = await Deployment.countDocuments({
    projectId: { $in: projectIds },
    status: 'Running',
  });

  const completedRuns = await Run.countDocuments({
    projectId: { $in: projectIds },
    status: 'completed',
  });

  res.json({
    success: true,
    data: {
      projects,
      datasets,
      runs,
      completedRuns,
      models,
      deployments,
      runningDeployments,
    },
  });
};

// @desc    Get recent activity
// @route   GET /api/dashboard/activity
const getRecentActivity = async (req, res) => {
  const logs = await AuditLog.find()
    .populate('userId', 'name email')
    .populate('projectId', 'name')
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({ success: true, data: logs });
};

// @desc    Get monitoring summary across all deployments
// @route   GET /api/dashboard/monitoring
const getMonitoringSnapshot = async (req, res) => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24h

  const stats = await MonitoringMetric.aggregate([
    { $match: { timestamp: { $gte: since } } },
    {
      $group: {
        _id: null,
        totalRequests: { $sum: '$requestCount' },
        totalErrors: { $sum: '$errorCount' },
        avgLatency: { $avg: '$latency' },
      },
    },
  ]);

  res.json({ success: true, data: stats[0] || { totalRequests: 0, totalErrors: 0, avgLatency: 0 } });
};

// @desc    Get governance summary
// @route   GET /api/dashboard/governance
const getGovernanceSummary = async (req, res) => {
  const RiskProfile = require('../models/RiskProfile');
  const ChecklistItem = require('../models/ChecklistItem');

  const riskCounts = await RiskProfile.aggregate([
    { $group: { _id: '$riskLevel', count: { $sum: 1 } } },
  ]);

  const checklistTotal = await ChecklistItem.countDocuments();
  const checklistCompleted = await ChecklistItem.countDocuments({ completed: true });
  const progress = checklistTotal > 0 ? Math.round((checklistCompleted / checklistTotal) * 100) : 0;

  res.json({
    success: true,
    data: {
      riskDistribution: riskCounts,
      checklistProgress: progress,
      checklistTotal,
      checklistCompleted,
    },
  });
};

module.exports = { getSummary, getRecentActivity, getMonitoringSnapshot, getGovernanceSummary };

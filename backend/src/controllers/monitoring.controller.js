const MonitoringMetric = require('../models/MonitoringMetric');
const Deployment = require('../models/Deployment');

// @desc    Get monitoring summary for a deployment
// @route   GET /api/monitoring/:deploymentId
const getMonitoringSummary = async (req, res) => {
  const { deploymentId } = req.params;
  const { period = '7d' } = req.query;

  const periodMs = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  };

  const since = new Date(Date.now() - (periodMs[period] || periodMs['7d']));

  const metrics = await MonitoringMetric.aggregate([
    { $match: { deploymentId: require('mongoose').Types.ObjectId.createFromHexString(deploymentId), timestamp: { $gte: since } } },
    {
      $group: {
        _id: null,
        totalRequests: { $sum: '$requestCount' },
        totalSuccess: { $sum: '$successCount' },
        totalErrors: { $sum: '$errorCount' },
        avgLatency: { $avg: '$latency' },
        maxLatency: { $max: '$latency' },
      },
    },
  ]);

  const summary = metrics[0] || {
    totalRequests: 0, totalSuccess: 0, totalErrors: 0, avgLatency: 0, maxLatency: 0,
  };

  summary.errorRate = summary.totalRequests > 0
    ? ((summary.totalErrors / summary.totalRequests) * 100).toFixed(2)
    : 0;

  res.json({ success: true, data: summary });
};

// @desc    Get time-series metrics for charts
// @route   GET /api/monitoring/:deploymentId/timeseries
const getTimeSeries = async (req, res) => {
  const { deploymentId } = req.params;
  const { period = '7d', granularity = 'hour' } = req.query;

  const periodMs = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  };

  const since = new Date(Date.now() - (periodMs[period] || periodMs['7d']));

  const dateFormat = granularity === 'day'
    ? { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
    : { $dateToString: { format: '%Y-%m-%dT%H:00', date: '$timestamp' } };

  const series = await MonitoringMetric.aggregate([
    { $match: { deploymentId: require('mongoose').Types.ObjectId.createFromHexString(deploymentId), timestamp: { $gte: since } } },
    {
      $group: {
        _id: dateFormat,
        requests: { $sum: '$requestCount' },
        errors: { $sum: '$errorCount' },
        avgLatency: { $avg: '$latency' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({ success: true, data: series });
};

// @desc    Get monitoring overview across all deployments
// @route   GET /api/monitoring/overview
const getOverview = async (req, res) => {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const stats = await MonitoringMetric.aggregate([
    { $match: { timestamp: { $gte: since } } },
    {
      $group: {
        _id: '$deploymentId',
        totalRequests: { $sum: '$requestCount' },
        totalErrors: { $sum: '$errorCount' },
        avgLatency: { $avg: '$latency' },
      },
    },
    {
      $lookup: {
        from: 'deployments',
        localField: '_id',
        foreignField: '_id',
        as: 'deployment',
      },
    },
    { $unwind: { path: '$deployment', preserveNullAndEmpty: true } },
    { $limit: 10 },
  ]);

  res.json({ success: true, data: stats });
};

// @desc    Log a monitoring event manually (for testing/seeding)
// @route   POST /api/monitoring/log
const logMetric = async (req, res) => {
  const { deploymentId, requestCount, successCount, errorCount, latency } = req.body;
  const metric = await MonitoringMetric.create({
    deploymentId, requestCount, successCount, errorCount, latency,
  });
  res.status(201).json({ success: true, data: metric });
};

module.exports = { getMonitoringSummary, getTimeSeries, getOverview, logMetric };

const mongoose = require('mongoose');

const monitoringMetricSchema = new mongoose.Schema(
  {
    deploymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deployment', required: true },
    requestCount: { type: Number, default: 1 },
    successCount: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 },
    latency: { type: Number, default: 0 }, // ms
    p95Latency: { type: Number, default: 0 }, // ms
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Index for time-based queries
monitoringMetricSchema.index({ deploymentId: 1, timestamp: -1 });

module.exports = mongoose.model('MonitoringMetric', monitoringMetricSchema);

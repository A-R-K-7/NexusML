const mongoose = require('mongoose');

const riskProfileSchema = new mongoose.Schema(
  {
    modelId: { type: mongoose.Schema.Types.ObjectId, ref: 'MLModel', required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    domain: {
      type: String,
      enum: ['healthcare', 'finance', 'hr', 'legal', 'marketing', 'operations', 'education', 'other'],
      required: true,
    },
    impact: {
      type: String,
      enum: ['individual', 'small_group', 'large_group', 'societal'],
      required: true,
    },
    geography: {
      type: String,
      enum: ['eu', 'us', 'global', 'other'],
      required: true,
    },
    dataTypes: [{ type: String }], // demographic, biometric, financial, health, etc.
    riskLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Low',
    },
    answers: { type: mongoose.Schema.Types.Mixed, default: {} },
    assessedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RiskProfile', riskProfileSchema);

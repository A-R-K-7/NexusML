const mongoose = require('mongoose');

const modelSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    runId: { type: mongoose.Schema.Types.ObjectId, ref: 'Run', required: true },
    datasetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dataset', required: true },
    name: {
      type: String,
      required: [true, 'Model name is required'],
      trim: true,
    },
    version: { type: String, default: 'v1.0' },
    description: { type: String, default: '' },
    artifactPath: { type: String, required: true },
    framework: { type: String, default: 'AutoGluon' },
    taskType: {
      type: String,
      enum: ['classification', 'regression'],
      default: 'classification',
    },
    targetColumn: { type: String },
    metrics: {
      accuracy: { type: Number, default: null },
      precision: { type: Number, default: null },
      recall: { type: Number, default: null },
      f1: { type: Number, default: null },
      rmse: { type: Number, default: null },
      mae: { type: Number, default: null },
      r2: { type: Number, default: null },
      trainingTime: { type: Number, default: null },
    },
    status: {
      type: String,
      enum: ['draft', 'staging', 'production', 'archived'],
      default: 'draft',
    },
    tags: [{ type: String }],
    registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MLModel', modelSchema);

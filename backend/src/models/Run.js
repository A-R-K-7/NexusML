const mongoose = require('mongoose');

const runSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    datasetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dataset', required: true },
    name: { type: String, default: '' },
    parameters: {
      modelType: { type: String, default: 'auto' },
      preset: { type: String, enum: ['fast', 'balanced', 'best'], default: 'balanced' },
      targetColumn: { type: String, required: true },
      taskType: { type: String, enum: ['classification', 'regression'], default: 'classification' },
      timeLimit: { type: Number, default: 60 }, // seconds
    },
    metrics: {
      accuracy: { type: Number, default: null },
      precision: { type: Number, default: null },
      recall: { type: Number, default: null },
      f1: { type: Number, default: null },
      rmse: { type: Number, default: null },
      mae: { type: Number, default: null },
      r2: { type: Number, default: null },
      trainingTime: { type: Number, default: null }, // seconds
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed'],
      default: 'pending',
    },
    jobId: { type: String, default: null }, // ML service job ID
    errorMessage: { type: String, default: null },
    artifactPath: { type: String, default: null },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Run', runSchema);

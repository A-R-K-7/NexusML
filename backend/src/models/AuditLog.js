const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: {
      type: String,
      required: true,
      enum: [
        'PROJECT_CREATED', 'PROJECT_UPDATED', 'PROJECT_DELETED',
        'DATASET_UPLOADED', 'DATASET_DELETED',
        'TRAINING_STARTED', 'TRAINING_COMPLETED', 'TRAINING_FAILED',
        'MODEL_REGISTERED', 'MODEL_UPDATED', 'MODEL_DEPLOYED', 'MODEL_STOPPED',
        'RISK_UPDATED', 'CHECKLIST_UPDATED',
        'USER_LOGIN', 'USER_REGISTERED',
        'OTHER',
      ],
    },
    entityType: {
      type: String,
      enum: ['Project', 'Dataset', 'Run', 'Model', 'Deployment', 'User', 'RiskProfile', 'Checklist', 'Other'],
      default: 'Other',
    },
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: null },
  },
  {
    timestamps: true,
    // Prevent updates — audit logs are append-only
  }
);

// Disable updates at application level
auditLogSchema.pre('findOneAndUpdate', function () {
  throw new Error('Audit logs cannot be modified');
});
auditLogSchema.pre('updateOne', function () {
  throw new Error('Audit logs cannot be modified');
});

module.exports = mongoose.model('AuditLog', auditLogSchema);

const mongoose = require('mongoose');

const deploymentSchema = new mongoose.Schema(
  {
    modelId: { type: mongoose.Schema.Types.ObjectId, ref: 'MLModel', required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    name: { type: String, required: true, trim: true },
    endpointUrl: { type: String, default: null },
    status: {
      type: String,
      enum: ['Pending', 'Deploying', 'Running', 'Failed', 'Stopped'],
      default: 'Pending',
    },
    environment: {
      type: String,
      enum: ['staging', 'production'],
      default: 'staging',
    },
    port: { type: Number, default: null },
    containerId: { type: String, default: null },
    logs: { type: String, default: '' },
    deployedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    errorMessage: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Deployment', deploymentSchema);

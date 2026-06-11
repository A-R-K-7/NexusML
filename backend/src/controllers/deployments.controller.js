const Deployment = require('../models/Deployment');
const MLModel = require('../models/Model');
const AuditLog = require('../models/AuditLog');

/**
 * Simulate deployment: in production this would build+push a Docker image
 * and expose a real endpoint. For MVP, we simulate the workflow.
 */
const simulateDeployment = async (deploymentId, modelId, environment) => {
  await new Promise((r) => setTimeout(r, 2000)); // Simulate build time

  const port = 8100 + Math.floor(Math.random() * 900);
  const endpointUrl = `http://localhost:${port}/predict`;

  await Deployment.findByIdAndUpdate(deploymentId, {
    status: 'Running',
    endpointUrl,
    port,
    logs: `[${new Date().toISOString()}] Container started\n[${new Date().toISOString()}] Model loaded\n[${new Date().toISOString()}] Endpoint ready at ${endpointUrl}`,
  });

  await MLModel.findByIdAndUpdate(modelId, { status: environment });
};

// @desc    Deploy a model
// @route   POST /api/deployments
const deployModel = async (req, res) => {
  const { modelId, projectId, name, environment } = req.body;
  if (!modelId || !projectId) {
    return res.status(400).json({ error: 'modelId and projectId are required' });
  }

  const model = await MLModel.findById(modelId);
  if (!model) return res.status(404).json({ error: 'Model not found' });

  const deployment = await Deployment.create({
    modelId,
    projectId,
    name: name || `${model.name} Deployment`,
    environment: environment || 'staging',
    status: 'Deploying',
    deployedBy: req.user._id,
  });

  await AuditLog.create({
    projectId,
    userId: req.user._id,
    action: 'MODEL_DEPLOYED',
    entityType: 'Deployment',
    entityId: deployment._id,
  });

  // Async deployment simulation
  simulateDeployment(deployment._id, modelId, deployment.environment).catch(async (err) => {
    await Deployment.findByIdAndUpdate(deployment._id, {
      status: 'Failed',
      errorMessage: err.message,
    });
  });

  res.status(201).json({ success: true, data: deployment });
};

// @desc    Get all deployments
// @route   GET /api/deployments
const getDeployments = async (req, res) => {
  const { projectId, status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (projectId) filter.projectId = projectId;
  if (status) filter.status = status;

  const total = await Deployment.countDocuments(filter);
  const deployments = await Deployment.find(filter)
    .populate('modelId', 'name version metrics')
    .populate('deployedBy', 'name email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({ success: true, data: deployments, total });
};

// @desc    Get single deployment
// @route   GET /api/deployments/:id
const getDeployment = async (req, res) => {
  const deployment = await Deployment.findById(req.params.id)
    .populate({
      path: 'modelId',
      select: 'name version metrics artifactPath taskType targetColumn datasetId',
      populate: {
        path: 'datasetId',
        select: 'columnNames'
      }
    })
    .populate('deployedBy', 'name email')
    .populate('projectId', 'name');

  if (!deployment) return res.status(404).json({ error: 'Deployment not found' });
  res.json({ success: true, data: deployment });
};

// @desc    Stop a deployment
// @route   PUT /api/deployments/:id/stop
const stopDeployment = async (req, res) => {
  const deployment = await Deployment.findByIdAndUpdate(
    req.params.id,
    { status: 'Stopped', endpointUrl: null },
    { new: true }
  );
  if (!deployment) return res.status(404).json({ error: 'Deployment not found' });
  res.json({ success: true, data: deployment });
};

// @desc    Test prediction via deployed endpoint (proxy through ML service)
// @route   POST /api/deployments/:id/predict
const testPrediction = async (req, res) => {
  const axios = require('axios');
  const deployment = await Deployment.findById(req.params.id).populate('modelId');
  if (!deployment) return res.status(404).json({ error: 'Deployment not found' });
  if (deployment.status !== 'Running') {
    return res.status(400).json({ error: 'Deployment is not running' });
  }

  const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

  try {
    const { data } = await axios.post(`${ML_SERVICE_URL}/predict`, {
      artifact_path: deployment.modelId.artifactPath,
      features: req.body.features,
    }, { timeout: 10000 });

    // Log monitoring metric
    const MonitoringMetric = require('../models/MonitoringMetric');
    await MonitoringMetric.create({
      deploymentId: deployment._id,
      requestCount: 1,
      successCount: 1,
      errorCount: 0,
      latency: data.latency || 0,
    });

    res.json({ success: true, prediction: data.prediction });
  } catch (err) {
    const MonitoringMetric = require('../models/MonitoringMetric');
    await MonitoringMetric.create({
      deploymentId: deployment._id,
      requestCount: 1,
      successCount: 0,
      errorCount: 1,
      latency: 0,
    });
    res.status(500).json({ error: 'Prediction failed: ' + err.message });
  }
};

module.exports = { deployModel, getDeployments, getDeployment, stopDeployment, testPrediction };

const MLModel = require('../models/Model');
const Run = require('../models/Run');
const AuditLog = require('../models/AuditLog');

// @desc    Register model from a run
// @route   POST /api/models/register
const registerModel = async (req, res) => {
  const { projectId, runId, datasetId, name, description, version, tags } = req.body;

  if (!projectId || !runId || !datasetId || !name) {
    return res.status(400).json({ error: 'projectId, runId, datasetId, and name are required' });
  }

  const run = await Run.findById(runId);
  if (!run) return res.status(404).json({ error: 'Run not found' });
  if (run.status !== 'completed') {
    return res.status(400).json({ error: 'Can only register models from completed runs' });
  }

  const model = await MLModel.create({
    projectId,
    runId,
    datasetId: datasetId || run.datasetId,
    name,
    description,
    version: version || 'v1.0',
    tags,
    artifactPath: run.artifactPath,
    taskType: run.parameters?.taskType || 'classification',
    targetColumn: run.parameters?.targetColumn,
    metrics: run.metrics,
    registeredBy: req.user._id,
  });

  await AuditLog.create({
    projectId,
    userId: req.user._id,
    action: 'MODEL_REGISTERED',
    entityType: 'Model',
    entityId: model._id,
    details: { name, version: model.version },
  });

  res.status(201).json({ success: true, data: model });
};

// @desc    Get all models
// @route   GET /api/models
const getModels = async (req, res) => {
  const { projectId, status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (projectId) filter.projectId = projectId;
  if (status) filter.status = status;

  const total = await MLModel.countDocuments(filter);
  const models = await MLModel.find(filter)
    .populate('registeredBy', 'name email')
    .populate('datasetId', 'name rows columns')
    .populate('runId', 'name status parameters metrics')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({ success: true, data: models, total });
};

// @desc    Get single model
// @route   GET /api/models/:id
const getModel = async (req, res) => {
  const model = await MLModel.findById(req.params.id)
    .populate('registeredBy', 'name email')
    .populate('datasetId', 'name rows columns columnNames')
    .populate('runId', 'name status parameters metrics startedAt finishedAt')
    .populate('projectId', 'name');

  if (!model) return res.status(404).json({ error: 'Model not found' });
  res.json({ success: true, data: model });
};

// @desc    Update model status/metadata
// @route   PUT /api/models/:id
const updateModel = async (req, res) => {
  const { status, description, tags } = req.body;
  const model = await MLModel.findByIdAndUpdate(
    req.params.id,
    { status, description, tags },
    { new: true, runValidators: true }
  );
  if (!model) return res.status(404).json({ error: 'Model not found' });
  res.json({ success: true, data: model });
};

// @desc    Get model lineage
// @route   GET /api/models/:id/lineage
const getModelLineage = async (req, res) => {
  const model = await MLModel.findById(req.params.id)
    .populate('datasetId', 'name rows columns uploadedBy createdAt')
    .populate('runId', 'name status parameters metrics startedAt finishedAt createdBy')
    .populate('projectId', 'name');

  if (!model) return res.status(404).json({ error: 'Model not found' });

  const Deployment = require('../models/Deployment');
  const deployments = await Deployment.find({ modelId: model._id }).sort({ createdAt: -1 }).limit(20);

  res.json({
    success: true,
    data: {
      project: model.projectId,
      dataset: model.datasetId,
      run: model.runId,
      model: {
        _id: model._id,
        name: model.name,
        version: model.version,
        metrics: model.metrics,
        status: model.status,
        createdAt: model.createdAt,
      },
      deployments,
    },
  });
};

module.exports = { registerModel, getModels, getModel, updateModel, getModelLineage };

const RiskProfile = require('../models/RiskProfile');
const ChecklistItem = require('../models/ChecklistItem');
const AuditLog = require('../models/AuditLog');

/**
 * Risk level calculation logic based on domain, impact, geography, and data types
 */
const calculateRiskLevel = ({ domain, impact, geography, dataTypes = [] }) => {
  let score = 0;

  // Domain scoring
  const highRiskDomains = ['healthcare', 'finance', 'hr', 'legal'];
  if (highRiskDomains.includes(domain)) score += 3;
  else score += 1;

  // Impact scoring
  const impactScores = { individual: 1, small_group: 2, large_group: 3, societal: 4 };
  score += impactScores[impact] || 1;

  // Geography (EU AI Act)
  if (geography === 'eu') score += 2;
  else if (geography === 'global') score += 1;

  // Sensitive data types
  const sensitiveTypes = ['biometric', 'health', 'demographic', 'financial'];
  const sensitiveCount = dataTypes.filter((d) => sensitiveTypes.includes(d)).length;
  score += sensitiveCount * 1.5;

  if (score >= 8) return 'Critical';
  if (score >= 5) return 'High';
  if (score >= 3) return 'Medium';
  return 'Low';
};

/**
 * Generate default checklist items based on risk level
 */
const generateChecklist = (riskLevel, modelId, projectId) => {
  const baseItems = [
    { item: 'Dataset documentation complete', category: 'documentation' },
    { item: 'Model evaluation completed', category: 'evaluation' },
    { item: 'Monitoring enabled', category: 'monitoring' },
  ];

  const highRiskItems = [
    { item: 'Bias and fairness analysis completed', category: 'evaluation' },
    { item: 'Human review completed', category: 'review' },
    { item: 'Explainability method documented', category: 'documentation' },
    { item: 'Incident response plan documented', category: 'compliance' },
    { item: 'Data impact assessment completed', category: 'compliance' },
  ];

  const criticalItems = [
    { item: 'Legal review completed', category: 'compliance' },
    { item: 'Regulatory approval obtained', category: 'compliance' },
    { item: 'Third-party audit scheduled', category: 'review' },
  ];

  let items = [...baseItems];
  if (['High', 'Critical'].includes(riskLevel)) items = [...items, ...highRiskItems];
  if (riskLevel === 'Critical') items = [...items, ...criticalItems];

  return items.map((i) => ({ ...i, modelId, projectId, required: true }));
};

// @desc    Create/update risk profile
// @route   POST /api/governance/risk
const createRiskProfile = async (req, res) => {
  const { modelId, projectId, domain, impact, geography, dataTypes, answers } = req.body;

  if (!modelId || !domain || !impact || !geography) {
    return res.status(400).json({ error: 'modelId, domain, impact, and geography are required' });
  }

  const riskLevel = calculateRiskLevel({ domain, impact, geography, dataTypes });

  // Upsert risk profile
  const profile = await RiskProfile.findOneAndUpdate(
    { modelId },
    { modelId, projectId, domain, impact, geography, dataTypes, riskLevel, answers, assessedBy: req.user._id },
    { new: true, upsert: true, runValidators: true }
  );

  // Generate checklist if new
  const existingItems = await ChecklistItem.countDocuments({ modelId });
  if (existingItems === 0) {
    const items = generateChecklist(riskLevel, modelId, projectId);
    await ChecklistItem.insertMany(items);
  }

  await AuditLog.create({
    projectId,
    userId: req.user._id,
    action: 'RISK_UPDATED',
    entityType: 'RiskProfile',
    entityId: profile._id,
    details: { riskLevel },
  });

  res.json({ success: true, data: profile });
};

// @desc    Get risk profile for a model
// @route   GET /api/governance/risk/:modelId
const getRiskProfile = async (req, res) => {
  const profile = await RiskProfile.findOne({ modelId: req.params.modelId })
    .populate('assessedBy', 'name email');
  if (!profile) return res.status(404).json({ error: 'Risk profile not found' });
  res.json({ success: true, data: profile });
};

// @desc    Get checklist for a model
// @route   GET /api/governance/checklist/:modelId
const getChecklist = async (req, res) => {
  const items = await ChecklistItem.find({ modelId: req.params.modelId })
    .populate('completedBy', 'name');
  const total = items.length;
  const completed = items.filter((i) => i.completed).length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  res.json({ success: true, data: { items, total, completed, progress } });
};

// @desc    Update checklist item
// @route   PUT /api/governance/checklist/:itemId
const updateChecklistItem = async (req, res) => {
  const { completed, notes } = req.body;

  const item = await ChecklistItem.findByIdAndUpdate(
    req.params.itemId,
    {
      completed,
      notes,
      completedAt: completed ? new Date() : null,
      completedBy: completed ? req.user._id : null,
    },
    { new: true }
  );

  if (!item) return res.status(404).json({ error: 'Checklist item not found' });

  await AuditLog.create({
    projectId: item.projectId,
    userId: req.user._id,
    action: 'CHECKLIST_UPDATED',
    entityType: 'Checklist',
    entityId: item._id,
    details: { item: item.item, completed },
  });

  res.json({ success: true, data: item });
};

module.exports = { createRiskProfile, getRiskProfile, getChecklist, updateChecklistItem };

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Project = require('../models/Project');
const Dataset = require('../models/Dataset');
const Run = require('../models/Run');
const MLModel = require('../models/Model');
const Deployment = require('../models/Deployment');
const MonitoringMetric = require('../models/MonitoringMetric');
const RiskProfile = require('../models/RiskProfile');
const ChecklistItem = require('../models/ChecklistItem');
const AuditLog = require('../models/AuditLog');

const seed = async () => {
  await connectDB();
  console.log('🌱 Seeding NexusML database...');

  // Clear all collections
  await Promise.all([
    User.deleteMany({}),
    Project.deleteMany({}),
    Dataset.deleteMany({}),
    Run.deleteMany({}),
    MLModel.deleteMany({}),
    Deployment.deleteMany({}),
    MonitoringMetric.deleteMany({}),
    RiskProfile.deleteMany({}),
    ChecklistItem.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  // Create users
  const owner = await User.create({ name: 'Alex Chen', email: 'alex@nexusml.ai', password: 'password123', role: 'Owner' });
  const contributor = await User.create({ name: 'Maria Santos', email: 'maria@nexusml.ai', password: 'password123', role: 'Contributor' });
  const viewer = await User.create({ name: 'James Lee', email: 'james@nexusml.ai', password: 'password123', role: 'Viewer' });

  console.log('✅ Users created');

  // Create projects
  const project1 = await Project.create({
    name: 'Customer Churn Prediction',
    description: 'ML model to predict which customers will churn in the next 30 days',
    owner: owner._id,
    members: [
      { user: owner._id, role: 'Owner' },
      { user: contributor._id, role: 'Contributor' },
      { user: viewer._id, role: 'Viewer' },
    ],
    tags: ['churn', 'classification', 'customer'],
  });

  const project2 = await Project.create({
    name: 'Fraud Detection System',
    description: 'Real-time fraud detection for financial transactions',
    owner: owner._id,
    members: [{ user: owner._id, role: 'Owner' }, { user: contributor._id, role: 'Contributor' }],
    tags: ['fraud', 'finance', 'classification'],
  });

  const project3 = await Project.create({
    name: 'Sales Forecasting',
    description: 'Time series regression model for quarterly sales forecasting',
    owner: contributor._id,
    members: [{ user: contributor._id, role: 'Owner' }],
    tags: ['forecasting', 'regression', 'sales'],
  });

  console.log('✅ Projects created');

  // Create datasets
  const dataset1 = await Dataset.create({
    projectId: project1._id,
    name: 'Customer Data Q1 2024',
    originalFilename: 'customer_data_q1_2024.csv',
    fileUrl: 'http://localhost:9000/nexusml-datasets/datasets/sample.csv',
    fileKey: 'datasets/sample.csv',
    fileSizeBytes: 245000,
    rows: 10000,
    columns: 15,
    columnNames: ['customer_id', 'age', 'tenure', 'monthly_charges', 'total_charges', 'contract_type', 'internet_service', 'tech_support', 'online_security', 'device_protection', 'streaming_tv', 'streaming_movies', 'payment_method', 'num_support_calls', 'churn'],
    dataTypes: { customer_id: 'categorical', age: 'numeric', tenure: 'numeric', monthly_charges: 'numeric', churn: 'categorical' },
    sampleData: [
      { customer_id: 'C001', age: 34, tenure: 24, monthly_charges: 65.5, churn: '0' },
      { customer_id: 'C002', age: 52, tenure: 3, monthly_charges: 89.9, churn: '1' },
    ],
    uploadedBy: owner._id,
    status: 'ready',
    description: 'Customer telco dataset with churn labels',
  });

  const dataset2 = await Dataset.create({
    projectId: project2._id,
    name: 'Transaction Data Nov 2024',
    originalFilename: 'transactions_nov_2024.csv',
    fileUrl: 'http://localhost:9000/nexusml-datasets/datasets/transactions.csv',
    fileKey: 'datasets/transactions.csv',
    fileSizeBytes: 1200000,
    rows: 50000,
    columns: 20,
    columnNames: ['transaction_id', 'amount', 'merchant_category', 'hour', 'is_international', 'card_present', 'fraud'],
    dataTypes: { transaction_id: 'categorical', amount: 'numeric', fraud: 'categorical' },
    uploadedBy: owner._id,
    status: 'ready',
  });

  console.log('✅ Datasets created');

  // Create runs
  const run1 = await Run.create({
    projectId: project1._id,
    datasetId: dataset1._id,
    name: 'Balanced AutoGluon Run',
    parameters: { modelType: 'auto', preset: 'balanced', targetColumn: 'churn', taskType: 'classification', timeLimit: 300 },
    metrics: { accuracy: 0.892, precision: 0.871, recall: 0.834, f1: 0.852, trainingTime: 247 },
    status: 'completed',
    jobId: 'job-001',
    artifactPath: '/app/models/run1',
    startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    finishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 247000),
    createdBy: owner._id,
  });

  const run2 = await Run.create({
    projectId: project1._id,
    datasetId: dataset1._id,
    name: 'Best Quality Run',
    parameters: { modelType: 'auto', preset: 'best', targetColumn: 'churn', taskType: 'classification', timeLimit: 600 },
    metrics: { accuracy: 0.934, precision: 0.921, recall: 0.889, f1: 0.905, trainingTime: 581 },
    status: 'completed',
    jobId: 'job-002',
    artifactPath: '/app/models/run2',
    startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    finishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 581000),
    createdBy: owner._id,
  });

  const run3 = await Run.create({
    projectId: project2._id,
    datasetId: dataset2._id,
    name: 'Fraud Fast Training',
    parameters: { modelType: 'auto', preset: 'fast', targetColumn: 'fraud', taskType: 'classification', timeLimit: 60 },
    metrics: { accuracy: 0.976, precision: 0.961, recall: 0.943, f1: 0.952, trainingTime: 58 },
    status: 'completed',
    jobId: 'job-003',
    artifactPath: '/app/models/run3',
    startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    finishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 58000),
    createdBy: contributor._id,
  });

  const run4 = await Run.create({
    projectId: project1._id,
    datasetId: dataset1._id,
    name: 'Running Training...',
    parameters: { modelType: 'auto', preset: 'balanced', targetColumn: 'churn', taskType: 'classification', timeLimit: 300 },
    status: 'running',
    startedAt: new Date(),
    createdBy: owner._id,
  });

  console.log('✅ Runs created');

  // Create models
  const model1 = await MLModel.create({
    projectId: project1._id,
    runId: run2._id,
    datasetId: dataset1._id,
    name: 'Churn Predictor v2',
    version: 'v2.0',
    description: 'Production churn prediction model with 93.4% accuracy',
    artifactPath: '/app/models/run2',
    framework: 'AutoGluon',
    taskType: 'classification',
    targetColumn: 'churn',
    metrics: { accuracy: 0.934, precision: 0.921, recall: 0.889, f1: 0.905, trainingTime: 581 },
    status: 'production',
    tags: ['churn', 'production', 'v2'],
    registeredBy: owner._id,
  });

  const model2 = await MLModel.create({
    projectId: project1._id,
    runId: run1._id,
    datasetId: dataset1._id,
    name: 'Churn Predictor v1',
    version: 'v1.0',
    description: 'Initial churn prediction model',
    artifactPath: '/app/models/run1',
    framework: 'AutoGluon',
    taskType: 'classification',
    targetColumn: 'churn',
    metrics: { accuracy: 0.892, precision: 0.871, recall: 0.834, f1: 0.852, trainingTime: 247 },
    status: 'archived',
    tags: ['churn', 'archived'],
    registeredBy: owner._id,
  });

  const model3 = await MLModel.create({
    projectId: project2._id,
    runId: run3._id,
    datasetId: dataset2._id,
    name: 'Fraud Detector',
    version: 'v1.0',
    description: 'Real-time fraud detection with 97.6% accuracy',
    artifactPath: '/app/models/run3',
    framework: 'AutoGluon',
    taskType: 'classification',
    targetColumn: 'fraud',
    metrics: { accuracy: 0.976, precision: 0.961, recall: 0.943, f1: 0.952, trainingTime: 58 },
    status: 'staging',
    tags: ['fraud', 'staging'],
    registeredBy: contributor._id,
  });

  console.log('✅ Models created');

  // Create deployments
  const deployment1 = await Deployment.create({
    modelId: model1._id,
    projectId: project1._id,
    name: 'Churn Predictor Production',
    endpointUrl: 'http://localhost:8101/predict',
    status: 'Running',
    environment: 'production',
    port: 8101,
    logs: '[2024-01-15T10:00:00Z] Container started\n[2024-01-15T10:00:02Z] Model loaded\n[2024-01-15T10:00:03Z] Endpoint ready',
    deployedBy: owner._id,
  });

  const deployment2 = await Deployment.create({
    modelId: model3._id,
    projectId: project2._id,
    name: 'Fraud Detector Staging',
    endpointUrl: 'http://localhost:8102/predict',
    status: 'Running',
    environment: 'staging',
    port: 8102,
    logs: '[2024-01-16T09:00:00Z] Container started\n[2024-01-16T09:00:05Z] Model loaded',
    deployedBy: contributor._id,
  });

  console.log('✅ Deployments created');

  // Create monitoring metrics (last 7 days)
  const now = Date.now();
  const metricsData = [];
  for (let i = 0; i < 7 * 24; i++) {
    const ts = new Date(now - i * 60 * 60 * 1000);
    const requests = Math.floor(Math.random() * 200) + 50;
    const errors = Math.floor(Math.random() * 5);
    metricsData.push({
      deploymentId: deployment1._id,
      requestCount: requests,
      successCount: requests - errors,
      errorCount: errors,
      latency: Math.random() * 80 + 20,
      p95Latency: Math.random() * 150 + 100,
      timestamp: ts,
    });
  }
  await MonitoringMetric.insertMany(metricsData);
  console.log('✅ Monitoring metrics created');

  // Create risk profiles
  const riskProfile1 = await RiskProfile.create({
    modelId: model1._id,
    projectId: project1._id,
    domain: 'finance',
    impact: 'individual',
    geography: 'us',
    dataTypes: ['financial', 'demographic'],
    riskLevel: 'Medium',
    answers: { q1: 'customer retention', q2: 'moderate', q3: 'US only' },
    assessedBy: owner._id,
  });

  const riskProfile2 = await RiskProfile.create({
    modelId: model3._id,
    projectId: project2._id,
    domain: 'finance',
    impact: 'large_group',
    geography: 'global',
    dataTypes: ['financial', 'biometric'],
    riskLevel: 'High',
    answers: { q1: 'fraud prevention', q2: 'high - financial loss', q3: 'global' },
    assessedBy: owner._id,
  });

  // Create checklist items
  const churn_items = [
    { item: 'Dataset documentation complete', category: 'documentation', completed: true, completedAt: new Date() },
    { item: 'Model evaluation completed', category: 'evaluation', completed: true, completedAt: new Date() },
    { item: 'Monitoring enabled', category: 'monitoring', completed: true, completedAt: new Date() },
    { item: 'Bias and fairness analysis completed', category: 'evaluation', completed: false },
    { item: 'Human review completed', category: 'review', completed: false },
  ];

  for (const ci of churn_items) {
    await ChecklistItem.create({
      ...ci,
      modelId: model1._id,
      projectId: project1._id,
      completedBy: ci.completed ? owner._id : null,
    });
  }

  console.log('✅ Governance data created');

  // Create audit logs
  const auditEvents = [
    { userId: owner._id, action: 'USER_REGISTERED', entityType: 'User', entityId: owner._id },
    { userId: contributor._id, action: 'USER_REGISTERED', entityType: 'User', entityId: contributor._id },
    { userId: owner._id, action: 'PROJECT_CREATED', entityType: 'Project', entityId: project1._id, projectId: project1._id },
    { userId: owner._id, action: 'PROJECT_CREATED', entityType: 'Project', entityId: project2._id, projectId: project2._id },
    { userId: owner._id, action: 'DATASET_UPLOADED', entityType: 'Dataset', entityId: dataset1._id, projectId: project1._id, details: { filename: 'customer_data_q1_2024.csv', rows: 10000 } },
    { userId: owner._id, action: 'TRAINING_STARTED', entityType: 'Run', entityId: run1._id, projectId: project1._id },
    { userId: owner._id, action: 'TRAINING_COMPLETED', entityType: 'Run', entityId: run1._id, projectId: project1._id, details: { accuracy: 0.892 } },
    { userId: owner._id, action: 'TRAINING_STARTED', entityType: 'Run', entityId: run2._id, projectId: project1._id },
    { userId: owner._id, action: 'TRAINING_COMPLETED', entityType: 'Run', entityId: run2._id, projectId: project1._id, details: { accuracy: 0.934 } },
    { userId: owner._id, action: 'MODEL_REGISTERED', entityType: 'Model', entityId: model1._id, projectId: project1._id, details: { name: 'Churn Predictor v2', version: 'v2.0' } },
    { userId: owner._id, action: 'MODEL_DEPLOYED', entityType: 'Deployment', entityId: deployment1._id, projectId: project1._id },
    { userId: contributor._id, action: 'DATASET_UPLOADED', entityType: 'Dataset', entityId: dataset2._id, projectId: project2._id },
    { userId: contributor._id, action: 'TRAINING_COMPLETED', entityType: 'Run', entityId: run3._id, projectId: project2._id, details: { accuracy: 0.976 } },
    { userId: contributor._id, action: 'MODEL_REGISTERED', entityType: 'Model', entityId: model3._id, projectId: project2._id },
    { userId: owner._id, action: 'RISK_UPDATED', entityType: 'RiskProfile', entityId: riskProfile1._id, projectId: project1._id, details: { riskLevel: 'Medium' } },
  ];

  for (const event of auditEvents) {
    await AuditLog.create(event);
  }

  console.log('✅ Audit logs created');

  console.log('\n🎉 Seeding complete!');
  console.log('─'.repeat(50));
  console.log('👤 Demo Accounts:');
  console.log('   Owner:       alex@nexusml.ai     / password123');
  console.log('   Contributor: maria@nexusml.ai    / password123');
  console.log('   Viewer:      james@nexusml.ai    / password123');
  console.log('─'.repeat(50));

  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});

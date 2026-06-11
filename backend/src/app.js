require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Route imports
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/projects.routes');
const datasetRoutes = require('./routes/datasets.routes');
const runRoutes = require('./routes/runs.routes');
const modelRoutes = require('./routes/models.routes');
const deploymentRoutes = require('./routes/deployments.routes');
const monitoringRoutes = require('./routes/monitoring.routes');
const governanceRoutes = require('./routes/governance.routes');
const auditRoutes = require('./routes/audit.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();

// Security middleware
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));

// Serve uploaded files as static assets
app.use('/uploads', express.static(UPLOADS_DIR));

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:5173',  // Vite dev server
  'http://localhost:3000',  // Production/Docker
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow no-origin requests (mobile, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'NexusML Backend', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/runs', runRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/deployments', deploymentRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/governance', governanceRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;

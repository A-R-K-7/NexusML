const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const { Readable } = require('stream');
const Dataset = require('../models/Dataset');
const AuditLog = require('../models/AuditLog');
const { UPLOADS_DIR, getFileUrl } = require('../services/storage.service');

// ─── Multer disk storage ──────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.csv') return cb(new Error('Only CSV files are supported'));
    cb(null, true);
  },
});

// ─── CSV helpers ──────────────────────────────────────────────────────────────
const parseCsvMetadata = (filePath) =>
  new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(parse({ columns: true, skip_empty_lines: true, trim: true, to: 6 }))
      .on('data', (row) => rows.push(row))
      .on('end', () => {
        if (rows.length === 0) {
          return resolve({ rows: 0, columns: 0, columnNames: [], dataTypes: {}, sampleData: [] });
        }
        const columnNames = Object.keys(rows[0]);
        const dataTypes = {};
        columnNames.forEach((col) => {
          const values = rows.map((r) => r[col]).filter(Boolean);
          const numCount = values.filter((v) => !isNaN(Number(v)) && v.trim() !== '').length;
          dataTypes[col] = numCount > values.length * 0.7 ? 'numeric' : 'categorical';
        });
        resolve({ columnNames, columns: columnNames.length, dataTypes, sampleData: rows.slice(0, 5) });
      })
      .on('error', reject);
  });

const countCsvRows = (filePath) =>
  new Promise((resolve) => {
    let count = 0;
    fs.createReadStream(filePath)
      .pipe(parse({ columns: true, skip_empty_lines: true }))
      .on('data', () => count++)
      .on('end', () => resolve(count))
      .on('error', () => resolve(0));
  });

// ─── Controllers ─────────────────────────────────────────────────────────────

// @desc    Upload dataset
// @route   POST /api/datasets/upload
const uploadDataset = [
  upload.single('file'),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { projectId, name, description } = req.body;
    if (!projectId) return res.status(400).json({ error: 'projectId is required' });

    // Build URL for the saved file
    const objectKey = req.file.filename;
    const fileUrl = getFileUrl(objectKey);

    // Create initial DB record
    const dataset = await Dataset.create({
      projectId,
      name: name || req.file.originalname.replace('.csv', ''),
      description: description || '',
      originalFilename: req.file.originalname,
      fileUrl,
      fileKey: objectKey,
      fileSizeBytes: req.file.size,
      uploadedBy: req.user._id,
      status: 'processing',
    });

    try {
      // Parse CSV metadata from disk
      const [meta, rowCount] = await Promise.all([
        parseCsvMetadata(req.file.path),
        countCsvRows(req.file.path),
      ]);

      const updated = await Dataset.findByIdAndUpdate(
        dataset._id,
        { rows: rowCount, ...meta, status: 'ready' },
        { new: true }
      ).populate('uploadedBy', 'name email');

      await AuditLog.create({
        projectId,
        userId: req.user._id,
        action: 'DATASET_UPLOADED',
        entityType: 'Dataset',
        entityId: dataset._id,
        details: { filename: req.file.originalname, rows: rowCount, columns: meta.columns },
      });

      res.status(201).json({ success: true, data: updated });
    } catch (err) {
      await Dataset.findByIdAndUpdate(dataset._id, { status: 'error' });
      throw err;
    }
  },
];

// @desc    Get all datasets
// @route   GET /api/datasets
const getDatasets = async (req, res) => {
  const { projectId, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (projectId) filter.projectId = projectId;

  const total = await Dataset.countDocuments(filter);
  const datasets = await Dataset.find(filter)
    .populate('uploadedBy', 'name email')
    .populate('projectId', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({ success: true, data: datasets, total });
};

// @desc    Get single dataset with sample data
// @route   GET /api/datasets/:id
const getDataset = async (req, res) => {
  const dataset = await Dataset.findById(req.params.id)
    .populate('uploadedBy', 'name email')
    .populate('projectId', 'name');
  if (!dataset) return res.status(404).json({ error: 'Dataset not found' });
  res.json({ success: true, data: dataset });
};

module.exports = { uploadDataset, getDatasets, getDataset };

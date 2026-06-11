const mongoose = require('mongoose');

const datasetSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Dataset name is required'],
      trim: true,
    },
    originalFilename: { type: String },
    fileUrl: { type: String },
    fileKey: { type: String }, // MinIO object key
    fileSizeBytes: { type: Number, default: 0 },
    mimeType: { type: String, default: 'text/csv' },
    rows: { type: Number, default: 0 },
    columns: { type: Number, default: 0 },
    columnNames: [{ type: String }],
    dataTypes: { type: mongoose.Schema.Types.Mixed, default: {} }, // { col: dtype }
    sampleData: { type: mongoose.Schema.Types.Mixed, default: [] }, // first 5 rows
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['uploading', 'processing', 'ready', 'error'],
      default: 'uploading',
    },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Dataset', datasetSchema);

const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema(
  {
    modelId: { type: mongoose.Schema.Types.ObjectId, ref: 'MLModel', required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    item: { type: String, required: true },
    category: {
      type: String,
      enum: ['documentation', 'evaluation', 'monitoring', 'review', 'compliance', 'other'],
      default: 'other',
    },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    required: { type: Boolean, default: true },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChecklistItem', checklistItemSchema);

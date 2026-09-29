const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  status: { type: String, required: true, enum: ['pending', 'in_progress', 'completed'] },
  priority: { type: String, required: true, enum: ['low', 'medium', 'high'] },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true }
}, { timestamps: true, versionKey: false });

schema.index({ project: 1, name: 1 }, { unique: true, collation: { locale: 'pt', strength: 2 } });
module.exports = mongoose.model('Task', schema);

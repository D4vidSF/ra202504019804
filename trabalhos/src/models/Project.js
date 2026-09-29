const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  owner: { type: String, required: true, trim: true, maxlength: 100 },
  status: { type: String, required: true, enum: ['active', 'archived'] },
  revision: { type: Number, default: 0, select: false }
}, { timestamps: true, versionKey: false });

schema.index({ name: 1 }, { unique: true, collation: { locale: 'pt', strength: 2 } });
module.exports = mongoose.model('Project', schema);

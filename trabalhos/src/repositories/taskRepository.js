const Task = require('../models/Task');
const collation = { locale: 'pt', strength: 2 };

module.exports = {
  list: (filter = {}) => Task.find(filter).sort({ createdAt: -1 }).lean(),
  findById: (id, session) => Task.findById(id).session(session || null).lean(),
  findByName: (project, name, session) => Task.findOne({ project, name }).collation(collation).session(session).lean(),
  countByProject: (project, onlyOpen, session) => Task.countDocuments({ project, ...(onlyOpen ? { status: { $ne: 'completed' } } : {}) }).session(session),
  create: async (data, session) => (await Task.create([data], { session }))[0].toObject(),
  update: (id, data, session) => Task.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true, session }).lean(),
  delete: (id, session) => Task.findByIdAndDelete(id, { session }).lean()
};

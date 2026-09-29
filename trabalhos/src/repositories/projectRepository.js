const Project = require('../models/Project');
const collation = { locale: 'pt', strength: 2 };

module.exports = {
  list: () => Project.find().sort({ createdAt: -1 }).lean(),
  findById: (id, session) => Project.findById(id).session(session || null).lean(),
  findByName: (name, session) => Project.findOne({ name }).collation(collation).session(session).lean(),
  create: async (data, session) => {
    const [record] = await Project.create([data], { session });
    const result = record.toObject();
    delete result.revision;
    return result;
  },
  // Escrita no pai serializa exclusão/arquivamento com alterações das tarefas.
  touch: (id, session) => Project.findByIdAndUpdate(id, { $inc: { revision: 1 } }, { new: true, session }).lean(),
  update: (id, data, session) => Project.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true, session }).lean(),
  delete: (id, session) => Project.findByIdAndDelete(id, { session }).lean()
};

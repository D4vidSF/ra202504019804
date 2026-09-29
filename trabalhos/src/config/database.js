const mongoose = require('mongoose');
const Project = require('../models/Project');
const Task = require('../models/Task');

mongoose.set('bufferCommands', false);

async function connectDatabase(uri) {
  if (!uri) throw new Error('Configure MONGODB_URI no arquivo .env.');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  if (!hello.setName && hello.msg !== 'isdbgrid') {
    await mongoose.disconnect();
    throw new Error('MongoDB precisa ser um replica set ou Atlas para garantir as transações.');
  }
  await Promise.all([Project.init(), Task.init()]);
}
module.exports = { connectDatabase, disconnectDatabase: () => mongoose.disconnect() };

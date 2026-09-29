const dependencies = {
  projects: require('../repositories/projectRepository'),
  tasks: require('../repositories/taskRepository'),
  transaction: require('../repositories/unitOfWork')
};
module.exports = require('./crudController')(require('../services/projectService')(dependencies), 'projects');

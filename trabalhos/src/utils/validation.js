const AppError = require('./AppError');

function objectId(value, field = 'id') {
  if (typeof value !== 'string' || !/^[a-f\d]{24}$/i.test(value)) {
    throw new AppError(400, `${field} deve ser um ObjectId válido.`);
  }
  return value.toLowerCase();
}

function text(value, field, max) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw new AppError(400, `${field} é obrigatório e deve ter entre 1 e ${max} caracteres.`);
  }
  return value.trim();
}

function choice(value, field, values) {
  if (!values.includes(value)) throw new AppError(400, `${field} deve ser: ${values.join(', ')}.`);
  return value;
}

function body(value, allowed) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AppError(400, 'Envie um objeto JSON.');
  }
  if (Object.keys(value).some(key => !allowed.includes(key))) {
    throw new AppError(400, 'O corpo contém campos não permitidos.');
  }
}

function projectInput(data) {
  body(data, ['name', 'description', 'owner', 'status']);
  return {
    name: text(data.name, 'name', 100),
    description: text(data.description, 'description', 2000),
    owner: text(data.owner, 'owner', 100),
    status: choice(data.status, 'status', ['active', 'archived'])
  };
}

function taskInput(data) {
  body(data, ['name', 'description', 'status', 'priority', 'project']);
  return {
    name: text(data.name, 'name', 100),
    description: text(data.description, 'description', 2000),
    status: choice(data.status, 'status', ['pending', 'in_progress', 'completed']),
    priority: choice(data.priority, 'priority', ['low', 'medium', 'high']),
    project: objectId(data.project, 'project')
  };
}

module.exports = { objectId, projectInput, taskInput };

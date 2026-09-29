const AppError = require('../utils/AppError');
const { objectId, taskInput } = require('../utils/validation');

function createTaskService({ projects, tasks, transaction }) {
  async function get(id) {
    const task = await tasks.findById(objectId(id));
    if (!task) throw new AppError(404, 'Tarefa não encontrada.');
    return task;
  }

  async function save(id, input) {
    if (id) id = objectId(id);
    const data = taskInput(input);
    return transaction(async session => {
      const current = id ? await tasks.findById(id, session) : null;
      if (id && !current) throw new AppError(404, 'Tarefa não encontrada.');
      // Ordem fixa dos pais reduz conflitos em transferências concorrentes.
      const parentIds = [...new Set([data.project, ...(current ? [String(current.project)] : [])])].sort();
      for (const parentId of parentIds) {
        const parent = await projects.touch(parentId, session);
        if (!parent) throw new AppError(404, 'Projeto relacionado não encontrado.');
        if (parent.status !== 'active') throw new AppError(409, 'Reative o projeto antes de criar ou alterar suas tarefas.');
      }
      const duplicate = await tasks.findByName(data.project, data.name, session);
      if (duplicate && String(duplicate._id) !== id) throw new AppError(409, 'Já existe uma tarefa com esse nome neste projeto.');
      return id ? tasks.update(id, data, session) : tasks.create(data, session);
    });
  }

  async function remove(id) {
    id = objectId(id);
    return transaction(async session => {
      const current = await tasks.findById(id, session);
      if (!current) throw new AppError(404, 'Tarefa não encontrada.');
      await projects.touch(String(current.project), session);
      await tasks.delete(id, session);
    });
  }

  async function list(query = {}) {
    const filter = {};
    if (query.project !== undefined) filter.project = objectId(query.project, 'project');
    return tasks.list(filter);
  }
  return { list, get, create: input => save(null, input), update: save, remove };
}
module.exports = createTaskService;

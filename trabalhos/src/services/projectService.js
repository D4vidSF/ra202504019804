const AppError = require('../utils/AppError');
const { objectId, projectInput } = require('../utils/validation');

function createProjectService({ projects, tasks, transaction }) {
  async function get(id) {
    const project = await projects.findById(objectId(id));
    if (!project) throw new AppError(404, 'Projeto não encontrado.');
    return project;
  }

  async function save(id, input) {
    if (id) id = objectId(id);
    const data = projectInput(input);
    return transaction(async session => {
      if (id && !await projects.touch(id, session)) throw new AppError(404, 'Projeto não encontrado.');
      const duplicate = await projects.findByName(data.name, session);
      if (duplicate && String(duplicate._id) !== id) throw new AppError(409, 'Já existe um projeto com esse nome.');
      if (id && data.status === 'archived' && await tasks.countByProject(id, true, session)) {
        throw new AppError(409, 'Conclua as tarefas antes de arquivar o projeto.');
      }
      return id ? projects.update(id, data, session) : projects.create(data, session);
    });
  }

  async function remove(id) {
    id = objectId(id);
    return transaction(async session => {
      if (!await projects.touch(id, session)) throw new AppError(404, 'Projeto não encontrado.');
      if (await tasks.countByProject(id, false, session)) throw new AppError(409, 'Exclua ou transfira as tarefas antes de excluir o projeto.');
      await projects.delete(id, session);
    });
  }

  return { list: () => projects.list(), get, create: input => save(null, input), update: save, remove };
}
module.exports = createProjectService;

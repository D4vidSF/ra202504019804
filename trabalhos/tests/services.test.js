const createProjectService = require('../src/services/projectService');
const createTaskService = require('../src/services/taskService');

const projectId = '507f1f77bcf86cd799439011';
const taskId = '507f1f77bcf86cd799439012';
const project = { name: 'Projeto', description: 'Descrição', owner: 'Estudante', status: 'active' };
const task = { name: 'Tarefa', description: 'Descrição', status: 'pending', priority: 'high', project: projectId };
let projects, tasks, projectService, taskService;

beforeEach(() => {
  projects = {
    findById: jest.fn().mockResolvedValue({ _id: projectId, ...project }),
    findByName: jest.fn().mockResolvedValue(null),
    touch: jest.fn().mockResolvedValue({ _id: projectId, ...project }),
    create: jest.fn(async data => ({ _id: projectId, ...data })),
    update: jest.fn(async (id, data) => ({ _id: id, ...data })),
    delete: jest.fn(), list: jest.fn().mockResolvedValue([])
  };
  tasks = {
    findById: jest.fn().mockResolvedValue({ _id: taskId, ...task }),
    findByName: jest.fn().mockResolvedValue(null), countByProject: jest.fn().mockResolvedValue(0),
    create: jest.fn(async data => ({ _id: taskId, ...data })),
    update: jest.fn(async (id, data) => ({ _id: id, ...data })),
    delete: jest.fn(), list: jest.fn().mockResolvedValue([])
  };
  const dependencies = { projects, tasks, transaction: work => work('session') };
  projectService = createProjectService(dependencies);
  taskService = createTaskService(dependencies);
});

test('cria projeto e normaliza espaços do nome', async () => {
  await expect(projectService.create({ ...project, name: '  Projeto  ' })).resolves.toMatchObject({ name: 'Projeto' });
});
test('cria tarefa vinculada a projeto ativo', async () => {
  await expect(taskService.create(task)).resolves.toMatchObject(task);
  expect(projects.touch).toHaveBeenCalledWith(projectId, 'session');
});
test('arquiva projeto com todas as tarefas concluídas', async () => {
  await expect(projectService.update(projectId, { ...project, status: 'archived' })).resolves.toMatchObject({ status: 'archived' });
});
test('impede arquivamento com tarefas abertas', async () => {
  tasks.countByProject.mockResolvedValue(1);
  await expect(projectService.update(projectId, { ...project, status: 'archived' })).rejects.toMatchObject({ status: 409 });
  expect(projects.update).not.toHaveBeenCalled();
});
test('impede exclusão de projeto com tarefas', async () => {
  tasks.countByProject.mockResolvedValue(1);
  await expect(projectService.remove(projectId)).rejects.toMatchObject({ status: 409 });
  expect(projects.delete).not.toHaveBeenCalled();
});
test('exclui projeto vazio', async () => {
  await projectService.remove(projectId);
  expect(projects.delete).toHaveBeenCalledWith(projectId, 'session');
});
test('impede tarefa em projeto inexistente', async () => {
  projects.touch.mockResolvedValue(null);
  await expect(taskService.create(task)).rejects.toMatchObject({ status: 404 });
  expect(tasks.create).not.toHaveBeenCalled();
});
test('impede tarefa em projeto arquivado', async () => {
  projects.touch.mockResolvedValue({ status: 'archived' });
  await expect(taskService.create(task)).rejects.toMatchObject({ status: 409 });
});
test('impede nomes duplicados no mesmo projeto', async () => {
  tasks.findByName.mockResolvedValue({ _id: taskId });
  await expect(taskService.create(task)).rejects.toMatchObject({ status: 409 });
});
test('impede projetos duplicados', async () => {
  projects.findByName.mockResolvedValue({ _id: projectId });
  await expect(projectService.create(project)).rejects.toMatchObject({ status: 409 });
});
test('permite manter nome ao editar o próprio registro com ID em maiúsculas', async () => {
  projects.findByName.mockResolvedValue({ _id: projectId });
  await expect(projectService.update(projectId.toUpperCase(), project)).resolves.toMatchObject(project);
});
test.each([
  { ...task, status: 'invalid' },
  { ...task, priority: 'urgent' },
  { ...task, project: '123' },
  { ...task, name: '  ' },
  { ...task, description: 'x'.repeat(2001) },
  { ...task, name: { $ne: '' } },
  { ...task, unexpected: true },
  null,
  []
])('rejeita corpo inválido antes de acessar banco: %j', async input => {
  await expect(taskService.create(input)).rejects.toMatchObject({ status: 400 });
  expect(projects.touch).not.toHaveBeenCalled();
});
test('retorna 400 para ID inválido', async () => {
  await expect(taskService.get('invalido')).rejects.toMatchObject({ status: 400 });
  expect(tasks.findById).not.toHaveBeenCalled();
});
test('retorna 404 para tarefa inexistente', async () => {
  tasks.findById.mockResolvedValue(null);
  await expect(taskService.get(taskId)).rejects.toMatchObject({ status: 404 });
});
test('exclui tarefa mesmo em projeto arquivado', async () => {
  projects.touch.mockResolvedValue({ status: 'archived' });
  await taskService.remove(taskId);
  expect(tasks.delete).toHaveBeenCalledWith(taskId, 'session');
});
test('transferência verifica ambos os projetos', async () => {
  const destination = '507f1f77bcf86cd799439013';
  await taskService.update(taskId, { ...task, project: destination });
  expect(projects.touch).toHaveBeenCalledWith(projectId, 'session');
  expect(projects.touch).toHaveBeenCalledWith(destination, 'session');
});

const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { connectDatabase, disconnectDatabase } = require('../src/config/database');
const app = require('../src/app');
const Project = require('../src/models/Project');
const Task = require('../src/models/Task');

// Não há banco em memória: habilite com a URI de um MongoDB real e isolado.
if (process.env.npm_lifecycle_event === 'test:integration' && !process.env.MONGODB_TEST_URI) {
  throw new Error('Configure MONGODB_TEST_URI para executar os testes de integração.');
}
const integration = process.env.MONGODB_TEST_URI ? describe : describe.skip;
integration('API HTTP + MongoDB real', () => {
  let server, base;
  const createdProjects = new Set();
  const createdTasks = new Set();
  const prefix = `integration-${Date.now()}-${process.pid}`;
  const projectInput = suffix => ({ name: `${prefix}-${suffix}`, description: 'Teste de integração', owner: 'Teste', status: 'active' });
  const taskInput = (project, suffix = 'task') => ({ name: `${prefix}-${suffix}`, description: 'Teste de integração', status: 'pending', priority: 'high', project });

  async function request(method, route, body) {
    const response = await fetch(`${base}${route}`, { method, headers: { 'Content-Type': 'application/json' }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    if (response.status === 201 && route === '/projects') createdProjects.add(data._id);
    if (response.status === 201 && route === '/tasks') createdTasks.add(data._id);
    return { status: response.status, data, headers: response.headers };
  }

  beforeAll(async () => {
    const uri = process.env.MONGODB_TEST_URI;
    const databaseName = new URL(uri).pathname.slice(1);
    if (!databaseName.endsWith('_test')) throw new Error('Use um banco dedicado cujo nome termine em _test.');
    await connectDatabase(uri);
    server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
    base = `http://127.0.0.1:${server.address().port}`;
  }, 30000);

  afterAll(async () => {
    if (server) await new Promise(resolve => server.close(resolve));
    if (mongoose.connection.readyState === 1) {
      await Task.deleteMany({ _id: { $in: [...createdTasks] } });
      await Project.deleteMany({ _id: { $in: [...createdProjects] } });
    }
    await disconnectDatabase();
  });

  test('CRUD completo, vínculo, erros e regras de negócio', async () => {
    const input = projectInput('crud');
    const created = await request('POST', '/projects', input);
    expect(created.status).toBe(201);
    const project = created.data._id;
    expect(created.headers.get('location')).toBe(`/projects/${project}`);
    expect(created.data.revision).toBeUndefined();
    expect((await request('GET', `/projects/${project}`)).data.name).toBe(input.name);
    expect((await request('GET', '/projects')).data.some(item => item._id === project)).toBe(true);
    expect((await request('POST', '/projects', { ...input, name: input.name.toUpperCase() })).status).toBe(409);
    expect((await request('POST', '/tasks', taskInput('507f1f77bcf86cd799439099'))).status).toBe(404);

    const taskData = taskInput(project);
    const createdTask = await request('POST', '/tasks', taskData);
    expect(createdTask.status).toBe(201);
    const task = createdTask.data._id;
    expect((await request('GET', `/tasks/${task}`)).data.project).toBe(project);
    expect((await request('GET', `/tasks?project=${project}`)).data).toHaveLength(1);
    expect((await request('POST', '/tasks', { ...taskData, name: taskData.name.toUpperCase() })).status).toBe(409);
    expect((await request('DELETE', `/projects/${project}`)).status).toBe(409);
    expect((await request('PUT', `/projects/${project}`, { ...input, status: 'archived' })).status).toBe(409);
    expect((await request('PUT', `/tasks/${task}`, { ...taskData, status: 'completed' })).status).toBe(200);
    expect((await request('PUT', `/projects/${project}`, { ...input, status: 'archived' })).status).toBe(200);
    expect((await request('PUT', `/tasks/${task}`, taskData)).status).toBe(409);
    expect((await request('POST', '/tasks', taskInput(project, 'other'))).status).toBe(409);
    expect((await request('DELETE', `/tasks/${task}`)).status).toBe(204);
    expect((await request('DELETE', `/tasks/${task}`)).status).toBe(404);
    const removed = await request('DELETE', `/projects/${project}`);
    expect(removed.status).toBe(204);
    expect(removed.data).toBe('');
    expect((await request('DELETE', `/projects/${project}`)).status).toBe(404);
  });

  test('validação, JSON inválido, rotas e documentos públicos', async () => {
    expect((await request('GET', '/tasks/invalid')).status).toBe(400);
    expect((await request('GET', '/projects/507f1f77bcf86cd799439099')).status).toBe(404);
    expect((await request('POST', '/projects', {})).status).toBe(400);
    expect((await request('PUT', '/tasks/507f1f77bcf86cd799439099', taskInput('507f1f77bcf86cd799439098'))).status).toBe(404);
    expect((await request('GET', '/tasks?project=invalid')).status).toBe(400);
    const invalidJson = await fetch(`${base}/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{invalid' });
    expect(invalidJson.status).toBe(400);
    expect(await invalidJson.json()).toEqual({ erro: 'JSON inválido.' });
    expect((await request('GET', '/missing')).data).toEqual({ erro: 'Rota não encontrada.' });
    expect((await request('GET', '/swagger/')).status).toBe(200);
    expect((await request('GET', '/')).data).toContain('id="view"');
    expect((await request('GET', '/js/app.js')).data).toContain('fetch(');
    const specification = (await request('GET', '/openapi.json')).data;
    for (const resource of ['projects', 'tasks']) {
      expect(Object.keys(specification.paths[`/${resource}`])).toEqual(['get', 'post']);
      expect(Object.keys(specification.paths[`/${resource}/{id}`])).toEqual(['get', 'put', 'delete']);
    }
  });

  test('transferência preserva o vínculo e libera exclusão da origem', async () => {
    const origin = (await request('POST', '/projects', projectInput('origin'))).data._id;
    const destination = (await request('POST', '/projects', projectInput('destination'))).data._id;
    const input = taskInput(origin, 'transfer');
    const task = (await request('POST', '/tasks', input)).data._id;
    expect((await request('PUT', `/tasks/${task}`, { ...input, project: destination })).status).toBe(200);
    expect((await request('DELETE', `/projects/${origin}`)).status).toBe(204);
    expect((await request('GET', `/tasks/${task}`)).data.project).toBe(destination);
  });

  test('criação e exclusão concorrentes não deixam tarefa órfã', async () => {
    const parent = (await request('POST', '/projects', projectInput('concurrency'))).data._id;
    const [creation, deletion] = await Promise.all([
      request('POST', '/tasks', taskInput(parent, 'concurrent')),
      request('DELETE', `/projects/${parent}`)
    ]);
    expect([[201, 409], [404, 204]]).toContainEqual([creation.status, deletion.status]);
    const children = (await request('GET', `/tasks?project=${parent}`)).data;
    if (children.length) expect((await request('GET', `/projects/${parent}`)).status).toBe(200);
  });

  test('índice único impede duplicidade concorrente', async () => {
    const input = projectInput('duplicate');
    const results = await Promise.all([request('POST', '/projects', input), request('POST', '/projects', input)]);
    expect(results.map(result => result.status).sort()).toEqual([201, 409]);
  });
});

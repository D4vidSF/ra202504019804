const id = { type: 'string', pattern: '^[a-fA-F0-9]{24}$', example: '507f1f77bcf86cd799439011' };
const text = maxLength => ({ type: 'string', minLength: 1, maxLength });
const projectProperties = {
  name: { ...text(100), example: 'Trabalho semestral' },
  description: { ...text(2000), example: 'Entrega da aplicação web de tarefas.' },
  owner: { ...text(100), example: 'Estudante' },
  status: { type: 'string', enum: ['active', 'archived'], example: 'active' }
};
const taskProperties = {
  name: { ...text(100), example: 'Documentar API' },
  description: { ...text(2000), example: 'Descrever os endpoints no Swagger.' },
  status: { type: 'string', enum: ['pending', 'in_progress', 'completed'], example: 'pending' },
  priority: { type: 'string', enum: ['low', 'medium', 'high'], example: 'high' },
  project: id
};
const ref = name => ({ $ref: `#/components/schemas/${name}` });
const json = schema => ({ 'application/json': { schema } });
const error = (description, example) => ({
  description,
  content: { 'application/json': { schema: ref('Error'), example: { erro: example } } }
});
const errors = {
  400: error('Dados, ObjectId ou JSON inválidos.', 'Dados inválidos.'),
  404: error('Registro ou projeto relacionado inexistente.', 'Projeto não encontrado.'),
  409: error('Nome duplicado, projeto arquivado ou projeto com tarefas impedindo a operação.', 'Conclua as tarefas antes de arquivar o projeto.'),
  413: error('JSON acima do limite de 32 KB.', 'Corpo da requisição muito grande.'),
  500: error('Falha interna ou indisponibilidade do banco.', 'Erro interno inesperado.')
};

const paths = {};
for (const [resource, schema, label] of [['projects', 'Project', 'projetos'], ['tasks', 'Task', 'tarefas']]) {
  const tags = [schema];
  const parameters = [{ name: 'id', in: 'path', required: true, description: 'ObjectId do registro.', schema: id }];
  const requestBody = { required: true, content: json(ref(`${schema}Input`)) };
  paths[`/${resource}`] = {
    get: {
      tags, summary: `Listar ${label}`, description: 'Retorna os registros do mais recente para o mais antigo. Lista vazia retorna [].',
      parameters: resource === 'tasks' ? [{ name: 'project', in: 'query', required: false, description: 'Filtrar tarefas pelo ObjectId do projeto. Projeto sem tarefas retorna [].', schema: id }] : [],
      responses: { 200: { description: 'Lista de registros.', content: json({ type: 'array', items: ref(schema) }) }, 400: errors[400], 500: errors[500] }
    },
    post: {
      tags, summary: `Criar ${schema === 'Task' ? 'tarefa' : 'projeto'}`,
      description: schema === 'Task' ? 'Exige projeto ativo e existente. Nome único dentro do projeto, sem diferenciar maiúsculas/minúsculas.' : 'Nome único sem diferenciar maiúsculas/minúsculas. Todos os campos são obrigatórios.',
      requestBody,
      responses: { 201: { description: 'Registro criado.', headers: { Location: { description: 'URL do novo recurso.', schema: { type: 'string', example: `/${resource}/507f1f77bcf86cd799439011` } } }, content: json(ref(schema)) }, ...errors }
    }
  };
  paths[`/${resource}/{id}`] = {
    get: { tags, summary: 'Consultar detalhe', description: 'Busca um registro pelo seu ObjectId.', parameters, responses: { 200: { description: 'Registro encontrado.', content: json(ref(schema)) }, 400: errors[400], 404: errors[404], 500: errors[500] } },
    put: {
      tags, summary: 'Substituir os campos editáveis',
      description: schema === 'Task' ? 'Envie todos os campos. Permite mudar status e projeto; projetos de origem e destino devem estar ativos.' : 'Envie todos os campos. Arquivamento exige todas as tarefas concluídas. Reativação é permitida.',
      parameters, requestBody, responses: { 200: { description: 'Registro atualizado.', content: json(ref(schema)) }, ...errors }
    },
    delete: {
      tags, summary: 'Excluir registro', description: schema === 'Project' ? 'Bloqueia a exclusão enquanto houver tarefas vinculadas.' : 'Exclui a tarefa, inclusive em projeto arquivado.', parameters,
      responses: { 204: { description: 'Registro excluído, sem corpo de resposta.' }, 400: errors[400], 404: errors[404], 409: errors[409], 500: errors[500] }
    }
  };
}
paths['/openapi.json'] = { get: { tags: ['Documentação'], summary: 'Obter a especificação OpenAPI', responses: { 200: { description: 'Documento OpenAPI em JSON.', content: json({ type: 'object' }) } } } };
const htmlResponse = description => ({ 200: { description, content: { 'text/html': { schema: { type: 'string' } } } } });
paths['/swagger/'] = { get: { tags: ['Documentação'], summary: 'Abrir Swagger UI', responses: htmlResponse('Interface interativa.') } };
paths['/'] = { get: { tags: ['Interface'], summary: 'Abrir aplicação web', responses: htmlResponse('Página HTML com navegação assíncrona.') } };

const schemas = { Error: { type: 'object', required: ['erro'], properties: { erro: { type: 'string' } } } };
for (const [name, properties] of [['Project', projectProperties], ['Task', taskProperties]]) {
  schemas[`${name}Input`] = { type: 'object', additionalProperties: false, required: Object.keys(properties), properties };
  schemas[name] = {
    type: 'object', properties: {
      _id: id, ...properties,
      createdAt: { type: 'string', format: 'date-time', example: '2026-09-28T12:00:00.000Z' },
      updatedAt: { type: 'string', format: 'date-time', example: '2026-09-28T12:00:00.000Z' }
    }
  };
}
module.exports = {
  openapi: '3.0.3',
  info: { title: 'API Tasks', version: '1.0.0', description: 'Gestão de projetos e tarefas. PUT exige todos os campos editáveis. Erros seguem { "erro": "mensagem" }.' },
  servers: [{ url: '/' }], paths, components: { schemas }
};

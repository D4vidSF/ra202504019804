# API Tasks — Projetos e tarefas

**David Silva Ferreira · RA 202504019804**

Curso: Análise e Desenvolvimento de Sistemas · **Turma: preencher**

Arquitetura de Aplicações Web — 2026.2

Aplicação para organizar tarefas em projetos, acompanhar status e prioridade e manter uma visão das atividades pendentes. Migração conceitual da [API Java original](https://github.com/D4vidSF/api-tasks), preservada sem alterações. A análise completa está em [docs/analise-migracao.md](docs/analise-migracao.md), e a proposta em [docs/proposta.md](docs/proposta.md).

O Java tinha somente Task (name, description, status), CRUD e persistência PostgreSQL. Project, prioridade, validações, regras de integridade e frontend são extensões desta versão. Não há importação automática de dados antigos.

## Tecnologias e pré-requisitos

- Node.js **22 LTS ou superior** com npm.
- Express 5, JavaScript, Mongoose 8, MongoDB, dotenv e swagger-ui-express.
- HTML, CSS e JavaScript com Fetch API, sem framework frontend.
- Jest para testes; nodemon para desenvolvimento.
- MongoDB **8.0** local em replica set ou cluster MongoDB Atlas. Para a opção local fornecida, instale Docker com Compose.

O banco é real e persistente. Transações exigem replica set ou Atlas; uma instância standalone não atende. Não há persistência em memória ou arquivo JSON. Os mocks dos testes unitários substituem apenas dependências durante os testes.

## Instalação e execução

### Primeiro uso no Windows

Se aparecer `npm: command not found`, o Node.js/npm não está instalado ou não está no PATH do terminal. Se aparecer `docker: command not found`, o Docker CLI não está instalado ou não está no PATH. Esses comandos precisam estar disponíveis antes de executar o projeto.

1. Instale a versão **LTS do Node.js** pelo [site oficial](https://nodejs.org/en/download). No instalador do Windows, mantenha os componentes npm e inclusão no PATH selecionados.
2. Para usar o MongoDB do `compose.yaml`, instale o [Docker Desktop para Windows](https://docs.docker.com/desktop/setup/install/windows-install/), seguindo os requisitos de WSL 2 apresentados pelo instalador. Reinicie o Windows se solicitado.
3. Abra o Docker Desktop e espere o mecanismo iniciar.
4. Feche e reabra o Git Bash. Se o terminal estiver dentro do VS Code, feche e reabra também o VS Code para atualizar o PATH.
5. Confirme que estes comandos funcionam antes de continuar:

```bash
node --version
npm --version
docker --version
docker compose version
docker info
```

As versões portáteis usadas na verificação inicial do projeto não foram instaladas globalmente e não deixam `node`, `npm` ou `docker` disponíveis em novos terminais.

### Git Bash (terminal MINGW64)

Execute um comando de cada vez. O comando abaixo entra na pasta mesmo se você já estiver dentro de `trabalhos/`:

```bash
cd ~/ra202504019804/trabalhos
npm install
if [ ! -f .env ]; then cp .env.example .env; fi
docker compose up -d --wait
npm run dev
```

No Git Bash, use `cp`; `Copy-Item` é exclusivo do PowerShell. A cópia condicional preserva um `.env` que já exista. O terminal ficará ocupado enquanto a aplicação estiver rodando; use `Ctrl+C` para encerrá-la. Abra outro terminal na mesma pasta para executar `npm test`.

### PowerShell

A partir da raiz deste repositório:

```powershell
cd trabalhos
npm install
if (!(Test-Path .env)) { Copy-Item .env.example .env }
docker compose up -d --wait
npm run dev
```

No Linux/macOS, use os comandos Bash acima, adaptando o caminho do repositório e a instalação do Docker ao seu sistema. Para executar sem monitoramento de arquivos:

```sh
npm start
```

O `compose.yaml` sobe MongoDB na porta 27017, inicia o replica set `rs0` e guarda os dados no volume `mongo_data`. Se a porta já estiver ocupada, use outra instância replica set e ajuste a URI. O servidor Node só inicia após conectar, confirmar suporte a transações e criar os índices.

Para usar **Atlas**, dispense o comando Docker e configure `MONGODB_URI` no `.env` com a URI do seu cluster, incluindo o nome do banco. Configure usuário do banco e acesso de rede no Atlas. Nunca publique credenciais. Para parar o banco local preservando seus dados: `docker compose stop`.

### Problemas de ambiente

| Mensagem | Como resolver |
|---|---|
| npm: command not found | Instale Node.js LTS com npm e reabra o terminal/VS Code. Confirme com `node --version` e `npm --version`. |
| Copy-Item: command not found | Você está no Git Bash: use `cp .env.example .env` somente se ainda não tiver `.env`. |
| docker: command not found | Instale Docker Desktop e reabra o terminal; ou configure MongoDB Atlas e dispense os comandos Docker. |
| Cannot connect to the Docker daemon / erro de pipe | Abra o Docker Desktop, espere iniciar e confira `docker info`. |
| Falha ao iniciar a aplicação | Confira o `.env`, a URI e o banco. Na opção Docker, consulte `docker compose ps` e `docker compose logs mongo`. |

- Aplicação: http://localhost:3000
- Swagger: http://localhost:3000/swagger/
- OpenAPI JSON: http://localhost:3000/openapi.json

Primeiro crie um **projeto ativo**, depois uma tarefa vinculada. A interface permite listar, detalhar, criar, editar e excluir as duas entidades, filtrar tarefas por projeto e navegar sem recarregar a página. Exclusões pedem confirmação e erros da API são apresentados na tela.

## Variáveis de ambiente

| Variável | Uso | Exemplo sem credenciais |
|---|---|---|
| PORT | Porta HTTP; padrão 3000 | 3000 |
| MONGODB_URI | Obrigatória: banco da aplicação | mongodb://127.0.0.1:27017/api_tasks?replicaSet=rs0 |
| MONGODB_TEST_URI | Opcional: banco separado de integração, nome terminando em _test | mongodb://127.0.0.1:27017/api_tasks_test?replicaSet=rs0 |

O `.env` é carregado a partir da pasta `trabalhos/`, independentemente do diretório do terminal. `.env`, dependências, logs e cobertura são ignorados pelo Git. O código não contém URI de produção nem credenciais. As URIs locais do exemplo são apenas instruções de configuração.

## Arquitetura

```text
HTTP → Route → Controller → Service → Repository → MongoDB
                                         ↓
                                   Model Mongoose
```

- **Route:** URLs, verbos HTTP e ligação com controllers.
- **Controller:** captura parâmetros/corpo, chama serviço e define resposta/status/Location.
- **Service:** valida campos, verifica existência/duplicidade e aplica regras entre entidades. Recebe repositórios e unidade de trabalho por injeção.
- **Repository:** concentra consultas, criação, atualização e exclusão no MongoDB. `unitOfWork.js` executa transações.
- **Model:** schemas, tipos, enums, timestamps e índices únicos Mongoose.

`app.js` configura JSON, rotas, Swagger, arquivos estáticos e middleware central de erros. `server.js` lê ambiente, conecta ao banco e abre a porta. Express 5 encaminha rejeições de funções async ao tratamento de erros ([documentação oficial](https://expressjs.com/en/guide/error-handling/)).

## Entidades e relacionamento

### Project

| Atributo | Tipo | Regra |
|---|---|---|
| name | String | Obrigatório, até 100 caracteres, único |
| description | String | Obrigatório, até 2000 caracteres |
| owner | String | Obrigatório, até 100 caracteres; rótulo do responsável |
| status | String | active ou archived |

### Task

| Atributo | Tipo | Regra |
|---|---|---|
| name | String | Obrigatório, até 100 caracteres, único no projeto |
| description | String | Obrigatório, até 2000 caracteres |
| status | String | pending, in_progress ou completed |
| priority | String | low, medium ou high |
| project | ObjectId | Referência obrigatória a Project existente |

Ambas possuem `_id`, `createdAt` e `updatedAt` gerados pelo banco/Mongoose. Project possui também `revision`, contador interno não exposto pela API, usado para coordenar transações.

**Project 1:N Task**, usando referência `Task.project` por ObjectId. Tarefas têm CRUD independente e podem mudar de projeto; referências evitam documentos de projeto crescentes e regravação de grandes arrays. O frontend resolve o nome do projeto pela API; o contrato da tarefa retorna o ObjectId, sem populate.

Criação/alteração de tarefa e exclusão/arquivamento de projeto usam transações com escrita no pai. Isso evita tarefas órfãs e arquivamento inconsistente sob concorrência. Mais detalhes em [análise](docs/analise-migracao.md) e na [documentação de transações Mongoose](https://mongoosejs.com/docs/transactions.html).

## Regras de negócio

1. Campos de domínio são obrigatórios; textos são aparados e não podem ficar vazios. Tipos, limites e enums são validados antes da gravação.
2. Nome de projeto é único; nome de tarefa é único dentro do projeto. A comparação não diferencia maiúsculas/minúsculas. Índices únicos também protegem contra requisições simultâneas.
3. Criar ou editar uma tarefa exige projeto ativo. Transferência exige origem e destino ativos.
4. Arquivar projeto exige ausência de tarefas abertas. Projeto vazio pode ser arquivado. Reativação é permitida.
5. Excluir projeto exige ausência de qualquer tarefa. Exclua ou transfira as tarefas primeiro; não há exclusão em cascata.
6. Excluir tarefa é permitido mesmo em projeto arquivado.
7. Em projeto ativo, tarefas podem mudar entre quaisquer dos três status, inclusive serem reabertas.
8. PUT substitui **todos os campos editáveis**. Não é atualização parcial; campos desconhecidos, IDs e timestamps enviados no corpo são rejeitados.

`owner` não é conta de usuário e não confere permissão. JWT/RBAC não estão implementados. A aplicação é uma entrega local sem autenticação.

## Endpoints

| Método | Endpoint | Descrição |
|---|---|---|
| GET | /projects | Listar todos os projetos |
| GET | /projects/:id | Consultar projeto |
| POST | /projects | Criar projeto |
| PUT | /projects/:id | Atualizar projeto |
| DELETE | /projects/:id | Excluir projeto sem tarefas |
| GET | /tasks | Listar todas as tarefas |
| GET | /tasks?project=:id | Filtrar tarefas por projeto |
| GET | /tasks/:id | Consultar tarefa |
| POST | /tasks | Criar tarefa |
| PUT | /tasks/:id | Atualizar tarefa |
| DELETE | /tasks/:id | Excluir tarefa |
| GET | / | Interface web |
| GET | /swagger/ | Swagger UI |
| GET | /openapi.json | Especificação OpenAPI |

Listagens devolvem arrays ordenados por criação decrescente e `[]` quando vazias. Esta versão não implementa paginação. Para POST/PUT, envie `Content-Type: application/json`.

Exemplo de criação de projeto:

```json
{
  "name": "Trabalho semestral",
  "description": "Entrega da aplicação web",
  "owner": "Estudante",
  "status": "active"
}
```

Exemplo de tarefa (substitua `project` pelo `_id` devolvido na criação do projeto):

```json
{
  "name": "Documentar API",
  "description": "Descrever os endpoints no Swagger",
  "status": "pending",
  "priority": "high",
  "project": "507f1f77bcf86cd799439011"
}
```

## Status e erros

| Status | Situação |
|---|---|
| 200 | Consulta ou atualização bem-sucedida |
| 201 | Criação; cabeçalho Location aponta para o recurso |
| 204 | Exclusão bem-sucedida, sem corpo |
| 400 | Campo inválido/ausente, campo extra, ObjectId inválido ou JSON malformado |
| 404 | Registro, relacionamento ou rota inexistente |
| 409 | Duplicidade ou violação das regras de projetos/tarefas |
| 413 | Corpo JSON maior que 32 KB |
| 500 | Falha inesperada ou indisponibilidade do banco |

O middleware central devolve sempre `{ "erro": "mensagem" }` para os erros tratados. Não expõe stack, credenciais ou detalhes internos. Se o banco estiver indisponível na inicialização, a aplicação encerra sem abrir a porta HTTP.

## Testes

```sh
npm test
```

Executa os testes unitários de regras/erros. A suíte de integração é executada se `MONGODB_TEST_URI` estiver configurada; caso contrário, aparece explicitamente como ignorada. Os testes unitários incluem sucesso, campos inválidos, duplicidade, projetos inexistentes/arquivados, arquivamento, exclusão e transferência.

Para integração com MongoDB real, configure no `.env` uma URI de **banco exclusivo de testes com nome terminando em `_test`**, inicie o replica set e rode:

```sh
npm run test:integration
```

Os testes fazem requisições HTTP reais em uma porta temporária, verificam CRUD, status, filtros, documentação, transações e concorrência. Removem apenas os registros que eles próprios criaram, sem executar dropDatabase. Não use banco com dados importantes. Resultados da execução durante a implementação: [docs/verificacao.md](docs/verificacao.md).

## SOLID e evolução

- **Responsabilidade única (SRP):** rotas, controllers, serviços e repositórios têm responsabilidades separadas. Exemplo: `taskService.js` decide se pode gravar; `taskRepository.js` executa a consulta.
- **Inversão de dependência (DIP):** factories dos serviços recebem objetos de repositório/unidade de trabalho; não importam Mongoose. Os testes injetam doubles sem alterar regras.
- **Segregação de interfaces (ISP):** repositórios de tarefas e projetos expõem operações específicas; o serviço não depende de métodos HTTP nem da interface inteira do Mongoose.

JWT pode ser acrescentado como middleware antes dos controllers; autorização precisará também considerar propriedade dos registros nos serviços. Esses recursos não fazem parte da versão atual e não são simulados.

## Estrutura

```text
trabalhos/
├── .env.example
├── .gitignore
├── compose.yaml
├── package.json
├── package-lock.json
├── README.md
├── trabalho-semestral-2026.2.docx
├── docs/
│   ├── README-original.md
│   ├── analise-migracao.md
│   ├── proposta.md
│   └── verificacao.md
├── public/
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   │   ├── database.js
│   │   └── swagger.js
│   ├── controllers/
│   │   ├── crudController.js
│   │   ├── projectController.js
│   │   └── taskController.js
│   ├── middlewares/errorHandler.js
│   ├── models/
│   │   ├── Project.js
│   │   └── Task.js
│   ├── repositories/
│   │   ├── projectRepository.js
│   │   ├── taskRepository.js
│   │   └── unitOfWork.js
│   ├── routes/
│   │   ├── projectRoutes.js
│   │   └── taskRoutes.js
│   ├── services/
│   │   ├── projectService.js
│   │   └── taskService.js
│   └── utils/
│       ├── AppError.js
│       └── validation.js
└── tests/
    ├── errors.test.js
    ├── integration.test.js
    └── services.test.js
```

`node_modules/` e `.env` são artefatos locais ignorados e não integram a árvore de entrega. O enunciado original foi mantido sem alterações; o conteúdo anterior do README foi preservado em [docs/README-original.md](docs/README-original.md). A nova aplicação está inteiramente em `trabalhos/`, conforme solicitado, sem reorganizar outras pastas.

## Uso de IA

- Ferramenta usada: Codex.
- Apoio: análise do Java, implementação da migração, documentação e testes.
- Revisão humana: pendente; o aluno deve revisar e compreender os arquivos antes da entrega.
- Ajustes realizados pelo aluno: preencher após a revisão, sem atribuir revisões ainda não feitas.

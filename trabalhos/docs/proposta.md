# Proposta — Trabalho Semestral

Arquitetura de Aplicações Web — 2026.2

- **Aluno:** David Silva Ferreira — RA 202504019804.
- **Curso:** Análise e Desenvolvimento de Sistemas.
- **Turma:** 
- **Repositório:** https://github.com/D4vidSF/ra202504019804
- **Projeto:** API Tasks.

## 1. Domínio e problema

API Tasks organiza tarefas de estudo ou trabalho em projetos. Permite registrar atividades, acompanhar seu estado e prioridade e consultar o contexto de cada tarefa. Evolui o domínio do projeto Java `D4vidSF/api-tasks`, preservando seu CRUD e acrescentando organização por projetos.

## 2. Entidades

**Project:** name (nome), description (objetivo), owner (responsável informado, sem autenticação), status (active ou archived). Também possui _id, createdAt e updatedAt.

**Task:** name (nome), description (detalhes), status (pending, in_progress ou completed), priority (low, medium ou high), project (ObjectId do projeto). Também possui _id, createdAt e updatedAt.

Relacionamento **Project 1:N Task**, representado por referência `Task.project`. Cada tarefa pertence a exatamente um projeto; um projeto pode ter zero ou muitas tarefas. Referências permitem CRUD independente, filtragem e transferência de tarefas sem expandir indefinidamente o documento de projeto. Transações e verificações no serviço preservam a integridade.

## 3. Endpoints previstos

| Método | Endpoint | Finalidade |
|---|---|---|
| GET | /projects | Listar projetos |
| GET | /projects/:id | Detalhar projeto |
| POST | /projects | Criar projeto |
| PUT | /projects/:id | Atualizar todos os campos editáveis |
| DELETE | /projects/:id | Excluir projeto vazio |
| GET | /tasks | Listar tarefas; filtro opcional ?project=ObjectId |
| GET | /tasks/:id | Detalhar tarefa |
| POST | /tasks | Criar tarefa |
| PUT | /tasks/:id | Atualizar tarefa, inclusive transferir projeto |
| DELETE | /tasks/:id | Excluir tarefa |
| GET | / | Interface web |
| GET | /swagger/ | Documentação interativa |
| GET | /openapi.json | Especificação OpenAPI |

## 4. Regra de negócio

Um projeto só pode ser arquivado se todas as suas tarefas estiverem concluídas. Projetos arquivados não recebem criação ou edição de tarefas; podem ser reativados. A exclusão de um projeto exige que não haja tarefas vinculadas. Nomes de projetos são únicos e nomes de tarefas são únicos dentro de cada projeto, sem diferenciar maiúsculas/minúsculas.

## 5. Casos de erro

- **400:** campo obrigatório ausente, status/prioridade inválidos, ObjectId inválido ou JSON malformado.
- **404:** registro ou projeto relacionado inexistente.
- **409:** nome duplicado, projeto arquivado impedindo alteração, tentativa de arquivar tarefas abertas ou excluir projeto com tarefas.
- **500:** erro inesperado, sem expor detalhes internos.

Erros usam JSON `{ "erro": "mensagem" }`. A API também limita o tamanho do corpo e retorna 413 quando excedido.

## 6. Stack

Node.js, Express, JavaScript, MongoDB real, Mongoose, dotenv, Swagger/OpenAPI, HTML, CSS e Fetch API. Arquitetura em routes, controllers, services, repositories e models. Jest para testes.

## 7. Bônus pretendidos

- C: testes unitários de serviços com cenários de sucesso e erro.
- D: separação de responsabilidades, injeção de dependências e interfaces pequenas, explicadas no README.
- JWT e RBAC ficam para evolução futura; não são declarados como implementados.

Esta proposta é um artefato técnico para revisão do aluno e do professor; sua criação não representa aprovação do tema.

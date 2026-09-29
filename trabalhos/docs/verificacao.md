# Verificação da implementação

Execução em 28/09/2026, Windows, Node.js 22.23.3 e MongoDB 8.0.13 real em replica set local isolado. Node e MongoDB foram usados em versões portáteis temporárias; não foram instalados globalmente nem como serviços. Nenhum banco preexistente foi utilizado.

| Verificação | Resultado |
|---|---|
| npm install | Sucesso; package-lock.json gerado; auditoria da instalação reportou 0 vulnerabilidades |
| Sintaxe JavaScript | Verificada com node --check |
| npm test com MongoDB de teste | 3 suítes, 30 testes aprovados |
| npm test sem URI de teste | 25 testes unitários aprovados; 5 testes de integração explicitamente ignorados |
| MongoDB | Conexão, índices, transações e persistência em disco verificadas |
| Inicialização | Servidor iniciou e respondeu na porta de teste 3107 |
| Configuração ausente | Servidor encerrou com código 1 e mensagem controlada, sem abrir HTTP |
| CRUD de Project e Task | GET coleção/detalhe, POST, PUT e DELETE verificados por HTTP |
| HTTP | 200, 201 com Location, 204 vazio, 400, 404 e 409 cobertos em integração; 500 seguro coberto em teste unitário |
| Integridade | Duplicidade, relação inexistente, exclusão bloqueada, arquivamento, transferência e concorrência verificados |
| OpenAPI | Documento validado com swagger-parser |
| Swagger UI | 13 operações documentadas renderizadas no Chrome |
| Frontend | CRUD das duas entidades e mensagem de conflito 409 executados no Chrome headless |
| Navegação | Marcador no objeto window permaneceu entre operações, confirmando ausência de recarga completa |
| Layout | Capturas e inspeção visual em 1440×1000 e 390×844; sem transbordamento da página; tabela permite rolagem horizontal no celular |
| JavaScript do navegador | Nenhuma exceção não tratada durante o fluxo validado |
| Git | Alterações restritas a trabalhos/; materiais externos e enunciado DOCX intactos |
| Arquivos ignorados | .env, node_modules, coverage, logs e .local confirmados pelo Git |

Os testes de integração usam MongoDB com arquivos em disco, não mongodb-memory-server. Os testes de concorrência exercitam criação de tarefa versus exclusão do projeto e criação de nomes duplicados. A limpeza automática remove apenas os registros criados pela suíte.

O teste de navegador foi uma verificação pontual com Playwright instalado em pasta temporária, usando o Chrome já instalado. Não acrescenta dependências ao projeto e não integra o comando npm test. As capturas e os scripts temporários ficam em `.local/`, ignorada pelo Git.

## Limites da verificação

- Docker não estava instalado neste ambiente. O compose.yaml foi fornecido para reprodução, mas o comando Docker não foi executado; o MongoDB real usado nos testes foi iniciado diretamente como replica set.
- Atlas não foi utilizado. Exige configuração manual do cluster, usuário, rede e URI.
- Não houve importação do banco PostgreSQL original: foram migradas as funcionalidades, não os dados.
- Não foram realizados testes de carga ou auditoria de segurança completa; autenticação e RBAC não fazem parte desta versão.
- Nenhum commit ou push foi realizado. O histórico acadêmico e a aprovação da proposta dependem do aluno/professor.

## Reprodução

Siga o README para instalar Node.js, preparar MongoDB replica set/Atlas e configurar `.env`. Configure também `MONGODB_TEST_URI` para um banco exclusivo cujo nome termine em `_test` e execute:

```sh
npm install
npm test
npm run test:integration
```

Para conferir a interface, execute `npm run dev`, crie um projeto ativo e uma tarefa, abra detalhes, edite e tente excluir o projeto antes da tarefa (deve receber conflito). Conclua a tarefa, arquive o projeto, exclua a tarefa e depois o projeto. Consulte `/swagger/` para testar diretamente a API.

# Análise e decisões de migração

## Origem inspecionada antes da implementação

- Repositório: https://github.com/D4vidSF/api-tasks
- Branch: `main`; commit: `a5bae9d4478a6dcebb5d5c9fc97a2bf8ad37d1d5`.
- Código Java em `src/main/java/tech/buildrun/api/`.
- Leitura completa dos arquivos de aplicação, teste, configuração e `pom.xml`.
- Java 17, Spring Boot 3.3.5, Spring Web, Spring Data JPA e PostgreSQL.
- O repositório local da disciplina contém exemplos C#/.NET; o Java foi obtido do repositório indicado pelo aluno e inspecionado em cópia temporária, sem alterações.

## O que existia

| Aspecto | Evidência |
|---|---|
| Domínio | Cadastro e gerenciamento de tarefas |
| Entidade | `model/Task.java`: `id` Long gerado, `name`, `description`, `status` String |
| Persistência | `repository/TaskRepository.java`: `JpaRepository<Task, Long>` |
| API | `controller/ApiController.java`: GET coleção/detalhe, POST, PUT e DELETE em `/tasks` |
| Atualização | Substitui name, description e status após localizar o registro |
| Erros existentes | Busca e atualização devolvem 404 quando ID não existe |
| Status HTTP | GET/PUT 200; POST sem 201 explícito; DELETE 200 |
| Regras e validações | Sem obrigatoriedade, enum de status, duplicidade ou transições explícitas |
| Relacionamentos | Nenhum |
| Telas | Nenhuma; somente API |
| Testes | Um teste de inicialização do contexto Spring |

`controller/JsonProcessingException.java` é uma exceção vazia e não é usada pelo controller. Não há justificativa para reproduzi-la. A configuração original do PostgreSQL não foi copiada para a nova aplicação.

## Preservação e adaptações

O CRUD de tarefas, nomes dos campos `name`, `description`, `status` e URLs `/tasks` são preservados conceitualmente. A implementação foi refeita em JavaScript, sem tradução linha a linha.

Como o Java só tem uma entidade com três atributos de domínio, foi acrescentado `Project` (projeto), um agrupador natural das tarefas. `Task` recebeu prioridade e referência obrigatória ao projeto. Os IDs numéricos deram lugar a ObjectIds, e `status` passou a aceitar valores definidos. São mudanças de contrato; esta entrega não transfere dados do PostgreSQL, nem interpreta automaticamente textos livres de status antigos.

As regras de unicidade, restrições ao arquivamento/exclusão de projetos e validações são **novas**, e não regras encontradas no Java. Tarefas podem alternar livremente entre os três estados em projetos ativos, inclusive reabrir tarefas concluídas; o original não definia uma sequência obrigatória.

## Plano aplicado

1. Inventariar o repositório local, preservar README e enunciado existentes e analisar integralmente o Java remoto.
2. Modelar Project e Task com referência 1:N, validação e índices únicos.
3. Implementar Route → Controller → Service → Repository → MongoDB, com schemas Mongoose.
4. Documentar a API com OpenAPI/Swagger e implementar a interface HTML/CSS/Fetch.
5. Criar testes Jest de regras, erros e integração HTTP com MongoDB real.
6. Documentar execução, configuração, limitações e resultados de verificação.

## Integridade entre coleções

MongoDB não impõe chave estrangeira. Os serviços verificam o projeto e usam transações. Toda escrita de tarefa também atualiza uma revisão interna do projeto. Isso faz criação, transferência, arquivamento e exclusão concorrentes disputar o mesmo documento pai, permitindo ao driver repetir transações em conflito. Apenas consultar o pai antes de inserir uma tarefa não evitaria uma exclusão simultânea.

Por isso é necessário MongoDB em replica set (inclusive com um único nó local) ou Atlas. Não existe fallback em memória, JSON ou MongoDB standalone. A configuração Docker fornecida cria um replica set local persistente.

## Materiais preexistentes

O texto original de `trabalhos/README.md` está preservado integralmente em `docs/README-original.md`. O enunciado `.docx` permanece no mesmo local, sem edição. Nenhum arquivo de `aulas/` ou de outro diretório do repositório foi alterado.

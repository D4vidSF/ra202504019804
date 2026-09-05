# HANDOUT — AULA 02

## Dissecando o HTTP

*6 requisições sob o microscópio — Arquitetura de Aplicações Web*

## 🎯 MISSÃO

Vocês interceptaram 6 conversas entre um app e a API de uma biblioteca. Para CADA card:

- Descrevam o que o cliente pediu (verbo + recurso na URI)
- Expliquem o que o status code da resposta informa
- Respondam: repetindo a MESMA requisição 3 vezes seguidas, o estado do servidor muda?

Ao final, preencham juntos a TABELA-SÍNTESE dos verbos na última página.

*⏱️ Tempo: 30 minutos  |  👥 Formato: em duplas  |  Dica: o card 6 esconde uma pegadinha de quem é a culpa.*

> **Nomes:** David Silva Ferreira   **Turma:** ____________________   **Data:** 04 / 09 / 2026

## REQUISIÇÃO 01 — A prateleira inteira

```text"""
→ REQUISIÇÃO
GET /api/livros HTTP/1.1
Host: biblioteca.newton.br
Accept: application/json
```

```text
← RESPOSTA
HTTP/1.1 200 OK
Content-Type: application/json

[ { "id": 1, "titulo": "Clean Code", "autor": "Robert C. Martin" },
  { "id": 7, "titulo": "O Programador Pragmático", "autor": "Hunt & Thomas" } ]
```

**Sua análise:**

1. O que o cliente pediu (verbo + recurso)?

O cliente realizou uma consulta no sistema da biblioteca.

2. O que o status code informa? Deu certo? Culpa de quem se não deu?

Sucesso, codigo 200.

3. Repetindo esta requisição 3 vezes seguidas, o estado do servidor muda? E a resposta?

Nenhum dos dois muda.

## REQUISIÇÃO 02 — O livro fantasma

```text
→ REQUISIÇÃO
GET /api/livros/99 HTTP/1.1
Host: biblioteca.newton.br
Accept: application/json
```

```text
← RESPOSTA
HTTP/1.1 404 Not Found
Content-Type: application/problem+json

{ "title": "Not Found", "status": 404 }
```

**Sua análise:**

1. O que o cliente pediu (verbo + recurso)?

O cliente tentou realizar uma consulta na API da biblioteca.

2. O que o status code informa? Deu certo? Culpa de quem se não deu?

A requisição retornou um erro do lado do cliente. A requisição foi enviada errada ou está faltando alguma informação.

3. Repetindo esta requisição 3 vezes seguidas, o estado do servidor muda? E a resposta?

A requisição retornou o erro 404, indicando que o livro solicitado não foi encontrado.

## REQUISIÇÃO 03 — Livro novo na estante

```text
→ REQUISIÇÃO
POST /api/livros HTTP/1.1
Host: biblioteca.newton.br
Content-Type: application/json

{ "titulo": "Domain-Driven Design", "autor": "Eric Evans" }
```

```text
← RESPOSTA
HTTP/1.1 201 Created
Location: /api/livros/8
Content-Type: application/json

{ "id": 8, "titulo": "Domain-Driven Design", "autor": "Eric Evans" }
```

**Sua análise:**

1. O que o cliente pediu (verbo + recurso)?

O cliente cadastrou um novo livro no sistema. 

2. O que o status code informa? Deu certo? Culpa de quem se não deu?

Sim a operação foi bem sucedida 

3. Enviando este POST 3 vezes seguidas, o que acontece na estante? Para que serve o header Location?

Sim muda, irá cadastrar o mesmo livro 3 vezes com IDs diferente.

## REQUISIÇÃO 04 — Corrigindo a ficha completa

```text
→ REQUISIÇÃO
PUT /api/livros/7 HTTP/1.1
Host: biblioteca.newton.br
Content-Type: application/json

{ "id": 7, "titulo": "O Programador Pragmático", "autor": "D. Hunt; D. Thomas" }
```

```text
← RESPOSTA
HTTP/1.1 200 OK
Content-Type: application/json

{ "id": 7, "titulo": "O Programador Pragmático", "autor": "D. Hunt; D. Thomas" }
```

**Sua análise:**

1. O que o cliente pediu (verbo + recurso)?

Cliente atualizou uma linha de ID 7.

2. O que o status code informa? Deu certo? Culpa de quem se não deu?

Sim, a operação foi bem-sucedida.

3. Repetindo esta requisição 3 vezes seguidas, o estado do servidor muda? E a resposta?

Não muda.

## REQUISIÇÃO 05 — Fora do catálogo

```text
→ REQUISIÇÃO
DELETE /api/livros/7 HTTP/1.1
Host: biblioteca.newton.br
```

```text
← RESPOSTA
HTTP/1.1 204 No Content
```

**Sua análise:**

1. O que o cliente pediu (verbo + recurso)?

Pediu para deletar uma linha.

2. O que o status code informa? Deu certo? Culpa de quem se não deu?

Sim a operação foi bem sucedida 

3. Repetindo o DELETE, o estado do servidor muda? Que resposta você ESPERA na segunda vez?

Ele irá retornar um erro falando que não existe nenhum registro com esse ID que o cliente passou.

## REQUISIÇÃO 06 — O cadastro capenga

```text
→ REQUISIÇÃO
POST /api/livros HTTP/1.1
Host: biblioteca.newton.br
Content-Type: application/json

{ "autor": "Anônimo" }
```

```text
← RESPOSTA
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json

{ "title": "Bad Request", "status": 400,
  "errors": { "Titulo": [ "O campo Titulo é obrigatório" ] } }
```

**Sua análise:**

1. O que o cliente pediu (verbo + recurso)?

Para criar uma nova linha(livro).

2. O que o status code informa? Deu certo? Culpa de quem se não deu?

Enquanto o cliente não adicionar todos os parâmetros obrigatórios do POST, sempre retornará o mesmo erro.

3. Repetindo esta requisição 3 vezes seguidas, o estado do servidor muda? E a resposta?

Enquanto o cliente não adicionar todos os parâmetros obrigatórios do POST, sempre retornará o mesmo erro.

## TABELA-SÍNTESE — Os verbos do HTTP

*Preencham com base nos 6 cards. “Seguro” = não altera nada no servidor. “Idempotente” = repetir N vezes deixa o servidor no mesmo estado que 1 vez.*

| **Verbo**    | **Para que serve**                           | **Seguro?** | **Idempotente?** | **Status típicos**                               |
| ------------ | -------------------------------------------- | ----------- | ---------------- | ------------------------------------------------ |
| **`GET`**    | Consultar/obter um recurso                   | Sim         | Sim              | `200 OK`, `404 Not Found`                        |
| **`POST`**   | Criar um novo recurso ou executar uma ação   | Não         | Não              | `201 Created`, `400 Bad Request`, `409 Conflict` |
| **`PUT`**    | Criar ou substituir completamente um recurso | Não         | Sim              | `200 OK`, `201 Created`, `204 No Content`        |
| **`PATCH`**  | Alterar parcialmente um recurso              | Não         | Depende          | `200 OK`, `204 No Content`, `400 Bad Request`    |
| **`DELETE`** | Excluir um recurso                           | Não         | Sim              | `204 No Content`, `404 Not Found`                |

## DESAFIO

1. O verbo PATCH não apareceu em nenhum card. Qual a diferença entre PATCH e PUT? Um app de banco quer alterar SÓ o apelido do usuário, entre dezenas de campos do perfil — qual dos dois você usaria e por quê?

PUT substitui o recurso inteiro, enquanto PATCH permite alterar apenas uma parte dele. Para alterar somente o apelido do usuário, eu usaria PATCH, pois não é necessário enviar ou substituir os demais campos do perfil.
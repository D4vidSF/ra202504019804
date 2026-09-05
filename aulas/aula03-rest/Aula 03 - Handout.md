# HANDOUT — AULA 03

## Consultoria de Design: a API da EscolaTech

*Identifique os anti-padrões e proponha o redesenho — Arquitetura de Aplicações Web*

## 🎯 MISSÃO

A EscolaTech contratou a consultoria de vocês para auditar a API do sistema escolar. Todos os endpoints abaixo FUNCIONAM e estão em produção — mas o time novo se recusa a mexer neles. Para CADA endpoint:

- Identifiquem o(s) problema(s) de design (pode haver mais de um!)
- Proponham o redesenho: método HTTP + rota + status codes corretos

*⏱️ Tempo: 25 minutos  |  👥 Formato: em duplas  |  Dica: se a rota conta o que faz em português, algo está errado.*

> **Nomes:** David Silva Ferreira   **Turma:** ____________________   **Data:** 04 / 09 / 2026

## ENDPOINT 01 — POST /api/getAlunos

**Documentação atual (extraída da wiki da EscolaTech):**

```text
POST /api/getAlunos
Retorna TODOS os alunos cadastrados (hoje: 12.482 registros).
Resposta: 200 OK + array JSON completo (~9 MB).
Obs. da wiki: "usar POST porque GET não estava funcionando".
```

1. Qual(is) problema(s) de design vocês identificam?

Primeiro erro, POST não realiza nenhum tipo de consulta.
Segundo erro seria a nomeclatura getAlunos, ela causa uma grande confusão.
Terceiro se a API não estiver preparada, provavelemente vai acontecer algum tipo de loop, pois não foi passado o ID.
E a resposta da requisição está errada. 

2. Seu redesenho (método + rota + status codes):

GET /API/Alunos/{ID}

## ENDPOINT 02 — GET /deletarAluno?id=7

**Documentação atual (extraída da wiki da EscolaTech):**

```text
GET /deletarAluno?id=7
Remove o aluno do banco de dados.
Resposta: 200 OK + "OK" (mesmo se o aluno não existir).
Obs. da wiki: "dá pra deletar pelo navegador, bem prático".
```

1. Qual(is) problema(s) de design vocês identificam?

1- GET serve para consutlar, para deletar é DELETE
2- erro seria a nomeclatura DeleteAlunos, ela causa uma grande confusão.
3- A URL foi montada incorretamente, não teria essa ? e falta /API.
4- falta um parametro de identificação para a API saber qual aluno você deseja deletar
5- A resposta esta incorreta, deveria retornar erro 404

2. Seu redesenho (método + rota + status codes):

DELETE /API/Aluno/7
Resposta: HTTP/1.1 200 OK

## ENDPOINT 03 — POST /api/alunos (criação)

**Documentação atual (extraída da wiki da EscolaTech):**

```text
POST /api/alunos
Body: { "nome": "...", "curso": "..." }
Cria o aluno e responde: 200 OK + body "OK".
O app precisa buscar a lista inteira de novo para descobrir o ID gerado.
```

1. Qual(is) problema(s) de design vocês identificam?

1- A API não informa ao aplicativo qual foi o ID gerado para o novo aluno. Por isso, o aplicativo precisa buscar a lista inteira novamente para descobrir o ID.
2- O ideal é que a própria resposta da criação retorne os dados do aluno criado, incluindo seu ID.

2. Seu redesenho (método + rota + status codes):

POST /api/alunos
{
    "nome": "David",
    "curso": "Análise e Desenvolvimento de Sistemas"
}
201 Created
{
    "id": 25,
    "nome": "David",
    "curso": "Análise e Desenvolvimento de Sistemas"
}

## ENDPOINT 04 — GET /escolas/1/turmas/3/alunos/25/matriculas/88/disciplinas/12

**Documentação atual (extraída da wiki da EscolaTech):**

```text
GET /escolas/1/turmas/3/alunos/25/matriculas/88/disciplinas/12
Retorna os dados da disciplina 12 da matrícula 88.
Para montar a URL o app precisa conhecer 5 IDs diferentes.
Resposta: 200 OK + JSON da disciplina.
```

1. Qual(is) problema(s) de design vocês identificam?

1-O principal problema é que a URL está excessivamente complexa e aninhada.
2-Para acessar uma disciplina, o aplicativo precisa conhecer vários IDs diferentes: escola, turma, aluno, matrícula e disciplina.
3-Isso torna a API difícil de utilizar e aumenta a quantidade de informações que o aplicativo precisa conhecer para realizar uma consulta.
4-A rota deveria ser mais simples e utilizar apenas o recurso necessário para identificar a disciplina.

2. Seu redesenho (método + rota + status codes):

GET /api/disciplinas/12
Resposta:200 OK
Se a disciplina não existir:404 Not Found

## ENDPOINT 05 — GET /api/alunos/7/matriculas (erro)

**Documentação atual (extraída da wiki da EscolaTech):**

```text
GET /api/alunos/7/matriculas
Se o aluno 7 não existe, responde:
200 OK + "<html><b>Erro: aluno nao existe!</b></html>"
O app mobile quebra tentando fazer parse do JSON.
```

1. Qual(is) problema(s) de design vocês identificam?

O principal problema é que a API retorna 200 OK mesmo quando ocorre um erro.

1-Além disso, a resposta é retornada em HTML, enquanto o aplicativo espera receber JSON. 2-Isso faz com que o aplicativo mobile quebre ao tentar interpretar a resposta.
3-Quando o aluno não existir, a API deveria retornar o status HTTP adequado e uma resposta em JSON.

2. Seu redesenho (método + rota + status codes):

GET /api/alunos/7/matriculas
Se o aluno existir:200 OK
Se o aluno não existir:404 Not Found
Resposta:
{
    "erro": "Aluno não encontrado"
}

## ENDPOINT 06 — PUT /api/atualizarNotaParcial?aluno=7&disc=12&nota=8.5

**Documentação atual (extraída da wiki da EscolaTech):**

```text
PUT /api/atualizarNotaParcial?aluno=7&disc=12&nota=8.5
Atualiza SÓ a nota parcial da disciplina, sem body.
Todos os dados vão na query string.
Resposta: 200 OK + "OK".
```

1. Qual(is) problema(s) de design vocês identificam?

1-O principal problema é que a rota está descrevendo uma ação, atualizarNotaParcial, em vez de representar um recurso.
2-Outro problema é que todos os dados da atualização estão sendo enviados pela query string. Para uma alteração de dados, o ideal é enviar as informações no body da requisição.
3-Além disso, a rota possui muitos parâmetros na URL, tornando a utilização da API menos organizada.

2. Seu redesenho (método + rota + status codes):

PUT /api/alunos/7/disciplinas/12/nota
Body:
{
    "nota": 8.5
}
Resposta:200 OK

## DESAFIO

1. A EscolaTech quer lançar mudanças na API sem quebrar o app mobile antigo, que não recebe atualização há 2 anos. Que decisão de design — que falta na API INTEIRA — resolve esse problema? Como ficariam as rotas?

A EscolaTech quer lançar mudanças na API sem quebrar o app mobile antigo, que não recebe atualização há 2 anos. Que decisão de design — que falta na API INTEIRA — resolve esse problema? Como ficariam as rotas?

A decisão seria utilizar versionamento da API.

Dessa forma, a versão antiga da API poderia continuar funcionando para o aplicativo mobile antigo, enquanto uma nova versão poderia receber as alterações e melhorias.

Por exemplo:

API atual:
/api/v1/alunos
/api/v1/alunos/7
/api/v1/alunos/7/matriculas
Nova versão:
/api/v2/alunos
/api/v2/alunos/7
/api/v2/alunos/7/matriculas

Assim, o aplicativo antigo continuaria utilizando a v1, enquanto novos aplicativos poderiam utilizar a v2.

Resumo: o versionamento permite evoluir a API sem quebrar os clientes que ainda utilizam versões antigas.
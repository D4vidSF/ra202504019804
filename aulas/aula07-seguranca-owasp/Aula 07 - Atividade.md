# HANDOUT — AULA 07

## Caça às Vulnerabilidades

*Revisão de segurança de uma API .NET — Arquitetura de Aplicações Web*

## 🎯 MISSÃO

Vocês são a dupla de revisores de segurança da empresa. Os 4 trechos abaixo são da MESMA API, prestes a ir para produção. Para CADA card:

- Descrevam a falha com as próprias palavras (não precisa do nome técnico ainda)
- Estimem o dano possível se isso chegar à produção
- Proponham a correção

*⏱️ Tempo: 30 minutos  |  👥 Formato: em duplas  |  Todo o código é fictício e roda apenas no laboratório.*

> **Nomes:** David Silva Ferreira   **Turma:** ____________________   **Data:** 17 / 09 / 2026

## VULNERABILIDADE 01 — A busca de clientes

> `GET /api/clientes/buscar?nome=...`

Endpoint de busca usado pela tela de atendimento. O parâmetro nome vem direto da caixa de busca do site.

```text
 1  [HttpGet("buscar")]
 2  public IActionResult Buscar(string nome)
 3  {
 4      var sql = "SELECT * FROM Clientes WHERE Nome = '"
 5                + nome + "'";
 6      var clientes = _db.Clientes.FromSqlRaw(sql).ToList();
 7      return Ok(clientes);
 8  }
```

**Sua análise:**

1. Qual é a falha?

O valor recebido no parâmetro nome é colocado diretamente dentro da consulta SQL. Dessa forma, um usuário pode enviar comandos SQL no campo de busca e alterar o comportamento da consulta.

2. Qual o dano possível em produção?

Um atacante poderia conseguir acessar dados que não deveria, consultar informações de outros clientes ou, dependendo das permissões do banco, até alterar ou excluir informações. Isso pode causar vazamento de dados e comprometer o banco de dados.

3. Como corrigir?

Não devemos montar a consulta concatenando strings recebidas do usuário. É necessário utilizar consultas parametrizadas ou os recursos do Entity Framework, permitindo que o valor pesquisado seja tratado como dado e não como código SQL.

## VULNERABILIDADE 02 — A consulta de faturas

> `GET /api/faturas/{id}`

Endpoint usado pelo app para exibir a fatura do cartão. O usuário está autenticado quando chama esta rota.

```text
 1  [HttpGet("{id}")]
 2  public IActionResult GetFatura(int id)
 3  {
 4      var fatura = _db.Faturas.Find(id);
 5      if (fatura == null) return NotFound();
 6      return Ok(fatura);
 7  }
```

**Sua análise:**

1. Qual é a falha?

O sistema busca a fatura apenas pelo id informado na URL. Apesar de o usuário estar autenticado, não existe nenhuma verificação para confirmar se aquela fatura realmente pertence ao usuário que fez a requisição.Por exemplo, um usuário poderia tentar acessar /api/faturas/123 e depois /api/faturas/124 para tentar visualizar faturas de outras pessoas.

2. Qual o dano possível em produção?

Pode ocorrer acesso indevido a informações financeiras de outros usuários, como valores, dados da fatura e outras informações pessoais. Isso representa um vazamento de dados e uma falha de autorização.

3. Como corrigir?

Além de verificar se o usuário está autenticado, a API deve verificar se ele tem permissão para acessar aquela fatura.
A consulta deve considerar o usuário autenticado, por exemplo:

var usuarioId = User.FindFirst("sub")?.Value;
var fatura = _db.Faturas
    .FirstOrDefault(f => f.Id == id && f.UsuarioId == usuarioId);

Assim, mesmo que o usuário descubra o ID de outra fatura, não conseguirá acessá-la.

## VULNERABILIDADE 03 — A configuração do servidor

> `Program.cs (roda igual em dev e em produção)`

Trecho de inicialização da API, idêntico em todos os ambientes. Este arquivo está versionado no Git da empresa.

```text
 1  public const string Conn =
 2      "Server=prod-db;Database=Banco;User=sa;" +
 3      "Password=Newton@2026!";
 4
 5  var app = WebApplication.CreateBuilder(args).Build();
 6  app.UseDeveloperExceptionPage();
 7  app.Run();
```

**Sua análise:**

1. Qual é a falha?

A senha e as informações de acesso ao banco de produção estão escritas diretamente no código e versionadas no Git. Além disso, a página de exceções de desenvolvimento está habilitada.
Isso significa que informações sensíveis podem ficar expostas no código-fonte e mensagens detalhadas de erro podem ser exibidas em produção.

2. Qual o dano possível em produção?

Se alguém obtiver acesso ao repositório, poderá descobrir as credenciais do banco de dados. Com essas credenciais, o atacante pode tentar acessar, alterar ou apagar informações do banco.

A página de erros detalhados também pode revelar informações internas da aplicação, como caminhos de arquivos, consultas ou detalhes da infraestrutura.

3. Como corrigir?

As credenciais não devem ficar diretamente no código nem no Git. Devem ser armazenadas em variáveis de ambiente, Secret Manager ou outro mecanismo seguro de gerenciamento de segredos.

Também deve ser utilizado tratamento de erros apropriado para produção, sem exibir detalhes internos ao usuário.

Além disso, como essa senha já está exposta no código, ela deve ser considerada comprometida e trocada.

## VULNERABILIDADE 04 — A atualização de perfil

> `PUT /api/usuarios/{id}`

Endpoint que o app chama quando o usuário edita o próprio perfil. O corpo da requisição é o JSON enviado pelo cliente.

```text
 1  public class UsuarioUpdate
 2  {
 3      public string Nome  { get; set; }
 4      public string Email { get; set; }
 5      public string Role  { get; set; }   // "user" | "admin"
 6  }
 7
 8  [HttpPut("{id}")]
 9  public IActionResult Atualizar(int id, UsuarioUpdate dto)
10  {
11      _repo.AtualizarTudo(id, dto);
12      return NoContent();
13  }
```

**Sua análise:**

1. Qual é a falha?

O cliente pode enviar o campo Role no JSON e o sistema utiliza o objeto recebido para atualizar todos os dados do usuário.

Assim, um usuário comum poderia tentar enviar:

{
    "Nome": "David",
    "Email": "david@email.com",
    "Role": "admin"
}

Se o método aceitar esse valor, o próprio usuário poderia tentar transformar sua conta em administrador.

2. Qual o dano possível em produção?

Um usuário comum poderia conseguir privilégios administrativos. Com isso, poderia acessar funcionalidades e informações que deveriam estar disponíveis somente para administradores.

O impacto pode ser muito grande, pois uma conta comum poderia passar a ter acesso a recursos privilegiados da aplicação.

3. Como corrigir?

O campo Role não deve ser atualizado pelo endpoint de edição do próprio perfil.

O DTO poderia conter somente os campos que o usuário tem permissão para alterar:

public class UsuarioUpdate
{
    public string Nome { get; set; }
    public string Email { get; set; }
}

A alteração de Role deveria ser feita por um endpoint específico, com autorização adequada, destinado somente a administradores.

Também é importante validar no servidor quais campos cada usuário pode modificar, sem confiar nos dados enviados pelo cliente.

## DESAFIO

1. Qual das 4 falhas um scanner automático de código teria MAIS dificuldade de encontrar? Por quê?

A Vulnerabilidade 02 provavelmente seria a mais difícil de identificar corretamente por um scanner automático, porque o código não possui um erro evidente de sintaxe ou uma construção claramente perigosa.

O problema está na regra de autorização: o usuário está autenticado, mas o sistema não verifica se a fatura pertence a ele.

Um scanner pode identificar que existe uma rota que recebe um id, mas compreender que aquele id precisa ser relacionado ao usuário autenticado depende do contexto da aplicação e das regras de negócio.

Resumo:

Vulnerabilidade	Problema principal
01	Entrada do usuário sendo usada diretamente na SQL
02	Usuário autenticado pode acessar recurso de outro usuário
03	Credenciais expostas e erros detalhados em produção
04	Usuário pode tentar alterar um campo que não deveria controlar
Mais difícil para scanner	02 — falha de autorização baseada na regra de negócio
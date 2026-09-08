1. POST /api/v1/getPets

Comportamento: Retorna os 50 primeiros pets (leitura de dados).

Regra REST Violada: O método POST está sendo usado para consulta e há um verbo (getPets) na URI. No REST, as URIs devem ser substantivos.

Como Redesenhar: GET /api/v1/pets

2. GET /api/v1/deletarPet?id=7

Comportamento: Exclui o pet do sistema e devolve uma mensagem.

Regra REST Violada: O método GET deve ser seguro e idempotente, ou seja, nunca deve alterar ou excluir dados no servidor. Além disso, há um verbo na URI.

Como Redesenhar: DELETE /api/v1/pets/{id}

3. GET /api/v1/pet/{id:int}

Comportamento: Retorna a ficha de um pet.

Regra REST Violada: Uso do substantivo no singular. Coleções de recursos devem ser sempre representadas no plural para manter a consistência com outras rotas.

Como Redesenhar: GET /api/v1/pets/{id}

4. GET /api/v1/banhosTosa e GET /api/v1/tutores_vip

Comportamento: Retorna listas paginadas de banhos e de tutores VIPs.

Regra REST Violada: Falta de padronização (uma usa camelCase e a outra snake_case). Além disso, "vip" é um status ou filtro aplicado a um tutor, e não uma coleção raiz separada.

Como Redesenhar: GET /api/v1/banhos-tosas (usando kebab-case) e GET /api/v1/tutores?vip=true.

5. POST /api/v1/pets

Comportamento: Cadastra um pet e retorna 200 OK com o objeto criado.

Regra REST Violada: A criação bem-sucedida de um recurso deve retornar o código de status 201 Created e obrigatoriamente incluir o cabeçalho Location informando a URI do novo recurso.

Como Redesenhar: Retornar 201 Created anexando o header Location: /api/v1/pets/{id}.

6. GET /api/v1/pets/{id:int} (caso não exista)

Comportamento: Retorna 200 OK com um objeto contendo erro: "Pet nao encontrado".

Regra REST Violada: Mascaramento de status. O HTTP já possui semântica própria para isso. Se o recurso não existe, a requisição não foi um "OK".

Como Redesenhar: Retornar o status code 404 Not Found.

7. GET /api/pets

Comportamento: Retorna os pets, mas o contrato foi alterado internamente de nome para nomeDoPet, quebrando o app antigo.

Regra REST Violada: Não há versionamento na URI. Alterações estruturais no contrato quebram a retrocompatibilidade de sistemas clientes.

Como Redesenhar: Inserir a versão na URI. A versão nova seria GET /api/v2/pets e a v1 original deveria ser mantida sem alterações.

8. GET /api/v1/petshops/.../consultas/.../exames/{exameId}

Comportamento: Busca um exame através de 5 níveis de IDs.

Regra REST Violada: Aninhamento profundo excessivo (Over-nesting). O cliente é forçado a descobrir vários IDs pai sem necessidade, dificultando o consumo.

Como Redesenhar: Acessar o recurso pela via mais direta possível: GET /api/v1/exames/{exameId}.

9. GET /api/v1/consultas

Comportamento: Devolve o banco de dados de consultas inteiro na mesma resposta.

Regra REST Violada: Ausência de paginação em coleções infinitas. Isso consome recursos do servidor, onera a rede e pode derrubar a API.

Como Redesenhar: Exigir e aplicar paginação, por exemplo: GET /api/v1/consultas?page=1&size=20.

10. PUT /api/v1/pets/{id}/vacinas

Comportamento: Acrescenta uma vacina à ficha do animal cada vez que é disparado.

Regra REST Violada: O método PUT deve ser idempotente (substituir o recurso inteiro). Se a ação apenas anexa/adiciona novos itens à lista a cada chamada, ela não é idempotente.

Como Redesenhar: Mudar para POST /api/v1/pets/{id}/vacinas (para adicionar) ou garantir que o PUT envie a lista de vacinas completa, reescrevendo-a.

11. POST /api/v1/sessao e GET /api/v1/meus-pets

Comportamento: O login salva o usuário logado em uma variável estática _usuarioDaVez na memória do servidor.

Regra REST Violada: Viola a restrição básica do Statelessness (Ausência de Estado). O servidor jamais deve reter a sessão do cliente.

Como Redesenhar: O login deve devolver um token (como um JWT). As próximas requisições do cliente devem enviar esse token através do header Authorization.

12. GET /api/v1/tabela-de-precos

Comportamento: Insere os cabeçalhos no-store, no-cache para uma tabela de preços que só muda anualmente.

Regra REST Violada: Subutilização das mecânicas de Cache do protocolo HTTP.

Como Redesenhar: Aplicar um cabeçalho Cache-Control permissivo (como public, max-age=31536000) e utilizar o ETag para que os clientes evitem baixar a mesma tabela dezenas de vezes.
# HANDOUT — AULA 05

## Escolha o Banco

*Persistência em arquiteturas distribuídas — Arquitetura de Aplicações Web*

## 🎯 MISSÃO

Vocês são o time de arquitetura de dados contratado pelas 4 empresas abaixo. Para CADA cenário:

- Escolham o modelo de banco: relacional, documento, chave-valor ou grafo
- Justifiquem com pelo menos 2 fatores do contexto (estrutura dos dados, padrão de acesso, escala, consistência...)
- Apontem o principal risco da escolha de vocês

*⏱️ Tempo: 25 minutos  |  👥 Formato: em duplas  |  Não existe resposta única — o que vale é a justificativa.*

> **Nomes:** David Silva Ferreira   **Turma:** ____________________   **Data:** 03 / 09 / 2026

## CENÁRIO 01 — TechStore — o catálogo camaleão

E-commerce com 80 mil produtos. Cada categoria tem atributos completamente diferentes: livro tem autor e número de páginas; notebook tem RAM e CPU; camiseta tem tamanho e cor.

- A cada categoria nova, o time faz ALTER TABLE e a tabela produtos já tem 92 colunas (a maioria NULL)
- O produto é quase sempre lido INTEIRO, de uma vez, para montar a página
- Novos atributos surgem toda semana — o marketing não espera o DBA
- Relatórios cruzando categorias são raros

**Sua análise:**

1. Modelo recomendado:   ✔️ Relacional     ☐ Documento     ☐ Chave-valor     ☐ Grafo

2. Justificativa (mínimo 2 fatores do contexto):

Eu utilizaria um modelo relacional com tabelas separadas para produtos, categorias e atributos. A tabela produto teria apenas os dados comuns e uma FK para categoria. Os atributos específicos de cada categoria seriam armazenados em uma tabela relacionada, juntamente com seus valores para cada produto. Dessa forma, novos atributos podem ser adicionados sem precisar alterar a estrutura da tabela produto ou fazer ALTER TABLE toda semana.

3. Principal risco da escolha:

Como os atributos ficam espalhados em várias tabelas, para montar um produto completo será necessário fazer JOINs ou várias consultas. Isso pode deixar a busca mais complexa e, em grande escala, prejudicar a performance.

## CENÁRIO 02 — MegaCart — o carrinho da Black Friday

Serviço de carrinho de compras de um varejista gigante. Na Black Friday são milhões de leituras e escritas por minuto.

- O acesso é SEMPRE pela chave: “carrinho do cliente 12345” — nunca por busca ou filtro
- Todo carrinho expira automaticamente em 48h (TTL)
- Latência precisa ser de poucos milissegundos
- Perder um carrinho é chato, mas NÃO é tragédia — o cliente remonta

**Sua análise:**

1. Modelo recomendado:   ☐ Relacional     ☐ Documento     ✔️ Chave-valor     ☐ Grafo

2. Justificativa (mínimo 2 fatores do contexto):

O acesso ao carrinho é sempre feito por uma chave específica, como carrinho:12345, o que combina com o modelo. 
Além disso, o sistema precisa suportar milhões de operações por minuto com latência de poucos milissegundos e os carrinhos possuem expiração automática de 48h (TTL), recurso comum nesse tipo de banco.

3. Principal risco da escolha:

O principal risco é a menor capacidade para consultas complexas e relacionamentos, já que os dados são acessados principalmente pela chave e não possuem a flexibilidade de um banco relacional para filtros e JOINs.

## CENÁRIO 03 — PayBank — dinheiro não pode evaporar

Módulo de transferências de um banco. Uma transferência debita uma conta e credita outra — as duas operações têm que acontecer JUNTAS ou nenhuma acontece.

- Consistência forte exigida por lei — saldo errado é multa do Banco Central
- Auditoria cruza contas, clientes, agências e transações em relatórios complexos (joins)
- O esquema dos dados é estável há 10 anos
- Volume alto, mas previsível

**Sua análise:**

1. Modelo recomendado:   ✔️ Relacional     ☐ Documento     ☐ Chave-valor     ☐ Grafo

2. Justificativa (mínimo 2 fatores do contexto):

O modelo que eu recomendaria seria o relacional, pois ele é adequado pois exige consistência forte e transações ACID, garantindo que o débito e o crédito aconteçam juntos ou nenhum dos dois aconteça. 
Além disso, a auditoria precisa realizar JOINs entre contas, clientes, agências e transações, algo em que bancos relacionais são muito eficientes. O esquema também é estável, não havendo necessidade de grande flexibilidade.

3. Principal risco da escolha:

O principal risco é a dificuldade de escalar horizontalmente caso o volume de operações cresça muito, já que manter consistência e transações entre diferentes servidores pode se tornar complexo e eventualmente caro para manter. 

## CENÁRIO 04 — FriendLink — amigos dos seus amigos

Rede social profissional em que o produto principal é a indicação: “pessoas que você talvez conheça” e “quem pode te apresentar à empresa X”.

- As consultas dominantes percorrem RELACIONAMENTOS: amigos dos amigos, caminhos de indicação com até 6 níveis
- Em banco relacional, cada nível vira um self-join — com 6 níveis a consulta já não responde
- Os dados de perfil são simples; o valor está nas CONEXÕES
- O grafo cresce milhões de arestas por dia

**Sua análise:**

1. Modelo recomendado:   ☐ Relacional     ☐ Documento     ☐ Chave-valor     ✔️ Grafo

2. Justificativa (mínimo 2 fatores do contexto):

O modelo de grafo é ideal porque as principais consultas percorrem relacionamentos entre pessoas, como amigos dos amigos e caminhos de indicação. Além disso, evita a necessidade de vários self-joins do banco relacional e é mais adequado para trabalhar com milhões de conexões.

3. Principal risco da escolha:

O principal risco é a complexidade e o custo de manutenção do grafo em grande escala, já que ele cresce milhões de relacionamentos por dia.

## DESAFIO

1. Escolha um dos cenários e responda: se a rede particionar (metade dos servidores não enxerga a outra metade), o que o sistema deve fazer — parar de responder para não errar, ou continuar respondendo mesmo arriscando dados desatualizados? Qual letra do CAP vocês sacrificariam e por quê?

Eu escolheria o Cenário 03, transferências bancárias, em caso de particionamento, o sistema deve parar de responder às operações que não puder garantir com segurança. Nesse caso, sacrificamos a Disponibilidade (A) em favor da Consistência (C), pois é obrigatório evitar saldos incorretos ou transferências realizadas apenas parcialmente. É melhor ficar temporariamente indisponível do que permitir dados inconsistentes.
CP — sacrifica a Disponibilidade (A) para garantir a Consistência (C).
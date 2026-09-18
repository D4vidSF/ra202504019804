# Atividade — AULA 06

## Síncrono ou Assíncrono?

*Análise de fluxos de comunicação entre serviços — Arquitetura de Aplicações Web*

## 🎯 MISSÃO

Vocês são os arquitetos dos 4 fluxos abaixo. Para CADA cenário:

- Decidam o estilo de comunicação: síncrono (request/response), assíncrono (fila/evento) ou API Gateway/BFF
- Desenhem o fluxo com caixas (serviços) e setas (chamadas/mensagens) no espaço indicado
- Justifiquem com pelo menos 2 fatores (urgência da resposta, tolerância a atraso, picos, falhas...)
- Apontem o principal risco da escolha de vocês

*⏱️ Tempo: 25 minutos  |  👥 Formato: em duplas  |  Não existe resposta única — o que vale é a justificativa.*

> **Nomes:** David Silva Ferreira   **Turma:** ____________________   **Data:** 18 / 09 / 2026

## CENÁRIO 01 — PagFácil — aprovar ou negar AGORA

No checkout do PagFácil, ao clicar em “Pagar”, o serviço de Pagamentos precisa consultar o saldo/limite do cliente no serviço de Contas — e a resposta define se a venda acontece neste exato momento.

- O cliente está na tela, esperando o resultado da compra
- Sem a resposta de Contas, não há decisão possível: aprovar às cegas é proibido
- Tempo de resposta do serviço de Contas: ~80 ms em condições normais

**Sua análise:**

1. Estilo recomendado:   ✔️ Síncrono      ☐ Assíncrono (fila/evento)      ☐ API Gateway/BFF

2. Desenhe o fluxo (caixas = serviços, setas = chamadas/mensagens):

[Cliente/App] ---> (HTTP/REST) ---> [Serviço de Pagamentos] ---> (HTTP/REST) ---> [Serviço de Contas]
     |                                        |                                        |
     |<------------------- (Resposta) --------|<------------------- (Saldo/OK) ---------|

3. Justificativa (mínimo 2 fatores):

Urgência da resposta: O usuário está aguardando na tela o feedback imediato se a compra foi aprovada ou recusada.
Consistência imediata (Bloqueante): É proibido aprovar "às cegas". A validação de saldo/limite é dependência direta da transação, exigindo bloqueio da requisição até a confirmação.

4. Principal risco da escolha:

Acoplamento temporal / Ponto único de falha: Se o Serviço de Contas ficar fora do ar ou lento, o Serviço de Pagamentos fica travado, causando timeouts e impossibilitando todas as vendas no checkout.

## CENÁRIO 02 — CadastraJá — o e-mail de boas-vindas

Após criar a conta no CadastraJá, o sistema envia um e-mail de boas-vindas. O provedor de e-mail às vezes demora 8 segundos para responder e falha em 2% das tentativas.

- O usuário quer começar a usar o app imediatamente após o cadastro
- O e-mail chegar 1 minuto depois não incomoda ninguém
- Se o provedor falhar, o envio deve ser tentado de novo — sem o usuário perceber

**Sua análise:**

1. Estilo recomendado:   ☐ Síncrono      ✔️ Assíncrono (fila/evento)      ☐ API Gateway/BFF

2. Desenhe o fluxo (caixas = serviços, setas = chamadas/mensagens):

[Usuário] ---> (HTTP) ---> [Serviço de Cadastro] ---> (Publica mensagem) ---> [ Fila de E-mails ]
                                   |                                                |
                            (Retorna Sucesso)                                (Consome mensagem)
                                   v                                                v
                            [Tela de Login]                                 [Worker de E-mail]
                                                                                    |
                                                                                    v
                                                                          [Provedor Externo]

3. Justificativa (mínimo 2 fatores):

Tolerância a atraso (Baixo acoplamento temporal): O e-mail não precisa ser entregue no exato segundo da criação da conta, permitindo liberar a navegação do usuário imediatamente.

Resiliência e retentativas (Retry): Como o provedor falha em 2% dos casos e demora até 8s, a fila reprocessa o envio em segundo plano via worker, sem travar o cadastro nem impactar a experiência do usuário.

4. Principal risco da escolha:

Complexidade técnica e reentrância: Risco de inconsistência eventual ou envio de e-mails duplicados caso o consumidor processe a mesma mensagem mais de uma vez sem controle.

## CENÁRIO 03 — MegaMarket — baixa de estoque nos picos

No marketplace MegaMarket, cada venda gera uma baixa no serviço de Estoque. Nas grandes promoções o tráfego sobe 10x e o Estoque não dá conta de responder na velocidade das vendas.

- Atraso de alguns segundos na baixa é aceitável
- PERDER uma baixa de estoque não é aceitável (gera venda sem produto)
- O checkout não pode ficar lento nem cair porque o Estoque está sobrecarregado

**Sua análise:**

1. Estilo recomendado:   ☐ Síncrono      ✔️ Assíncrono (fila/evento)      ☐ API Gateway/BFF

2. Desenhe o fluxo (caixas = serviços, setas = chamadas/mensagens):

[Checkout] ---> (Sucesso no Pagamento) ---> [Fila / Message Broker]
    |                                                |
 (Libera Tela)                                 (Mensagem da Venda)
                                                     v
                                          [Consumidor de Estoque]
                                                     |
                                                     v
                                          [Serviço de Estoque]

3. Justificativa (mínimo 2 fatores):

Nivelamento de pico (Load Leveling / Buffering): A fila absorve picos de tráfego de até 10x, acumulando os pedidos e permitindo que o Serviço de Estoque os processe na sua própria velocidade de suporte.

Garantia de não-perda de dados (Durabilidade): Mensagens salvas na fila garantem que nenhuma venda seja perdida, evitando vender itens sem estoque através do controle por ordem de chegada.

4. Principal risco da escolha:

Consistência eventual (Overbooking em estoque limite): Se o estoque real estiver no final, o atraso de alguns segundos no processamento da baixa pode fazer com que duas pessoas comprem o mesmo último item em milissegundos quase simultâneos.

## CENÁRIO 04 — AppBanco — uma tela, cinco serviços

A tela inicial do AppBanco mostra saldo, fatura do cartão, investimentos, empréstimos e cashback — dados de 5 serviços diferentes. O time mobile reclama: são 5 chamadas, 5 formatos de resposta e 5 pontos de falha em cada abertura do app.

- A tela precisa abrir rápido, inclusive em redes móveis ruins
- Cada serviço tem equipe, formato e autenticação próprios
- Amanhã nasce a versão web, que precisa de MAIS dados que a mobile

**Sua análise:**

1. Estilo recomendado:   ☐ Síncrono      ☐ Assíncrono (fila/evento)      ✔️ API Gateway/BFF

2. Desenhe o fluxo (caixas = serviços, setas = chamadas/mensagens):

/---> [Serviço de Saldo]
                    /----> [Serviço de Cartões]
[App Mobile] ---> [BFF Mobile] ---> [Serviço de Investimentos]
                    \----> [Serviço de Empréstimos]
                     \---> [Serviço de Cashback]

3. Justificativa (mínimo 2 fatores):

Agregação de requisições e redução de Overfetching: O BFF consolida as 5 chamadas internas em apenas 1 requisição tratada na rede móvel, tratando dados específicos e reduzindo a latência do cliente.
Isolamento de clientes diferentes: Permite criar um BFF Web e um BFF Mobile independentes, formatando os dados exatos exigidos por cada plataforma sem alterar os microserviços base.

4. Principal risco da escolha:

Gargalo / Ponto único de falha do frontend: O BFF pode virar uma camada monolítica complexa, onde uma queda nele derruba a exibição da tela inteira para o aplicativo.

## DESAFIO

1. Escolha um cenário em que vocês indicaram ASSÍNCRONO. Os brokers de mensagens costumam garantir entrega “pelo menos uma vez” — ou seja, a MESMA mensagem pode chegar duas vezes. O que aconteceria no seu fluxo? Como o consumidor deveria se proteger?

O que aconteceria no fluxo (Cenário 03 - MegaMarket):
Se a mesma mensagem de venda for processada duas vezes pelo Serviço de Estoque, o sistema fará a baixa de estoque em duplicidade para um único pedido (por exemplo, baixará 2 unidades do saldo do produto em vez de apenas 1).
Como o consumidor deve se proteger:
O consumidor deve implementar o conceito de Idempotência.
Identificador Único: Toda mensagem publicada na fila deve conter um id único da transação (ex: id_pedido ou id_transacao).
Checagem em Banco: Antes de processar a baixa, o serviço de estoque verifica em uma tabela ou cache se aquele id_pedido já foi processado.
Controle: Se já foi processado, a mensagem duplicada é simplesmente descartada (ou confirmada) sem aplicar a alteração no estoque novamente.
# 13-081 — Confirmação: retomada, recusa → Pagamento e acesso

**Status:** pendente
**Responsável:** Sonnet
**Depende de:** 13-001, 13-080
**Toca:** `tests/e2e/order-resume-edge.spec.ts` (novo)
**Paralelo:** sim.
**Lote:** T7
**Origem:** 12-020 (Retomada e recuperação, Acesso, recusa → Pagamento), pendência "carteira desconectada ao voltar ao Pagamento"

Regras: 13-001.

## Retomada e recuperação
1. Refresh em `/pedido/<id>` pendente retoma o acompanhamento e o desfecho chega depois do refresh (timer rearmado pelo `GET`; mock estável).
2. `/pagamento` com pedido pendente redireciona ao pedido (por `kurio:checkout.orderId` e por `GET /orders?status=pending`); depois do desfecho **não** redireciona (confirmado: carrinho vazio → `/carrinho`; recusado: Pagamento livre).
3. Sai com o pedido pendente, o pedido confirma fora, volta por `/pagamento` e cai no recibo; `kurio:checkout` limpo ali. Recibo antigo aberto durante um pagamento novo **não** apaga o `kurio:checkout` novo.
4. `order-timeout`: reenvio com a mesma chave chega ao mesmo pedido, sem duplicar, e acompanha até o desfecho.

## Recusa → "Tentar novamente" (reprodução da pendência)
5. Pagar com MetaMask → `payment-declined` → "Tentar novamente" → `/pagamento`: conferir **(a)** campos do colecionador, modo, observação, rede e provedor **iguais aos de antes**, `kurio:checkout` apagado e o próximo `POST /orders` com chave **diferente**; **(b)** o estado da conexão. O teste afirma o comportamento escolhido na Q2 (A: "Não conectada" com o provedor do rascunho em destaque; B: "Conectada: 0xA91F…E82C" sem clique). **Se a Q2 ainda não tiver resposta, o teste afirma só (a) e registra (b) como esperado em aberto** (não usar `fixme`).

## Acesso
6. `403` (pedido de outro usuário e `forbidden-order`): "Você não tem acesso a este pedido" + link para a Início; nenhum dado do pedido vaza (título, itens, valores).
7. `404` (id inexistente): "Pedido não encontrado" + link para a Início; `server-error:GET /orders/:id` → `ErrorState` com "Tentar novamente"; `offline`.
8. Sem login → `/entrar?redirect=/pedido/<id>` e volta ao pedido depois do login; `session-expired` na página → fluxo padrão; troca de usuário não mostra o pedido do anterior (`clearPrivateSession`).

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`. Resultado do item 5 entregue ao Opus para fechar a Q2 (bloco 13-013).

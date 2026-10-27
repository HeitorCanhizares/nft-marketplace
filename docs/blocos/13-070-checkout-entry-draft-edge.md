# 13-070 — Pagamento: entrada, formulário, rascunho e carteiras salvas

**Status:** pendente
**Responsável:** Sonnet
**Depende de:** 13-001, 13-010, 13-011
**Toca:** `tests/e2e/checkout-entry-edge.spec.ts` (novo)
**Paralelo:** sim.
**Lote:** T6
**Origem:** 11-020 (Entrada, Formulário e rascunho, "Usar outra carteira?", Mobile: carteiras salvas)

Regras: 13-001. Carrinho: `seedFigmaCart` como visitante e depois login (a mescla traz os itens). A conexão simulada leva 0,8–1,5 s e a assinatura 0,5–1 s: esperar pelos textos finais.

## Entrada
1. Sem login: `/entrar?redirect=/pagamento`; item esgotado ou com estoque insuficiente: `/carrinho` com o motivo; `empty-cart`: `/carrinho`.
2. Pedido pendente por `kurio:checkout.orderId` e por `GET /orders?status=pending`: vai a `/pedido/<id>`; chave de idempotência **sem** `orderId` reenvia o `POST /orders` com a mesma chave e o mesmo corpo (pedido existe / não existe).
3. `server-error` em carrinho, carteiras ou pendentes: `ErrorState` com "Tentar novamente".

## Formulário e rascunho
4. Validação de todos os campos (limites do 13-060), vazio só acusa no envio, foco no primeiro erro; observação com mais de 500 caracteres.
5. Rascunho restaura valores, modo, observação, provedor e rede depois de `reload`; rascunho de **outro** usuário é descartado; modo `secondary` restaurado sem secundária volta a `primary`; usuário **sem principal** (formulário pré-preenchido pelo perfil).

## "Usar outra carteira?"
6. "Carteira secundária" (com e sem secundária cadastrada); "Preencher outra carteira" limpa; o checkbox vem desmarcado; texto "Substituir a carteira secundária" com aviso quando já existe.
7. Marcado: `PUT /wallets/secondary` **antes** do pedido e a falha dele impede o pedido; desmarcado: nenhum `PUT`; apelido vazio vira "Carteira secundária".

## Mobile: carteiras salvas
8. `[m]` sem nenhuma carteira (estado vazio, link e botão desabilitado); troca entre principal e secundária; "Trocar carteira" desconecta e limpa o provedor; "⋮" → "Editar carteira" e a volta preserva o rascunho; teclado no menu.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile` (itens `[m]`/`[d]` por `only`).

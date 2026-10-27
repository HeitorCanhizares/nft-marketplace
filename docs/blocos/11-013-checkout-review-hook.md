# 11-013 — Hook da revisão e do pagamento (`useCheckoutReview`)

**Status:** concluído
**Fluxo / subitem:** Pagamento › 3, 7, 8, 9
**Depende de:** 11-001, 11-005, 11-006, 11-007
**Toca:** `src/hooks/useCheckoutReview.ts` (novo)
**Paralelo:** pode rodar com 11-012, 11-014, 11-016 (arquivos distintos). O 11-017 espera este.
**Lote:** I

## Objetivo
Ligar os hooks anteriores no fluxo "Confirmar compra" → revalidação → revisão → "Confirmar e pagar" → pedido criado, tratando mudanças de cotação, recusa e falhas sem perder carrinho nem formulário.

## Arquivos
- criar: `src/hooks/useCheckoutReview.ts`

## Referências
- docs/fluxos/pagamento.md subitens 3, 7, 8 e 9; docs/arquitetura/estado.md#criação-de-pedido-idempotente
- `useCheckoutForm` (`collect`, `discardDraft`, `network`), `useCheckoutWallet` (`isReady`, `isMismatch`, `connection`, `provider`), `useCheckoutSubmit` (`SubmitResult`, `submit`, `phase`), `useCheckoutQuote` (`refresh`) (11-005 a 11-007), `diffQuotes` (11-001), `useWalletMutations().saveSecondary` (`src/hooks/useWallets.ts`), `removeCartItem` (`src/services/api/cart.ts`), `queryKeys.ts` (`cart`, `quoteAll`, `orders`), `useLiveAnnouncer`, `useNavigate`

## Instruções
1. `useCheckoutReview({ user, form, wallet, quote, refreshQuote })` com `form: ReturnType<typeof useCheckoutForm>`, `wallet: ReturnType<typeof useCheckoutWallet>`, `quote: Quote | undefined` (a exibida) e `refreshQuote: () => Promise<Quote>`.
2. Estado: `review: { quote: Quote; changes: QuoteChangeEntry[] } | null`, `collected: CheckoutCollected | null` (o que `form.collect()` devolveu), `error: string | null`, `blockMessage: string | null`, `isChecking: boolean`, `removingId: string | null`.
3. **`confirmPurchase()`** (botão "Confirmar compra"; ignora chamadas enquanto `isChecking`):
   1. `blockMessage = null`; `collected = await form.collect()`; `null` → termina (o foco já foi para o primeiro erro).
   2. Carteira: `wallet.connection.status !== 'connected'` → `blockMessage = 'Conecte uma carteira para continuar.'`; `wallet.isMismatch` → `'Troque para a rede {rede} na carteira.'`; anunciar (`assertive`) e terminar. (O botão não fica desabilitado; a mensagem aparece abaixo dele.)
   3. `fresh = await refreshQuote()` (falha → `blockMessage = 'Não foi possível conferir os valores. Tente novamente.'`). `changes = quote ? diffQuotes(quote, fresh) : []`. Abre a revisão: `review = { quote: fresh, changes }`; guarda `collected`. Anunciar "Revise o pedido" (ou "Os valores mudaram. Confirme de novo." se `changes.length > 0`).
4. **`pay()`** (botão "Confirmar e pagar"), sem `review` ou `collected` → nada:
   1. `!wallet.isReady` → `error = 'Carteira desconectada. Conecte novamente.'` e termina.
   2. Com `collected.secondaryBody` (checkbox "Salvar como carteira secundária"): `await saveSecondary(body)`; falhou → `error = 'Não foi possível salvar a carteira secundária. O pedido não foi enviado.'` e termina **sem** chamar `submit`.
   3. `result = await submit({ userId: user.id, quote: review.quote, request: { collector: collected.collector, walletId: collected.walletId, network: form.network, provider: wallet.provider, walletAddress: wallet.connection.address, note: collected.note } })`.
   4. `created` → `form.discardDraft()`, `invalidateQueries(orders.pending)` e `navigate({ to: '/pedido/$orderId', params: { orderId: result.order.id }, replace: true })`.
   5. `changed` → `review = { quote: result.quote, changes: diffQuotes(review.quote, result.quote) }`, `error = null`, `invalidateQueries(quoteAll)`, anunciar "Os valores mudaram. Confirme de novo." (**nova confirmação**: o botão volta a ficar livre).
   6. `stale` → `fresh = await refreshQuote()`; `review = { quote: fresh, changes: diffQuotes(review.quote, fresh) }`; `error = 'A cotação expirou. Conferimos os valores novamente.'`.
   7. `cancelled` / `failed` → `error = message` (a revisão continua aberta; carrinho e formulário intactos; "Confirmar e pagar" serve de "Tentar novamente").
5. **`removeSoldOut(itemId)`**: `removingId = itemId`; `await removeCartItem(itemId)`; `invalidateQueries(cart)`; `fresh = await refreshQuote()`; sem linhas em `fresh.items` → fecha a revisão e `navigate({ to: '/carrinho', replace: true })`; senão atualiza `review` com `diffQuotes(review.quote, fresh)`. Erro → `error = 'Não foi possível remover o item. Tente de novo.'`. Sempre limpa `removingId`.
6. **`closeReview()`** ("Voltar"): `review = null`, `error = null`; não apaga a chave de idempotência (`kurio:checkout`).
7. Quando a carteira deixa de estar pronta com a revisão aberta, `blockMessage` da revisão passa a ser "Carteira desconectada. Conecte novamente." (derivado: `review !== null && !wallet.isReady`); sem perder dados.
8. Devolve `{ confirmPurchase, isChecking, blockMessage, review: { open: review !== null, quote, changes, error, phase, removingId, canPay: wallet.isReady && phase === 'idle', blockMessage: <da revisão> }, pay, closeReview, removeSoldOut, collected }`. Estado derivado no render; **sem `ref` lido no render**; todas as ações são `async` protegidas por `isChecking`/`phase` (sem duplo envio).
9. Fechamento: prettier; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0 (se falhar por arquivo de **outro** agente, esperar e repetir). Commit: `git commit -m "11-013: hook da revisão do checkout" -- <arquivo>`.

## Critérios de aceite
- [ ] "Confirmar compra" com formulário inválido não abre a revisão e foca o primeiro erro.
- [ ] Sem carteira conectada (ou em rede diferente) mostra a mensagem e **não** abre a revisão.
- [ ] A revisão sempre abre com uma cotação **nova**; mudanças aparecem em `changes`.
- [ ] Com "Salvar como carteira secundária" marcado, `PUT /wallets/secondary` roda **antes** do pedido e uma falha dele impede o pedido.
- [ ] Pedido criado: rascunho apagado e navegação para `/pedido/$orderId`.
- [ ] Sem `any`, `as` ou `@ts-ignore`; sem `ref` no render.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Caminho principal no 11-018; mudanças de cotação, recusa, timeout e desconexão na revisão no 11-020.

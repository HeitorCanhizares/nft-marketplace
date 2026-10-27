# 12-012 — Hook `useOrderOutcome` (desfecho, anúncios, limpeza e aviso de demora)

**Status:** pendente
**Fluxo / subitem:** Confirmação › 2, 3, 4 (anúncio, limpeza do checkout, carrinho, 60 s)
**Depende de:** 12-011
**Toca:** `src/hooks/useOrderOutcome.ts` (novo)
**Paralelo:** mesmo agente do 12-011 (lote F); arquivos distintos dos demais lotes. O 12-015 espera este.
**Lote:** F

## Objetivo
Reagir ao pedido sair de `pending`: anunciar o resultado (`assertive`), limpar o estado guardado do checkout, atualizar o carrinho e a lista de pendentes; e dizer quando o pedido está pendente há mais de 60 s.

## Arquivos
- criar: `src/hooks/useOrderOutcome.ts`

## Referências
- docs/fluxos/confirmacao.md subitens 2, 3 e 4 ("Invalida `cart`; apaga `kurio:checkout` e o rascunho"; recusado: nova chave de idempotência ao tentar de novo); docs/arquitetura/estado.md#criação-de-pedido-idempotente (passo 7: "A chave só é descartada quando o pedido sai de `pending`") e #recuperação-de-pedido-pendente
- `readPending`, `clearPending`, `clearDraft` (`src/lib/checkoutStorage.ts`), `queryKeys.ts` (`cart`, `quoteAll`, `orders`), `useLiveAnnouncer` (`@/contexts/liveAnnouncer`), `useQueryClient`; `src/hooks/useLiveChanges.ts` (padrão: refs só dentro de efeitos e callbacks de timer)

## Instruções
1. `useOrderOutcome(order: Order | undefined, userId: string | undefined): { isSlow: boolean }`.
2. **Desfecho** (um `useEffect` com `[order?.id, order?.status, order?.declineReason, userId, queryClient, announce]`; um `useRef` com o status anterior, lido e escrito **só dentro do efeito**):
   - Sem `order` ou com `status === 'pending'`: só atualiza o status anterior e sai.
   - `settled` = pedido `confirmed` ou `declined`. `transitioned` = o status anterior era `pending` (a transição foi vista nesta página).
   - **Limpeza, só do que é deste pedido:** `const stored = userId ? readPending(userId) : null`; se `stored?.orderId === order.id`: `confirmed` → `clearPending()` e `clearDraft()`; `declined` → só `clearPending()` (o rascunho do formulário **fica**, para "Tentar novamente" voltar ao Pagamento com tudo preenchido e uma chave nova). Nunca limpa o checkout de **outro** pedido (por exemplo, o recibo antigo aberto durante um pagamento novo).
   - **Cache:** se `transitioned` ou se a limpeza se aplicou: `invalidateQueries` de `orders.pending` e, no `confirmed`, também de `cart` e `quoteAll` (o servidor já removeu só os itens e quantidades comprados). Abrir um recibo antigo, sem nada disso, **não** refaz o carrinho.
   - **Anúncio** (só com `transitioned`): `confirmed` → `announce('Pedido confirmado', 'assertive')`; `declined` → `announce('Pagamento recusado. ' + motivo, 'assertive')` (motivo = `order.declineReason` ou "O pagamento não foi aprovado."). Quem chega direto num pedido já resolvido não ouve anúncio: o título do diálogo e o `h1` já dizem o estado.
   - Idempotente (o StrictMode roda o efeito duas vezes em dev): a segunda execução não anuncia de novo nem falha.
3. **Aviso de demora:** `isSlow = order?.status === 'pending' && slowFlag`. `slowFlag` é um `useState(false)` ligado por um efeito com `setTimeout` (**sempre via timer, mesmo com tempo 0**, para o estado nunca mudar de forma síncrona dentro do efeito) para `Date.parse(order.createdAt) + SLOW_AFTER_MS - Date.now()` (mínimo 0), com `export const SLOW_AFTER_MS = 60_000`. O prazo conta **desde a criação do pedido**, não desde que a página abriu (refresh não zera). Cleanup limpa o timer.
4. Sem `ref` lido no render; nenhum `navigate` aqui (as ações são links nos componentes).
5. Fechamento: prettier; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0 (se falhar por arquivo de **outro** agente em andamento, esperar e repetir, sem mexer nele). Commit: `git commit -m "12-012: useOrderOutcome" -- <arquivo>`.

## Critérios de aceite
- [ ] Pendente → confirmado: um anúncio `assertive` "Pedido confirmado", `kurio:checkout` e `kurio:checkout-draft` apagados, `cart` refeito (o contador do cabeçalho cai).
- [ ] Pendente → recusado: um anúncio com o motivo, `kurio:checkout` apagado, rascunho preservado, carrinho **sem** refetch.
- [ ] Abrir um recibo antigo com outro checkout em andamento não apaga o `kurio:checkout` novo.
- [ ] `isSlow` vira `true` 60 s depois de `createdAt` e volta a `false` quando o pedido sai de `pending`.
- [ ] Sem `any`, `as`, `!`, `@ts-ignore` nem `eslint-disable`; sem `ref` no render.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Caminho principal no 12-017; recusa, 60 s e recibo antigo com checkout novo no 12-020 (fase 13).

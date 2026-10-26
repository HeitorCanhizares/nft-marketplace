# 08-007 — `useCartCoupon` e schema do campo de cupom

**Status:** pendente
**Fluxo / subitem:** Carrinho › 4 (aplicar e remover cupom)
**Depende de:** 08-005

## Objetivo
Hook que aplica e remove o cupom, e o schema zod do campo.

## Arquivos
- alterar: `src/schemas/cart.ts`
- criar: `src/hooks/useCartCoupon.ts`

## Referências
- docs/fluxos/carrinho.md (subitem 4); docs/arquitetura/estado.md (Formulários: schema zod em `schemas/`, mensagens em PT-BR, erro do servidor no campo)
- `src/hooks/useDeferredEmptyValidation.ts` (campo vazio só é validado no envio), `src/services/http/ApiError.ts` (`isApiError`), `src/services/api/cart.ts`, `src/contexts/liveAnnouncer.ts`

## Instruções
1. `schemas/cart.ts`: `couponFormSchema = z.object({ code: z.string().trim().min(1, { error: 'Informe o código promocional.' }).max(32, { error: 'O código promocional é muito longo.' }) })` e o tipo `CouponFormValues`.
2. `useCartCoupon()` devolve `{ apply, remove, isApplying, isRemoving, error }`:
   - `apply(code)`: `applyCartCoupon(code)`; sucesso: `setQueryData(cart, resposta)`, `invalidateQueries(quote)`, `announce('Cupom {CÓDIGO} aplicado', 'polite')`, limpa `error`.
   - Erro `COUPON_INVALID` → `error = { code: 'COUPON_INVALID', message: 'Código promocional inválido.' }`; `COUPON_EXPIRED` → `'Este código promocional expirou.'`; qualquer outro → `'Não foi possível aplicar o código. Tente de novo.'`. **Nada é gravado no cache em erro.**
   - `remove()`: `removeCartCoupon()`; sucesso igual ao `apply` + `announce('Cupom removido', 'polite')`; erro: toast.
   - Trava de clique repetido por `mutationKey` + `queryClient.isMutating` (`['cart-coupon']`); `isApplying`/`isRemoving` vêm do `useMutation` e servem só para a UI.
3. O foco no campo quando há erro é do `CouponField` (08-010), que recebe `error`.
4. Fechamento: prettier nos 2; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `08-007: cupom do carrinho`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; cupom inválido e expirado têm mensagens distintas.
- [ ] Sucesso atualiza `cart` (com `coupon`) e invalida `quote`.
- [ ] Clique duplo em "Aplicar" gera **uma** requisição.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Comportamento coberto no spec do 08-013.

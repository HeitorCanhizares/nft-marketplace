# 08-002 — Mock: cupom do carrinho (`PUT` e `DELETE /cart/coupon`)

**Status:** concluído
**Fluxo / subitem:** Carrinho › 4 (aplicar e remover cupom)
**Depende de:** 08-001

## Objetivo
Guardar e remover o cupom no carrinho, validando contra os cupons do seed.

## Arquivos
- alterar: `src/mocks/db/cartOps.ts`
- alterar: `src/mocks/handlers/cart.ts`

## Referências
- docs/api-mock/contratos.md (Carrinho: `PUT /cart/coupon` → `Cart` com `coupon`, `422 COUPON_INVALID` / `COUPON_EXPIRED`; cupom sobrevive a refresh) e cenarios.md (linha "Cupom inválido ou expirado")
- `src/mocks/seed/coupons.ts` (`findCoupon`: `KURIO10`, `GENESIS5`, `EXPIRADO`), `src/mocks/scenarios/errors.ts`

## Instruções
1. `cartOps.ts`: `applyCoupon(owner, code)` e `clearCoupon(cartId)`.
   - `applyCoupon`: normaliza `code.trim().toUpperCase()`; `findCoupon` indefinido → `COUPON_INVALID` ("Código promocional inválido."); `expired` → `COUPON_EXPIRED` ("Este código promocional expirou."); senão grava `coupon: { code }` (código normalizado) e `version + 1`. Carrinho ainda inexistente: cria o registro vazio do dono (`items: []`, `itemCount: 0`, `version: 0`).
   - `clearCoupon`: remove `coupon` (sem erro se não havia) e `version + 1` **só se havia**.
2. `cart.ts`: `http.put(apiPath('/cart/coupon'), withMock('PUT /cart/coupon', …))` com corpo `{ code: string não vazio }` (vazio → `422 VALIDATION_ERROR`) e `http.delete(apiPath('/cart/coupon'), withMock('DELETE /cart/coupon', …))`. Mesma identificação do dono; respostas com `toCartResponse` (`Cart` com `coupon?`). Em erro, **nada é gravado**.
3. Fechamento: prettier nos 2; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `08-002: cupom do carrinho no mock`.

## Critérios de aceite
- [ ] `KURIO10` e `kurio10 ` (espaços e minúsculas) aplicam e o `GET /cart` seguinte ainda traz `coupon: { code: 'KURIO10' }` (sobrevive a refresh).
- [ ] `EXPIRADO` → `422 COUPON_EXPIRED`; `QUALQUER` → `422 COUPON_INVALID`; ambos sem gravar.
- [ ] `DELETE` remove e é idempotente.
- [ ] Sem `any`, sem `@ts-ignore`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Comportamento coberto no spec do 08-013.

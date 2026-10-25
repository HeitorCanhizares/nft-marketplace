# 03-004 — Schemas zod: carrinho, cotação e pedido

**Status:** pendente
**Fluxo / subitem:** Fase 03 › Schemas
**Depende de:** 03-003

## Objetivo
Criar os schemas do carrinho, da cotação e dos pedidos.

## Arquivos
- criar: `src/schemas/cart.ts`, `src/schemas/order.ts`

## Referências
- docs/api-mock/contratos.md#carrinho, #cotação, #pedidos
- src/types/cart.ts, src/types/order.ts

## Instruções
1. `cart.ts`: `cartItemSchema`, `cartSchema` (com `coupon?`), `quoteSchema` (com `warnings`, `items[].priceChanged?`, `coupon?`), todos `z.ZodType<Tipo>`.
2. `order.ts`: `orderStatusSchema`, `orderItemSnapshotSchema`, `orderSchema`, `quoteChangeSchema` e o schema do corpo do `POST /orders` (`createOrderInputSchema`, usado depois pelo formulário do Pagamento).
3. Valores em ETH com `ethAmountSchema`; quantidades com `positiveIntSchema`.
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/schemas/cart.ts src/schemas/order.ts` e `git commit -m "03-004: schemas de carrinho e pedido"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`.
- [ ] Camadas respeitadas (pastas.md): `services/api` não conhece React; `components/shared` e `contexts` não chamam Axios direto; nada importa de `src/mocks/` além de `main.tsx`.
- [ ] Mensagens ao usuário em PT-BR; código e nomes em inglês.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Testado no 03-019 com exemplos válidos e inválidos.

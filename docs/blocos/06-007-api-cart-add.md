# 06-007 — Serviço de API: adicionar ao carrinho

**Status:** concluído
**Fluxo / subitem:** Início › 8 (adicionar ao carrinho pelo card)
**Depende de:** 03-004, 03-008
**Depende de decisão:** pergunta 5 do relatório da fase 06 (só `POST /cart/items` entra agora)

## Objetivo
Criar a chamada `POST /cart/items`, usada pelo card da Início (e depois pelo Detalhes).

## Arquivos
- criar: `src/services/api/cart.ts`

## Referências
- docs/api-mock/contratos.md (Carrinho: `POST /cart/items` `{ nftId, editionId, quantity }` → `Cart`; erros `409 SOLD_OUT`, `422 QUANTITY_EXCEEDS_STOCK`)
- `src/schemas/cart.ts` (`cartSchema`), `src/services/http/client.ts` (envia `X-Cart-Id` quando não há sessão)

## Instruções
1. `AddCartItemInput = { nftId: string; editionId: string; quantity: number }`.
2. `addCartItem(input: AddCartItemInput): Promise<Cart>` → `post('/cart/items', cartSchema, input)`.
3. Fechamento: `npx prettier --write src/services/api/cart.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/services/api/cart.ts` e `git commit -m "06-007: serviço de API do carrinho (adicionar)"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; erros chegam como `ApiError` (o interceptor já converte).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Coberto no 06-063.

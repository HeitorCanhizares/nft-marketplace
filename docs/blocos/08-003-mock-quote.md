# 08-003 — Mock: `POST /quote`

**Status:** concluído
**Fluxo / subitem:** Carrinho › 5 (resumo pela cotação), 7 (preço e estoque)
**Depende de:** 08-002

## Objetivo
Cotação do carrinho atual: subtotal, desconto, taxa de rede e total calculados **no mock** (o front só exibe).

## Arquivos
- criar: `src/mocks/db/quote.ts`
- criar: `src/mocks/handlers/quote.ts`
- alterar: `src/mocks/browser.ts` (registrar `quoteHandlers` junto dos demais)

## Referências
- docs/api-mock/contratos.md (Cotação; tipo `Quote`; "a cotação é a referência"; `warnings`; `priceChanged`; TTL `VITE_MOCK_QUOTE_TTL_SECONDS`) e `src/mocks/scenarios/config.ts` (`mockConfig.quoteTtlSeconds`)
- `src/mocks/db/cartOps.ts` (`toCartResponse`), `src/mocks/db/money.ts` (`ethToUnits`, `unitsToEth`), `src/mocks/db/stores.ts` (`quotesStore`), `src/mocks/seed/coupons.ts`, `src/schemas/cart.ts` (`quoteSchema`)

## Instruções
1. **Valores propostos (confirmar):**
   - **Taxa de rede** fixa por rede, sempre estimada (`networkFeeEstimated: true`), cobrada **uma vez** por cotação: `ethereum` `0.016`, `polygon` `0.002`, `solana` `0.0005`. Sem `network` no corpo, vale `ethereum`. Carrinho vazio ou sem linhas pagáveis: taxa `0.00`.
   - **Desconto** = `floor(subtotal_em_unidades × percent / 100)` (em unidades de 0,000001 ETH, `Math.floor`); sem cupom válido, `0.00`.
   - **Total** = subtotal − desconto + taxa.
   - Linha **esgotada** (`sold_out`) **fica fora** do subtotal e dos avisos de preço; linha `insufficient` **entra** com a quantidade pedida (o front bloqueia o fechamento).
2. `db/quote.ts`: `buildQuote(cart: CartRecord, input: { network?; provider? }): Promise<Quote>`. Usa `toCartResponse(cart)` (preço e estoque **atuais**). Para cada linha, compara com a `unitPrice` **gravada** no registro: se diferente, `priceChanged: { from: gravado, to: atual }`. `warnings`: `PRICE_CHANGED` se alguma linha mudou, `SOLD_OUT` se alguma `sold_out`, `LOW_STOCK` se alguma `low_stock` ou `insufficient`. `cartVersion = cart.version`. `id = 'quote-' + crypto.randomUUID()`; `expiresAt = agora + quoteTtlSeconds`. `coupon`: se o carrinho tem cupom, `findCoupon`; válido → `{ code, status: 'applied', message: 'Cupom aplicado.' }`; sumiu ou expirou → `status: 'expired'`, message "Este código promocional expirou." e **sem desconto**. Grava com `quotesStore.put` (a fase 11 revalida por ela) e valida em `quoteSchema`. Toda conta usa `ethToUnits`/`unitsToEth`.
3. `handlers/quote.ts`: `http.post(apiPath('/quote'), withMock('POST /quote', …))`, corpo opcional `{ network?: 'ethereum'|'polygon'|'solana', provider? }` (corpo ausente é aceito; valor fora do enum → `422 VALIDATION_ERROR`). Dono como no carrinho: importar `resolveOwner` de `./cart` (exportada no 08-001). Sem dono, ou carrinho inexistente, ou `empty-cart`: cotação vazia (`items: []`, tudo `0.00`).
4. `browser.ts`: importar e espalhar `...quoteHandlers`.
5. Fechamento: prettier nos arquivos tocados; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `08-003: cotação no mock`.

## Critérios de aceite
- [ ] Carrinho com Emerald Ape 1/50 ×2 (`1.19`): `subtotal` `2.38`, sem cupom `discount` `0.00`, `networkFee` `0.016`, `total` `2.396`.
- [ ] Com `KURIO10`: `discount` = 10 % do subtotal e `total` coerente; `coupon.status` `applied`.
- [ ] Depois de mudar o preço da edição no banco, `items[].priceChanged` vem preenchido e `warnings` tem `PRICE_CHANGED`.
- [ ] Linha esgotada não soma no subtotal.
- [ ] Sem `any`, sem `@ts-ignore`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Coberto no spec do 08-013.

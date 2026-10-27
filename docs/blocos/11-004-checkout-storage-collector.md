# 11-004 — Estado guardado do checkout e montagem do colecionador

**Status:** pendente
**Fluxo / subitem:** Pagamento › 1, 2, 3, 8, 10
**Depende de:** —
**Toca:** `src/schemas/checkout.ts` (novo), `src/lib/checkoutStorage.ts` (novo), `src/lib/checkoutCollector.ts` (novo)
**Paralelo:** pode rodar com 11-001, 11-009, 11-011. Os blocos 11-006, 11-007, 11-008 e 11-013 esperam este.
**Lote:** B

## Objetivo
Os dois registros do `sessionStorage` (`kurio:checkout` e `kurio:checkout-draft`) com validação, e as funções que transformam os valores do formulário no `collector` do pedido e no corpo da carteira secundária.

## Arquivos
- criar: `src/schemas/checkout.ts`
- criar: `src/lib/checkoutStorage.ts`
- criar: `src/lib/checkoutCollector.ts`

## Referências
- docs/arquitetura/estado.md (criação de pedido idempotente, recuperação, expiração de sessão: `kurio:checkout`, `kurio:checkout-draft`)
- docs/fluxos/pagamento.md subitens 1, 2, 3, 10
- `src/lib/storage.ts` (`storage.session.getJson/setJson/remove`, `STORAGE_KEYS.checkout`, `STORAGE_KEYS.checkoutDraft`), `src/schemas/wallet.ts` (`WalletFormValues`, `toWalletBody`, `checkoutWalletFormSchema`), `src/schemas/order.ts` (`collectorSchema`, `createOrderInputSchema`), `src/schemas/profile.ts` (`toEnsName`), `src/types/order.ts` (`CreateOrderInput`)

## Instruções
1. `src/schemas/checkout.ts`:
   - `checkoutNoteSchema = z.string().max(500, { error: 'A observação deve ter até 500 caracteres.' })`.
   - `checkoutModeSchema = z.enum(['primary', 'secondary', 'manual'])` e o tipo `CheckoutMode` (`primary`/`secondary`: dados da carteira salva; `manual`: "Preencher outra carteira").
   - `checkoutDraftSchema`: `{ userId: string, mode: CheckoutMode, saveAsSecondary: boolean, note: string, provider: WalletProvider | null, values: <mesmas chaves de WalletFormValues, todas string; secondaryAddressOrEns opcional> }` (usar `satisfies z.ZodType<…>` no campo `values` contra `WalletFormValues`). Tipo `CheckoutDraft`.
   - `checkoutPendingSchema`: `{ userId: string, quoteId: string, key: string, request: createOrderInputSchema, orderId?: string }`. Tipo `CheckoutPending` (a chave de idempotência, o corpo enviado e, depois da resposta, o `orderId`).
2. `src/lib/checkoutStorage.ts` (sem React; tudo em `storage.session`; leitura com `safeParse`, valor inválido ou de **outro** `userId` → apaga e devolve `null`):
   - `readDraft(userId): CheckoutDraft | null`, `writeDraft(draft): void`, `clearDraft(): void`.
   - `readPending(userId): CheckoutPending | null`, `writePending(pending): void`, `setPendingOrderId(orderId): void` (atualiza o registro existente), `clearPending(): void`.
3. `src/lib/checkoutCollector.ts` (sem React):
   - `toCollector(values: WalletFormValues): CreateOrderInput['collector']`: valores **já validados** por `checkoutWalletFormSchema`; mesmos campos de `toWalletBody`, mas `nickname` pode ser `''`; `secondaryAddressOrEns` só entra se não vazio; `ensName = toEnsName(values.ensLabel)`; passa por `collectorSchema.parse`.
   - `toSecondaryBody(values: WalletFormValues): WalletBody`: `toWalletBody({ ...values, nickname: values.nickname.trim() || 'Carteira secundária' })` (a API exige apelido).
4. Fechamento: prettier nos 3; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0 (se falhar por arquivo de **outro** agente, esperar e repetir). Commit só dos 3: `git commit -m "11-004: estado guardado do checkout" -- <arquivos>`.

## Critérios de aceite
- [ ] Registro de outro usuário ou com formato inválido nunca é devolvido (e é apagado).
- [ ] `toCollector` com apelido vazio funciona; `toSecondaryBody` com apelido vazio devolve "Carteira secundária".
- [ ] `lib/` sem importar React. Sem `any`, `as` ou `@ts-ignore`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Exercitado pelo spec do 11-018.

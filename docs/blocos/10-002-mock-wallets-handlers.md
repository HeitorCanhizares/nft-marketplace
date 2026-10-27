# 10-002 — Handlers do mock: carteiras

**Status:** concluído
**Fluxo / subitem:** Carteiras › 2, 3, 4, 5, 6, 7
**Depende de:** 10-001

## Objetivo
`GET /wallets`, `PUT /wallets/primary`, `PUT /wallets/secondary`, `DELETE /wallets/secondary` e `POST /wallets/swap` no MSW, gravando no IndexedDB.

## Arquivos
- criar: `src/mocks/handlers/wallets.ts`
- alterar: `src/mocks/browser.ts` (registrar `walletsHandlers`)

## Referências
- Contrato: docs/api-mock/contratos.md#carteiras
- Padrão: `src/mocks/handlers/profile.ts` (`withMock(..., { protected: true })`, `authenticate`, `apiError`, `validationError`, `toPublicUser`)
- `walletsStore` (`get`, `getByUser`, `put`, `delete`) em `src/mocks/db/stores.ts`; `WalletRecord` (`Wallet & { userId }`) em `src/mocks/db/db.ts`; seed em `src/mocks/seed/users.ts`
- `walletBodySchema` (10-001)

## Instruções
1. `wallets.ts`, exportar `walletsHandlers`. Todas as rotas com `withMock('<MÉTODO> /wallets…', …, { protected: true })` e `authenticate(request)` (`if (auth instanceof Response) return auth`). Função local `toWallet(record)` remove `userId`.
2. **`GET /wallets`** → `walletsStore.getByUser(auth.user.id)`; devolve `{ primary, secondary }` pelo `slot` (`null` quando não houver).
3. **`PUT /wallets/primary` e `PUT /wallets/secondary`** (uma função `saveSlot(slot)`): corpo que não for objeto → `BAD_REQUEST`; `walletBodySchema.safeParse` → `validationError` (chaves dos `fields` iguais às do corpo; `ensName` aponta o campo de ENS). Se já existe carteira no `slot`, mantém o `id` e substitui os campos; senão cria com `id = wallet-${slot}-${userId}-${Date.now()}`. Grava com `slot` e `userId` e responde `200` com `toWallet`.
4. **`DELETE /wallets/secondary`**: sem secundária → `apiError('NOT_FOUND')`; senão `walletsStore.delete(id)` e `204`.
5. **`POST /wallets/swap`**: falta uma das duas → `apiError('NOT_FOUND')`. Senão troca só o `slot` dos dois registros (os `id` **não mudam**) e grava os dois; responde `{ primary, secondary }` já trocados.
6. `browser.ts`: importar e incluir `...walletsHandlers` em `resourceHandlers`.
7. Fechamento: prettier; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `10-002: handlers de carteiras`.

## Critérios de aceite
- [ ] Endereço fora do formato → `422 VALIDATION_ERROR` com `fields.address`.
- [ ] Cada usuário só vê e altera as próprias carteiras (filtro por `userId`).
- [ ] Salvar a mesma carteira duas vezes não cria um segundo registro no mesmo `slot`.
- [ ] Sem `any`, sem `@ts-ignore`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Comportamento exercitado pelo spec do 10-010.

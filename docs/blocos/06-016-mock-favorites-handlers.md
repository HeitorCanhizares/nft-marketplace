# 06-016 — Mock: handlers de favoritos

**Status:** concluído
**Fluxo / subitem:** Início › 8 e 9 (favoritar; filtro de favoritos)
**Depende de:** 05-006, 02-010, 02-008

## Objetivo
Registrar `GET /favorites`, `PUT /favorites/:nftId` e `DELETE /favorites/:nftId`, idempotentes e privados.

## Arquivos
- criar: `src/mocks/handlers/favorites.ts`
- alterar: `src/mocks/browser.ts`

## Referências
- docs/api-mock/contratos.md (Favoritos 🔒: `GET` → `{ ids: string[] }`; `PUT`/`DELETE` → `204`, idempotentes)
- `src/mocks/db/stores.ts` (`favoritesStore.add/remove/listByUserId`, `nftsStore.get`), `src/mocks/handlers/sessionGuard.ts` (`authenticate`), `src/mocks/handlers/auth.ts` (padrão, `{ protected: true }`)

## Instruções
1. `favoritesHandlers` com as 3 rotas, todas `withMock('<MÉTODO> /favorites…', resolver, { protected: true })` e `authenticate(request)` (Response → devolve):
   - `GET /favorites`: `200 { ids }` com os `nftId` do usuário;
   - `PUT /favorites/:nftId`: NFT inexistente → `apiError('NOT_FOUND')`; senão `favoritesStore.add({ userId, nftId })` (repetir não muda nada) → `204`;
   - `DELETE /favorites/:nftId`: `favoritesStore.remove(userId, nftId)` (inexistente também → `204`).
2. O `routeKey` do `withMock` usa o **caminho com parâmetro** (`PUT /favorites/:nftId`), para os cenários `server-error:PUT /favorites/:nftId` funcionarem.
3. `browser.ts`: importar e acrescentar `...favoritesHandlers` a `resourceHandlers`.
4. Fechamento: `npx prettier --write` nos 2 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/mocks/handlers/favorites.ts src/mocks/browser.ts` e `git commit -m "06-016: handlers de favoritos"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; sem token → `401 UNAUTHORIZED`; com `session-expired` → `401 SESSION_EXPIRED`.
- [ ] `PUT` duas vezes → `204` e um só registro; `DELETE` de quem não está favoritado → `204`; favoritos de um usuário não aparecem para o outro.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Coberto no 06-020.

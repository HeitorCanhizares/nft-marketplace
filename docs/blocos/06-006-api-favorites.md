# 06-006 — Serviço de API: favoritar e desfavoritar

**Status:** pendente
**Fluxo / subitem:** Início › 8 (favoritar)
**Depende de:** 03-008

## Objetivo
Criar as duas chamadas que a Início usa para favoritar: `PUT` e `DELETE /favorites/:nftId`.

## Arquivos
- criar: `src/services/api/favorites.ts`

## Referências
- docs/api-mock/contratos.md (Favoritos 🔒: `PUT`/`DELETE /favorites/:nftId` → `204`, idempotentes). `GET /favorites` **não** é usado pela Início (o `isFavorite` vem nas listas) e fica só no mock.
- `src/services/http/validate.ts` (`put`, `del`; schema `null` = resposta `204` sem corpo)

## Instruções
1. `addFavorite(nftId: string): Promise<void>` → `put('/favorites/' + encodeURIComponent(nftId), null)`.
2. `removeFavorite(nftId: string): Promise<void>` → `del('/favorites/' + encodeURIComponent(nftId), null)`.
3. Fechamento: `npx prettier --write src/services/api/favorites.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/services/api/favorites.ts` e `git commit -m "06-006: serviço de API de favoritos"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; resposta `204` resolve sem erro.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Coberto no 06-063.

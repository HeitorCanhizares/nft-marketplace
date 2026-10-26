# 06-015 — Mock: handler `GET /home`

**Status:** concluído
**Fluxo / subitem:** Início › 1, 2, 10 (hero, destaque, promos, blog)
**Depende de:** 06-009, 06-014, 02-015
**Depende de decisão:** pergunta 7 do relatório da fase 06 (quais NFTs são o hero e o destaque)

## Objetivo
Registrar `GET /home`: os 3 NFTs do hero, o NFT em destaque, os 2 promos e os 4 posts do blog.

## Arquivos
- criar: `src/mocks/handlers/home.ts`
- alterar: `src/mocks/browser.ts`

## Referências
- docs/api-mock/contratos.md (`GET /home` → `{ hero: NftSummary[], featured: NftSummary, promos: Promo[], posts: Post[] }`) e docs/fluxos/inicio.md (subitens 1, 2, 10)
- `src/mocks/seed/content.ts` (`SEED_PROMOS`, `SEED_POSTS`), `src/mocks/handlers/sessionGuard.ts` (`tryAuthenticate`, do 06-014), `src/mocks/handlers/nfts.ts` (padrão)

## Instruções
1. Constantes no topo do arquivo: `HOME_HERO_IDS = ['emerald-ape-042', 'sage-nomad-009', 'golden-beat-207']` e `HOME_FEATURED_ID = 'cosmic-bloom-118'` (comentar: valores a confirmar com o usuário; na captura mobile a imagem grande é o macaco de jaqueta verde e a pequena é o gorila de capuz roxo, ou seja, `hero[0]` e `hero[1]`).
2. `homeHandlers = [http.get(apiPath('/home'), withMock('GET /home', resolver))]`: `tryAuthenticate`; `favoriteIds` do usuário (ou `undefined`); busca cada NFT em `nftsStore.get(id)`; id inexistente → `apiError('INTERNAL_ERROR')`; responde `200` com `hero` e `featured` por `toNftSummary(record, favoriteIds)`, `promos: [...SEED_PROMOS]`, `posts: [...SEED_POSTS]`. O cenário `empty-catalog` **não** afeta esta rota (hero e destaque continuam).
3. `browser.ts`: importar e acrescentar `...homeHandlers` a `resourceHandlers`.
4. Fechamento: `npx prettier --write` nos 2 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/mocks/handlers/home.ts src/mocks/browser.ts` e `git commit -m "06-015: handler GET /home"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; a resposta valida em `homeResponseSchema`: 3 hero, 1 destaque, 2 promos (`tab: 'new'` e `collection: 'arte-digital'`), 4 posts.
- [ ] `server-error:GET /home` → `500`; `empty-catalog` → ainda `200`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Coberto no 06-019.

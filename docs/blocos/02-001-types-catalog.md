# 02-001 — Tipos do catálogo

**Status:** pendente
**Fluxo / subitem:** Fase 02 › Tipos de domínio
**Depende de:** Fase 01 (tag `fase-01-design-base`)

## Objetivo
Criar os tipos TypeScript do catálogo, exatamente como em contratos.md.

## Arquivos
- criar: `src/types/nft.ts`

## Referências
- docs/api-mock/contratos.md#tipos-principais, #nfts
- Decisão do usuário (2026-10-25): tipos e `lib/storage` antecipados da fase 03 para a 02; os schemas zod continuam na fase 03

## Instruções
1. Exportar de `src/types/nft.ts`: `Network`, `WalletProvider` (compartilhado; reexportado por `wallet.ts` se necessário, mas **definido aqui**), `NftSummary`, `Edition`, `NftDetail`, `Paginated<T>` (`items, page, pageSize, total, totalPages`) e `CatalogFacets` (`collections`, `networks`: `{ id, name, count }[]`, `priceRange: { min, max }`).
2. Acrescentar os tipos que o contrato cita mas não define (**propostos**; o usuário os confirma na revisão da fase):
   - `Review`: `{ id; nftId; author: string; rating: 1|2|3|4|5; body: string; createdAt: string }`.
   - `Promo`: `{ id; title; text; ctaLabel: string; query: { collection?: string; network?: Network; sort?: string } }` (promo leva ao catálogo filtrado).
   - `Post`: `{ id; date: string; readingMinutes: number; title; summary }`.
   - `HomeResponse`: `{ hero: NftSummary[]; featured: NftSummary; promos: Promo[]; posts: Post[] }`.
3. Valores em ETH são `string`; nenhum campo monetário como `number`.
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/types/nft.ts` e `git commit -m "02-001: tipos do catálogo"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; tipos exportados com nome.
- [ ] `src/mocks/**` não importa nada do app além de `src/types`, `src/schemas` e `src/lib` (regra de camadas de pastas.md).
- [ ] Comentários só onde o porquê não é óbvio.
- [ ] Todos os tipos do contrato presentes e com os mesmos nomes de campo.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Conferir campo a campo contra `contratos.md`.

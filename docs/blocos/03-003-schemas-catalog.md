# 03-003 — Schemas zod: catálogo

**Status:** pendente
**Fluxo / subitem:** Fase 03 › Schemas
**Depende de:** 03-002

## Objetivo
Criar os schemas das respostas do catálogo.

## Arquivos
- criar: `src/schemas/nft.ts`

## Referências
- docs/api-mock/contratos.md#nfts e #tipos-principais
- src/types/nft.ts

## Instruções
1. Schemas de `NftSummary`, `Edition`, `NftDetail`, `CatalogFacets`, resposta do catálogo (`Paginated<NftSummary> & { facets }`), `Review` (+ página), `Promo`, `Post` e `HomeResponse`, todos como `z.ZodType<Tipo>` (tipos de `src/types/nft.ts`).
2. Preços sempre com `ethAmountSchema`; campos opcionais conforme o contrato (`previousPrice`, `rarity`, `isFavorite`).
3. Nada de `.passthrough()`: campo desconhecido é descartado (o app só usa o que o contrato promete).
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/schemas/nft.ts` e `git commit -m "03-003: schemas do catálogo"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`.
- [ ] Camadas respeitadas (pastas.md): `services/api` não conhece React; `components/shared` e `contexts` não chamam Axios direto; nada importa de `src/mocks/` além de `main.tsx`.
- [ ] Mensagens ao usuário em PT-BR; código e nomes em inglês.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Testado no 03-019: o schema aceita `buildSeedNfts()` convertido pelo contrato (via `__kurio.schemas`) e rejeita preço `number`.

# 02-019 — Agendador de oscilações de preço e estoque

**Status:** pendente
**Fluxo / subitem:** Fase 02 › Tempo real
**Depende de:** 02-018

## Objetivo
Mudar de vez em quando o preço ou o estoque de NFTs inscritos, gravando no banco e emitindo o evento.

## Arquivos
- criar: `src/mocks/realtime/scheduler.ts`

## Referências
- docs/api-mock/realtime.md#simulação-no-mock
- docs/api-mock/cenarios.md#regras-de-negócio-que-o-mock-aplica-sempre
- Decisão do usuário (2026-10-25): em modo `test`, tempo real **ligado**, mas **sem oscilação aleatória**

## Instruções
1. `startScheduler()` / `stopScheduler()`: a cada 20–40 s (sorteado) escolhe um NFT **inscrito** (do `server.ts`), muda o preço (±5–15%) ou o estoque (−1 ou +1, nunca abaixo de 0), **grava no `nfts` store** e emite `nft:price_changed` (com `previousPrice`) ou `nft:stock_changed`.
2. Só roda quando `mockConfig.realtimeEnabled` **e** nenhum cenário forçado está ativo **e** `import.meta.env.MODE !== 'test'` (em teste e no build do Lighthouse não há oscilação aleatória).
3. Exportar também `triggerPriceChange(nftId, editionId, newPrice)` e `triggerStockChange(nftId, editionId, available)`, usadas depois pelos cenários `price-change-on-checkout` e `sold-out-on-checkout` (fases 11/12): gravam no banco e emitem o evento, sempre, independente do modo.
4. Sem lógica de carrinho ou cotação.
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/mocks/realtime/scheduler.ts` e `git commit -m "02-019: agendador de oscilações"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; tipos exportados com nome.
- [ ] `src/mocks/**` não importa nada do app além de `src/types`, `src/schemas` e `src/lib` (regra de camadas de pastas.md).
- [ ] Comentários só onde o porquê não é óbvio.
- [ ] Em `MODE === 'test'`, nenhum evento aleatório.
- [ ] `triggerPriceChange` grava no banco e o próximo `GET` refletirá o valor.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Testado no 02-022 (gatilhos manuais; ausência de oscilação em modo de teste).

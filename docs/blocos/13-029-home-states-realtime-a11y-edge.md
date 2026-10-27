# 13-029 — Início: estados, tempo real e acessibilidade

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001, 13-020 a 13-028
**Toca:** `tests/e2e/home-states-edge.spec.ts` (novo); `tests/e2e/home-a11y.spec.ts` (acrescentar os estados abaixo; arquivo só deste bloco)
**Paralelo:** sim com os outros fluxos.
**Lote:** T1
**Origem:** 06-064, 06-065, 06-066

Regras: 13-001.

## Estados e Tempo real (`home-states-edge.spec.ts`)
1. `empty-catalog`: `EmptyState` "Limpar filtros"; facets com contagens 0 e faixa `0.00`. `slow` (2–5 s): esqueletos com a mesma altura dos cards (sem CLS); `jitter` e `delayApi`: **resposta fora de ordem** — filtrar A, depois B, com A respondendo por último: o resultado final é o de B e a URL também.
2. `offline` e `network-error:GET /nfts`: `ErrorState` com "Tentar novamente" (refaz a chamada); `server-error:GET /nfts`, `unavailable:GET /nfts`: mensagem amigável; a Início aparece atrás do modal de `/entrar` `[d]` (sem erro, inerte).
3. Tempo real: inscrição dos NFTs visíveis muda ao paginar/filtrar e cancela ao sair; `triggerPriceChange` mostra preço novo, selo "Atualizado" por 5 s (`page.clock`), aviso `polite` **agrupado** sem reordenar nem mover foco; `triggerStockChange` até 0 mostra "Esgotado" e desabilita carrinho; `dropConnections` relê o catálogo; NFT fora da página é ignorado.

## Acessibilidade (`home-a11y.spec.ts`)
4. Axe nos estados: drawer de filtros aberto `[m]`, painel de filtros `[d]`, vazio, erro, carregando, `favoritos=1` vazio. Teclado: Tab percorre header → hero → abas → filtros → cards → paginação na ordem visual; abrir e fechar o drawer só com teclado (Esc + retorno do foco ao gatilho).

## Critérios de aceite
- [ ] Specs verdes em `desktop` e `mobile`; axe sem `serious`/`critical`.

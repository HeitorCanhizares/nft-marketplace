# 13-023 — Início: estados, tempo real e acessibilidade

**Status:** pendente
**Responsável:** Sonnet
**Depende de:** 13-001, 13-020, 13-021, 13-022 (para não repetir casos)
**Toca:** `tests/e2e/home-states-edge.spec.ts` (novo); `tests/e2e/home-a11y.spec.ts` (acrescentar os estados abaixo; arquivo só deste bloco)
**Paralelo:** sim com os outros fluxos.
**Lote:** T1
**Origem:** 06-064, 06-065, 06-066

Regras: 13-001.

## Estados (home-states-edge)
1. `empty-catalog`: `EmptyState` "Limpar filtros"; facets com contagens 0 e faixa `0.00`.
2. `slow` (2–5 s): esqueletos com a mesma altura dos cards (sem CLS); `jitter` e `delayApi`: **resposta fora de ordem** — filtrar A, depois B, com A respondendo por último: o resultado final é o de B e a URL também.
3. `offline` e `network-error:GET /nfts`: `ErrorState` com "Tentar novamente" (refaz a chamada); `server-error:GET /nfts`, `server-error:GET /home`, `unavailable:GET /nfts`: mensagem amigável; erro de `/home` vira **um** `ErrorState` e o catálogo (rota própria) segue funcionando.
4. A Início aparece atrás do modal de `/entrar` `[d]` (sem erro, inerte).

## Tempo real (home-states-edge)
5. Inscrição dos NFTs visíveis: ao paginar/filtrar, as inscrições mudam; ao sair da Início, cancelam.
6. `triggerPriceChange` em um card visível: preço novo, selo "Atualizado" por 5 s (com `page.clock`), aviso `polite` **agrupado** (várias mudanças = um anúncio); nada reordena e o foco não se move. `triggerStockChange` até 0: selo "Esgotado" e carrinho desabilitado.
7. `dropConnections` (reconexão do socket) invalida e relê o catálogo; mudança de NFT fora da página é ignorada.

## Acessibilidade (home-a11y)
8. Axe nos estados: drawer de filtros aberto `[m]`, painel de filtros `[d]`, vazio, erro, carregando, `favoritos=1` vazio.
9. Teclado: Tab percorre header → hero → abas → filtros → cards → paginação na ordem visual; abrir e fechar o drawer só com teclado e o foco volta ao gatilho; Esc fecha.
10. O reflow de 320 px/zoom (13-090) e o `prefers-reduced-motion` dos carrosséis são cobertos lá e no 13-020.

## Critérios de aceite
- [ ] Specs verdes em `desktop` e `mobile`; axe sem `serious`/`critical`.

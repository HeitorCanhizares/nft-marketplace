# 13-096 — Fechamento: Lighthouse final

**Status:** medido; metas de performance/LCP não atingidas (aguarda Q4), ver 13-005
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-005, 13-006, 13-016 (e demais correções de desempenho), 13-095
**Toca:** — (só execução; sobe `lighthouserc.json` de `warn` para `error` se o 13-006 ainda não o fez)
**Paralelo:** não.
**Lote:** —

## Instruções
1. `npm run lhci` no **clone limpo** (13-097) e, para comparar, no checkout atual.
2. Metas (mobile): performance ≥ 90, acessibilidade 100, boas práticas ≥ 95, SEO ≥ 90, LCP < 2,5 s, CLS < 0,1, INP < 200 ms nas 4 páginas públicas (e nas logadas, se a Q5 permitir).
3. Registrar a mediana de 3 execuções por página e a comparação com a linha de base da fase 05 (perf 83, LCP ~3,36 s). Se a meta não for atingida depois dos blocos de desempenho aprovados, **parar e levar ao usuário** o gargalo restante e a opção de relaxar a meta (Q4), sem declarar a fase fechada.

## Critérios de aceite
- [ ] Tabela de notas e métricas por página entregue ao Opus (vai para `decisoes.md`).

## Resultado (2026-10-27)
Mesma tabela do 13-005 (medição final, checkout atual). Metas atingidas: boas práticas 100, SEO ≥ 91, CLS 0 e acessibilidade 100 em 4 de 6 páginas. Não atingidas: performance ≥ 90 em `/nft`, `/carrinho` e `/pagamento`; LCP < 2,5 s em todas; acessibilidade 100 em `/` e `/nft` (`target-size` dos indicadores do carrossel, que seguem o Figma). Fase não declarada fechada nesses itens: decisão do usuário (Q4 e tamanho dos indicadores).

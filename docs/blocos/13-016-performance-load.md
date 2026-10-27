# 13-016 — Desempenho da carga inicial (esboço)

**Status:** aguardando a Q4 (medição no 13-005). **Esboço:** o Sonnet reescreve depois do 13-005 e das respostas Q4, com arquivo, mudança e ganho medido por item. Podem sair vários blocos (`13-016`, `13-017`, ...), cada um com no máximo 3 arquivos.
**Responsável:** Haiku
**Depende de:** 13-005, Q4
**Toca:** candidatos (a confirmar): `index.html`, `src/main.tsx`, `src/mocks/db/` (carga do seed), componentes com `<img>`
**Paralelo:** não com blocos que toquem os mesmos arquivos. `main.tsx` e `index.html` são de um agente só.
**Lote:** F

## Objetivo
LCP de ~3,3 s para < 2,5 s e performance mobile de ~83 para ≥ 90, nas 4 páginas públicas, com o MSW ligado (o custo dele fica documentado).

## Candidatos (ordem provável; o 13-005 confirma ou descarta cada um)
1. **Sem pergunta (podem sair já que o 13-005 confirme):** `<link rel="preload">` da fonte principal (Roboto Mono, peso usado no LCP) em `index.html`; `<link rel="modulepreload">` dos chunks da rota inicial; `width`/`height` nas `<img>` que ainda não têm; `loading="lazy"` fora da primeira dobra (`LineItem`, `BlogCard` e `FeaturedNftCard` já têm); `fetchpriority="high"` na imagem do LCP de `/nft/<id>`; `<title>`/`meta description` por rota (já existe `useRouteChrome`; conferir).
2. **Só com a Q4:** semear o banco do mock de forma preguiçosa (só o que a rota pede) ou fora da thread principal; iniciar a busca dos chunks do app em paralelo com o `startMocking()` mantendo a avaliação do `socket.io-client` depois do MSW (a ordem em `main.tsx` existe por causa do WebSocket capturado na avaliação do módulo).
3. **Imagens:** as 4 imagens do seed já são WebP; nada a converter. Se o 13-005 achar imagem maior que o necessário no LCP, redimensionar o arquivo (mesmo formato, sem pipeline nem dependência).

## Critérios de aceite
- [ ] `npm run lhci`: performance ≥ 90, LCP < 2,5 s, CLS < 0,1 nas 4 páginas públicas (o número medido entra no `decisoes.md` pelo Opus).
- [ ] Nenhum teste existente quebra (suíte completa no fechamento); nenhum `await` de `startMocking()` removido sem a Q4.

# 13-005 — Diagnóstico de desempenho (LHCI) antes de mexer no código

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low)
**Depende de:** 13-006
**Toca:** — (só medição; relatório entregue ao Opus)
**Paralelo:** não.
**Lote:** —

## Objetivo
Medir onde vão os ~3,3 s de LCP e a nota mobile ~83 (metas: LCP < 2,5 s, performance ≥ 90, CLS < 0,1, INP < 200 ms) e propor correções **mensuráveis**, sem chutar.

## Instruções
1. `npm run lhci` (3 execuções por página, perfil mobile) com a configuração do 13-006. Os JSON ficam em `.lighthouseci/`.
2. Ler, por página: elemento do LCP (`largest-contentful-paint-element`), `network-requests` em ordem (cascata: `index.html` → `main` → `mocks/browser` → seed → `Providers`/`AppRouter` → chunk da rota → imagem), `bootup-time` e `main-thread-tasks` (custo do `ensureSeeded` e do MSW), `unused-javascript`, `render-blocking-resources`, `font-display` e pré-carregamento da fonte, `uses-responsive-images` e os atributos `width`, `height`, `loading` e `fetchpriority` das `<img>`.
3. **Já sabido:**
   - as 4 imagens do seed já são WebP (34–49 KB cada): **não há conversão nem pipeline de imagem a fazer**;
   - o hero já usa `loading="eager"` e `fetchPriority="high"` no primeiro slide;
   - o `main.tsx` espera `startMocking()` (que semeia o banco) antes de importar o app, e o comentário diz que a ordem é obrigatória por causa do `socket.io-client`; a cascata é a suspeita principal;
   - o relatório de `.lighthouseci/` hoje no disco é da fase 00 (perf 99, LCP 1,6 s): não vale como referência.
4. Entregar uma tabela "causa → ganho estimado (ms) → arquivo(s) → risco", por ganho. **Mudança em `main.tsx` (ordem de boot), no seed (semear preguiçoso ou fora da thread principal), em dependência ou em pipeline vira pergunta** (Q4). Correções que não mexem em arquitetura (atributos de `<img>`, `<link rel="preload">` da fonte e da imagem do hero, `modulepreload`) viram blocos Haiku (13-016 em diante).
5. Registrar o custo do MSW (exigência de `qualidade/lighthouse.md`): medir uma vez com `VITE_API_MOCKING` desligado, só para comparar. É um build temporário no scratchpad, nada commitado.

## Critérios de aceite
- [ ] Notas e métricas atuais das 4 páginas públicas (e das logadas, se o 13-006 permitir).
- [ ] Lista de blocos de correção propostos, cada um com arquivo, mudança e ganho esperado.

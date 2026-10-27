# 13-005 — Diagnóstico de desempenho (LHCI) antes de mexer no código

**Status:** concluído (medição; correções de boot aguardam a Q4)
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
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

## Resultado (2026-10-27)

| Página | Perf | A11y | Boas práticas | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/` | 94 | 97 | 100 | 92 | 2,74 s | 0 | 71 ms |
| `/nft/emerald-ape-042` | 86 | 96 | 100 | 92 | 3,06 s | 0 | 297 ms |
| `/carrinho` | 89 | 100 | 100 | 91 | 2,79 s | 0 | 255 ms |
| `/entrar` | 90 | 100 | 100 | 92 | 2,87 s | 0 | 202 ms |
| `/pagamento` (logado) | 87 | 100 | 100 | 91 | 3,41 s | 0 | 170 ms |
| `/perfil/dados` (logado) | 93 | 100 | 100 | 91 | 2,94 s | 0 | 88 ms |

- Mediana de 3 execuções por página, perfil mobile, MSW ligado, build de teste (`npm run lhci`).
- O healthcheck do LHCI não acha o Chrome sozinho nesta máquina: rodar com `CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"`. O Chromium do Playwright não serve (o Lighthouse não consegue abrir a porta de depuração).
- **Acessibilidade 96–97 em `/` e `/nft`:** só a auditoria `target-size`. Os indicadores dos carrosséis (`CarouselDots`) têm 6–8 px com 8 px de espaço, como no Figma; atingir 24 px exige mudar o layout. Decisão do usuário (pendente).
- **Performance e LCP abaixo da meta (≥ 90 e < 2,5 s):** CLS 0 em tudo; o LCP vem da cascata de boot (`main.tsx` espera `startMocking()`, que semeia o IndexedDB, antes de importar o app). Mexer nisso é a Q4 (arquitetura), ainda sem resposta.

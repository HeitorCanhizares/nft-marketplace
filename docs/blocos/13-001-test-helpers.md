# 13-001 — Helpers compartilhados dos testes de borda

**Status:** pendente
**Responsável:** Sonnet
**Depende de:** — (primeiro bloco da fase 13)
**Toca:** `tests/e2e/helpers.ts` (alterar; **arquivo de registro**, só o lote A mexe)
**Paralelo:** não. Todos os blocos de teste (13-020 em diante) dependem dele.
**Lote:** A

## Objetivo
Acrescentar ao `helpers.ts` o que os blocos de borda repetem, para cada spec não reimplementar. Nenhum spec novo edita `helpers.ts` depois deste bloco (se faltar algo, o spec define um helper local, como os specs atuais já fazem com `only`, `go` e `signIn`).

## Instruções
1. `recordApi(page)`: escuta `page.on('request')` e devolve `{ calls(method, pathPattern), last(...), clear() }` com método, caminho, query e corpo JSON das chamadas a `/api/...`. Serve para conferir **os parâmetros exatos** enviados a `GET /api/nfts`, o número de `POST /orders` e de `PATCH /cart/items`. Não usa `page.route` (não altera a resposta).
2. `delayApi(page, pattern, ms, { once })` e `failApi(page, pattern, status | 'abort', { times })`: encapsulam `page.route` para atrasar, devolver 5xx ou abortar uma rota da API quando um **cenário do mock não basta** (ex.: resposta fora de ordem com atrasos escolhidos). Preferir sempre o cenário forçado do mock (`openApp(page, 'server-error:GET /nfts')`); estes dois são a exceção.
3. `signInAs(page, user)` (usa `window.__kurio.auth.signIn` com `users.primary` ou `users.other` de `fixtures.ts` e espera `authState` = `authenticated`) e `only(testInfo, project)`: cópias dos helpers hoje duplicados nos specs. Os specs antigos **não** são mexidos.
4. `scenarios(page, value)`: grava `localStorage['kurio:mock:scenarios']` com `addInitScript` (é o que `openApp` já faz; extrair para uso antes de um `goto` que não seja `/`).
5. O relógio (`page.clock`) **não** entra aqui: os specs que precisam o usam direto (13-020, 13-040 etc.).
6. Sem credenciais novas (só `fixtures.ts`), sem `waitForTimeout`, sem `any`, sem casts.

## Regras dos specs de borda (valem para 13-020 a 13-093)
1. **Um spec por grupo**, nomes de teste em PT-BR iniciando pelo número do item do bloco ("3. ..."), como `login.spec.ts`. Projetos: os testes rodam nos 4 (desktop, mobile, firefox, webkit); marcar `[d]`/`[m]` no nome e usar `only(testInfo, ...)` quando o caso existe só em um layout (cards mobile sem carrinho, painel fixo, `Sheet`).
2. Seletores: `getByRole`, `getByLabel`, `getByText`. Sem CSS nem `data-testid` (exceção só quando não houver alternativa acessível, justificada num comentário). Credenciais só de `tests/e2e/fixtures.ts`.
3. **Sem `waitForTimeout`.** Esperas com `expect(...)`, `expect.poll` ou `page.clock` (hero, 60 s do pedido, 6 s do "Desfazer", 30 s do bloqueio de login, `QUOTE_TTL`). Latência do teste é 50 ms; cenários lentos usam `slow`/`jitter`.
4. Cenário forçado por `openApp(page, '<cenário>')` ou `scenarios()` antes do `goto` (decisão A6). Cenário por rota: `server-error:GET /nfts`, `unavailable:GET /home`, `network-error:PATCH /cart/items/...`.
5. Chamadas à API conferidas com `recordApi` (parâmetros e contagem). Estado do mock lido/alterado por `window.__kurioMock.stores.*`, `triggerPriceChange`, `triggerStockChange` e `dropConnections`.
6. Axe (`@axe-core/playwright`): só `serious`/`critical`, como nos `*-a11y.spec.ts` atuais; para menus Radix abertos, a mesma exclusão de `aria-hidden-focus` que o `layout.spec.ts` usa.
7. **Se um valor do mock ou do app não bater com o do bloco, parar e avisar.** Se o teste revelar **bug do app**, o Sonnet cria `13-1NN-fix-<slug>.md` (Haiku, ≤ 3 arquivos, com o teste que o reproduz) e o teste fica no spec, vermelho até a correção entrar; nada de `test.fixme`/`skip` sem aprovação do Opus.
8. Ao escrever, rodar só o spec do bloco em `--project=desktop --project=mobile`. Firefox e WebKit rodam a suíte inteira uma vez no fechamento (13-095).
9. Sem `eslint-disable`, sem `any`, sem casts, sem `!`. Código dentro de `page.evaluate` que use DOM começa com `/// <reference lib="dom" />` (como em `home.spec.ts`).

## Critérios de aceite
- [ ] `npm run typecheck` e `npm run lint` verdes; os specs existentes continuam passando (rodar `smoke` e `home`).
- [ ] Cada helper tem um comentário de uma linha com o uso.

## Verificação
- `npm run typecheck && npm run lint && npm run test:e2e -- smoke home --project=desktop`.

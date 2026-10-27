# 12-018 — Acessibilidade e baseline visual da Confirmação

**Status:** concluído
**Fluxo / subitem:** Confirmação › todos (modo enxuto)
**Depende de:** 12-017
**Toca:** `tests/e2e/order-confirmation-a11y.spec.ts` (novo), `tests/visual/order-confirmation.spec.ts` (novo)
**Paralelo:** os dois arquivos são independentes entre si, mas dependem do `seedOrder` do 12-017 (mesmo agente do lote K).
**Lote:** K (depois do 12-017)

> **Modo enxuto** (docs/decisoes.md): axe nas telas principais e **uma** baseline por tela (desktop e mobile). Estados e casos de borda ficam no 12-020.

## Objetivo
Axe no recibo e no estado pendente, e a baseline visual do recibo (a tela do Figma).

## Arquivos (testes)
- criar: `tests/e2e/order-confirmation-a11y.spec.ts`
- criar: `tests/visual/order-confirmation.spec.ts`

## Referências
- `tests/e2e/checkout-a11y.spec.ts` (`seriousViolations`, só `serious`/`critical`), `tests/visual/checkout.spec.ts` (`SHOT`, `settle`, movimento reduzido), `seedOrder` (12-017), `docs/design/telas/desktop-confirmacao.png` (1440 × 1657)
- docs/qualidade/acessibilidade.md (diálogos: foco no título, Esc fecha); docs/api-mock/cenarios.md (`payment-slow`)

## Instruções
1. `order-confirmation-a11y.spec.ts` (`test.setTimeout(60_000)`; os dois projetos):
   - Logar como `users.primary` (como no `checkout-a11y.spec.ts`), `seedOrder({ status: 'confirmed' })`, abrir `/pedido/<id>`: axe sem violações `serious`/`critical`. Desktop: o `dialog` "Pedido confirmado" está aberto, o foco está **dentro** dele e `Escape` leva a `/`. Mobile: `main` com `h1` "Pedido" e `h2` com o título do recibo.
   - Estado **pendente:** `localStorage['kurio:mock:scenarios'] = 'payment-slow'` **antes** do `seedOrder({ status: 'pending' })` (senão confirmaria em 3 s no meio do axe); abrir `/pedido/<id>`: axe sem violações graves; `getByRole('status')` com "Confirmando pagamento...".
   - Nomes acessíveis: o botão de copiar tem nome "Copiar ID da transação" e o ID completo (`0x` + 64 hexadecimais) está no texto acessível.
2. `tests/visual/order-confirmation.spec.ts` (uma captura por projeto, `animations: 'disabled'`, `caret: 'hide'`, `maxDiffPixelRatio: 0.01`, movimento reduzido, `settle` como no Pagamento):
   - Usuário `teste`, `seedOrder({ status: 'confirmed' })` com o snapshot do Figma (data 29/07/2026, `0xA91F…E82C`, total `26.846`), abrir `/pedido/<id>`.
   - **Desktop:** `page.setViewportSize({ width: 1440, height: 1657 })` **antes** de abrir (o modal fica a 166 px do topo, como no Figma) e `toHaveScreenshot('confirmacao.png', SHOT)` (sem `fullPage`, o modal é fixo).
   - **Mobile:** `toHaveScreenshot('confirmacao.png', { ...SHOT, fullPage: true })`.
   - **Diferenças conhecidas para o Figma:** data em pt-BR ("29 de jul. de 2026"), rótulos da faixa todos em negrito, legenda "Transação simulada" abaixo do botão, botão de copiar ao lado do ID, edição abaixo do ID do token (decisão Q5), mobile **adaptado** (não existe no Figma). **A baseline só é aprovada pelo usuário no checkpoint.**
3. `npm run test:e2e -- order-confirmation-a11y` verde nos dois projetos; gerar a baseline com `npx playwright test tests/visual/order-confirmation.spec.ts --update-snapshots`. Commit: `git commit -m "12-018: a11y e baseline da confirmação" -- <arquivos e baselines>`.

## Critérios de aceite
- [ ] Sem `waitForTimeout`; seletores por papel e nome.
- [ ] Nenhum teste de recusa, 403/404, overflow a 320 px, zoom, teclado completo ou estados além do pendente e do confirmado.
- [ ] Se um valor do mock não bater com o do spec, **parar e avisar**, não ajustar o teste.

## Verificação (Sonnet)
- Specs verdes; uma captura lado a lado com `desktop-confirmacao.png` (medidas dos blocos 12-006 a 12-010) no 12-019.

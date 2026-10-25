# 00-021 — Teste de fumaça

**Status:** pendente
**Responsável:** Sonnet (o Haiku não escreve testes)
**Fluxo / subitem:** Fase 00 › Playwright (teste de fumaça)
**Depende de:** 00-020, 00-008

## Objetivo
Provar que o app sobe no build de preview, nos dois projetos, e que o axe funciona.

## Arquivos
- criar: `tests/e2e/smoke.spec.ts`

## Referências
- docs/qualidade/testes.md (seletores por papel; axe só `serious` e `critical`)

## Instruções
O Sonnet escreve o teste, com seletores `getByRole`, sem CSS nem `data-testid`:
1. "a página inicial carrega": `goto('/')`; `getByRole('heading', { name: 'Kurio' })` visível; `html` com `lang="pt-BR"`; `title` igual a "Kurio".
2. "o projeto tem o viewport esperado": `viewportSize()` é 1440×900 no projeto `desktop` e 414×896 no `mobile` (usando `test.info().project.name`).
3. "sem violações graves de acessibilidade": `new AxeBuilder({ page }).analyze()`, falhando só se houver violações `serious` ou `critical`.
4. O teste não depende do MSW (ele só entra na fase 02).

## Critérios de aceite
- [ ] `npm run test:e2e` → 6 testes passando (3 por projeto).
- [ ] Nenhum `data-testid` nem seletor CSS.
- [ ] Rodar duas vezes seguidas dá o mesmo resultado.

## Verificação (Sonnet)
- `npm run test:e2e` → 6 passed.
- `npm run lint && npm run format:check && npm run typecheck` → exit 0.
- Commit: `git add tests/e2e/smoke.spec.ts` e `git commit -m "00-021: teste de fumaça do Playwright"`.

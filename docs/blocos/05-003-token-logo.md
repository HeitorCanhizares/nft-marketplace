# 05-003 — Token de fonte do logo (32 px)

**Status:** concluído
**Fluxo / subitem:** Login/Cadastro › mobile (logo KURIO)
**Depende de:** 01-003
**Depende de decisão:** pergunta 10 do relatório da fase 05 (token novo)

## Objetivo
Criar o token `--text-logo: 32px`, usado só pelo logo da tela de Login e Cadastro no mobile, e registrá-lo no `cn` para a classe `text-logo` não ser descartada.

## Arquivos
- alterar: `src/styles/globals.css`, `src/lib/utils.ts`

## Referências
- docs/design/tokens.md (escala 9–43 px; o token `--text-subtitle: 17px` foi criado do mesmo jeito na fase 04) e docs/design/componentes.md (regra do `cn`: token novo de fonte precisa ser registrado em `src/lib/utils.ts`)
- Captura: mobile-login.png (logo "KURIO": maiúsculas com 23 px de altura, de `y` 137 a 160 → fonte de ≈ 32 px; largura 154–260 px para 5 letras → passo ≈ 22,3 px, ou seja ≈ 3 px de espaçamento extra por letra, `tracking` ≈ 0,1 em)

## Instruções
1. `globals.css`, dentro de `@theme`: `--text-logo: 32px;`, entre `--text-heading` e `--text-display`.
2. `utils.ts`: acrescentar `'logo'` à lista de `font-size` do `createCn`.
3. Não criar nenhum uso ainda (o 05-021 usa `text-logo`). Atualizar a escala em docs/design/tokens.md é do Opus.
4. Fechamento: `npx prettier --write src/styles/globals.css src/lib/utils.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/styles/globals.css src/lib/utils.ts` e `git commit -m "05-003: token text-logo"`.

## Critérios de aceite
- [ ] `--text-logo` é `32px` e fica dentro do `@theme`.
- [ ] `cn('text-logo font-bold text-foreground')` preserva `text-logo` **e** `text-foreground` (a cor não é descartada).
- [ ] `tests/e2e/tokens.spec.ts` continua verde.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0; `npx playwright test tests/e2e/tokens.spec.ts` verde.
- Conferência do `cn` com um probe **não commitado**.

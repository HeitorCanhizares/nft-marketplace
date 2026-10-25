# 00-013 — ESLint

**Status:** pendente
**Fluxo / subitem:** Fase 00 › ESLint
**Depende de:** 00-012

## Objetivo
Configurar o ESLint 9 (flat config) com TypeScript, hooks do React, react-refresh e jsx-a11y, e criar o script `lint`.

## Arquivos
- criar: `eslint.config.js`
- alterar: `package.json` (script `lint`)

## Referências
- Config aprovada pelo usuário em 2026-10-25 (jsx-a11y reforça docs/qualidade/acessibilidade.md)
- Template `react-ts` do Vite (pasta temporária do 00-002) como referência de sintaxe

## Instruções
1. **ESLint 9** (aprovado pelo usuário; o `eslint-plugin-jsx-a11y` não suporta a 10): `npm install -D eslint@^9 @eslint/js@^9 typescript-eslint globals eslint-plugin-react-hooks eslint-plugin-react-refresh eslint-plugin-jsx-a11y`.
2. `eslint.config.js` (flat config, ESM) com:
   - `ignores`: `dist`, `src/routeTree.gen.ts`, `playwright-report`, `test-results`, `.lighthouseci`, `public/mockServiceWorker.js`.
   - Arquivos `**/*.{ts,tsx}`: `@eslint/js` recomendado, `typescript-eslint` recomendado, `react-hooks` (flat recomendado), `react-refresh` (config Vite) e `jsx-a11y` (flat recomendado).
   - `globals.browser` para `src/`; `globals.node` para `vite.config.ts` e `playwright.config.ts`.
   - Override: `react-refresh/only-export-components` **desligada** em `src/routes/**` e `src/components/ui/**` (arquivos de rota exportam `Route`; o shadcn exporta variantes).
3. Script `lint`: `eslint .`.
4. Não adicionar regras além das citadas. Se uma regra recomendada falhar em código existente, **corrigir o código** só se for trivial; senão avisar o Sonnet.
5. Commit: `git add eslint.config.js package.json package-lock.json` e `git commit -m "00-013: ESLint"`.

## Critérios de aceite
- [ ] `npm run lint` termina com exit 0, sem warnings.
- [ ] `jsx-a11y` ativo.
- [ ] `routeTree.gen.ts` ignorado.

## Verificação (Sonnet)
- `npm run lint` → exit 0.
- Sanidade (não commitada): criar `src/_probe.tsx` com `<img src="x" />` e uma variável não usada; `npm run lint` deve acusar `jsx-a11y/alt-text` e `no-unused-vars`. Apagar o arquivo.
- `npm run typecheck && npm run build` → exit 0.

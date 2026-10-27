# 13-093 — Varredura das regras de código

**Status:** pendente
**Responsável:** Sonnet
**Depende de:** blocos de correção da fase
**Toca:** — (relatório; correções viram blocos `13-1NN` para o Haiku)
**Paralelo:** não.
**Lote:** —
**Origem:** 06-068 (conferência de camadas/cores literais, `__kurio` fora do build de produção)

## Verificações (com `Grep`, sem alterar código)
1. Sem `eslint-disable` fora do que o `eslint.config.js` autoriza (`src/components/ui/**`), sem `@ts-ignore`/`@ts-expect-error`, sem `any`, sem asserções `as X` (exceto `as const`) e sem `!` não nulo em `src/` e `tests/`.
2. Sem cor literal (`#`, `rgb(`, `hsl(`, `oklch(` fora de `globals.css`); sem `px` arbitrário que ignore token onde houver token.
3. Camadas de `arquitetura/pastas.md`: `components/ui` não importa de `shared`/`hooks`/`services`; `components/shared` e `layout` não chamam hooks de API; `pages` não importam `axios`; `app` não importa de `mocks/` fora de `main.tsx`; `mocks` não importa do app.
4. `useAuth` sempre de `@/contexts/auth`; nenhum `ref` lido ou escrito durante o render (`react-hooks`); `validateSearch` de toda rota devolve as chaves; ETH como string decimal (sem `Number`/`parseFloat` em valores monetários).
5. **Build de produção** (`npm run build`): `dist/` não contém `__kurio` nem `__kurioMock` (ponte só em `MODE === 'test'`); o `mockServiceWorker.js` fica por exigência do MSW (documentar que o build de preview usa o mock).
6. Cada tela tem `<title>` próprio, `meta description`, `<html lang="pt-BR">`, um `h1`.

## Critérios de aceite
- [ ] Relatório com 0 violações ou lista de blocos de correção.

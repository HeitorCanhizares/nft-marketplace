# 05-038 — Guarda de favoritos (`/?favoritos=1`)

**Status:** pendente
**Fluxo / subitem:** Login › 8 (favoritos exige login; aba Favoritos da barra mobile, A4)
**Depende de:** 05-029, 05-033, 05-035

## Objetivo
Exigir login quando a Início é aberta com `favoritos=1`, mantendo `/` pública sem esse parâmetro.

## Arquivos
- alterar: `src/routes/index.tsx`

## Referências
- docs/arquitetura/rotas.md (`favoritos` = `1`, decisão A4; "favoritos" na lista de rotas protegidas) e docs/fluxos/inicio.md (subitem 9: filtro de favoritos exige login)
- `src/app/routeGuards.ts` (`requireAuth`)

## Instruções
1. Em `routes/index.tsx`, `beforeLoad: ({ context, search, location }) => (search.favoritos === 1 ? requireAuth({ context, location }) : undefined)`. `staticData`, `validateSearch` provisório e `component: Home` ficam.
2. Conferir que a guarda roda também quando só o `search` muda (de `/` para `/?favoritos=1` por link, sem recarregar).
3. Fechamento: `npx prettier --write src/routes/index.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/routes/index.tsx` e `git commit -m "05-038: guarda de favoritos"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`.
- [ ] Deslogado: `/?favoritos=1` → `/entrar?redirect=%2F%3Ffavoritos%3D1`; `/` e `/?q=a` continuam públicas.
- [ ] Deslogado, tocar em "Favoritos" na barra mobile leva ao login; depois de entrar, volta para `/?favoritos=1`.
- [ ] Logado: `/?favoritos=1` abre.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0; item 9 do `layout.spec.ts` (aba Favoritos) continua verde só logado — o 05-041 ajusta.
- Coberto no 05-046.

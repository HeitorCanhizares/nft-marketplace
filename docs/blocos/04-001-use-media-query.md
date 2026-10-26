# 04-001 — Hook useMediaQuery

**Status:** concluído
**Fluxo / subitem:** Fase 04 › Base de layout
**Depende de:** 03-020

## Objetivo
Criar o hook que diz se uma media query está ativa, com o breakpoint do projeto (A5: desktop a partir de `1024px`).

## Arquivos
- criar: `src/hooks/useMediaQuery.ts`

## Referências
- docs/decisoes.md (A5: abaixo de `1024px` é mobile)
- docs/arquitetura/pastas.md (`hooks/useMediaQuery` está na árvore aprovada)
- docs/arquitetura/rotas.md (Login, Cadastro e Confirmação trocam modal/página com este hook)

## Instruções
1. Exportar `DESKTOP_MEDIA_QUERY = '(min-width: 1024px)'`.
2. Exportar `useMediaQuery(query: string): boolean` com `useSyncExternalStore`: `subscribe` registra o evento `change` de `window.matchMedia(query)`; `getSnapshot` devolve `matchMedia(query).matches`; `getServerSnapshot` devolve `false`. Se `window.matchMedia` não existir, devolver `false`.
3. Exportar `useIsDesktop(): boolean` = `useMediaQuery(DESKTOP_MEDIA_QUERY)`.
4. **Não** usar `useState` + `useEffect` (o valor precisa estar certo já na primeira renderização no cliente, sem piscar).
5. Fechamento: `npx prettier --write src/hooks/useMediaQuery.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/hooks/useMediaQuery.ts` e `git commit -m "04-001: hook useMediaQuery"`. Não rodar `npm run format` global.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`.
- [ ] Sem `useEffect` + `useState` para ler a media query.
- [ ] O valor inicial no cliente já reflete a largura real.
- [ ] Os listeners são removidos ao desmontar.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Probe **não commitado** (`src/routes/_probe.tsx`, apagado ao final): mostra `useIsDesktop()`; ao redimensionar de 1023 para 1024 px o valor muda sem recarregar.
- Coberto de novo pelo teste de Toaster no 04-033.

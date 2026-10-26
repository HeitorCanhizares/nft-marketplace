# 06-021 — Hook `useDebounce`

**Status:** concluído
**Fluxo / subitem:** Início › 7 (busca mobile com debounce de 300 ms)
**Depende de:** 00-017

## Objetivo
Criar o hook que atrasa a propagação de um valor, usado pela barra de busca mobile.

## Arquivos
- criar: `src/hooks/useDebounce.ts`

## Referências
- docs/arquitetura/estado.md ("Busca com debounce de 300ms") e docs/arquitetura/pastas.md (`hooks/`: `useDebounce`)

## Instruções
1. `useDebounce<T>(value: T, delayMs = 300): T`: guarda o valor em `useState`; um `useEffect` agenda `setTimeout(() => setDebounced(value), delayMs)` e **limpa** o timer a cada mudança e ao desmontar.
2. Sem dependências novas. Export nomeado.
3. Fechamento: `npx prettier --write src/hooks/useDebounce.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/hooks/useDebounce.ts` e `git commit -m "06-021: hook useDebounce"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; digitar rápido gera **um** valor final depois de 300 ms de silêncio.
- [ ] O primeiro valor é o inicial (sem atraso na montagem).
- [ ] Nenhum timer fica vivo depois de desmontar.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Coberto no 06-062.

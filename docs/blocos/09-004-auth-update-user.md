# 09-004 — `updateUser` no `AuthContext`

**Status:** concluído
**Fluxo / subitem:** Perfil › 6 (cabeçalho atualiza o nome), 4 (avatar do `UserMenu`)
**Depende de:** 09-001

## Objetivo
Permitir que o perfil atualize o usuário da sessão para o `UserMenu` refletir nome e avatar na hora.

## Arquivos
- alterar: `src/contexts/auth.ts`
- alterar: `src/contexts/AuthContext.tsx`

## Referências
- `src/contexts/AuthContext.tsx` (`state`, `useMemo` do `value`), `src/components/layout/Header.tsx` (lê `user` do contexto)

## Instruções
1. `auth.ts`: em `AuthContextValue` acrescentar `updateUser: (user: User) => void` (comentário: troca só o usuário; sessão e expiração intactas).
2. `AuthContext.tsx`: `const updateUser = useCallback((user: User) => { setState((prev) => prev.status === 'authenticated' ? { ...prev, user } : prev) }, [])`; incluí-lo no `value` e nas dependências do `useMemo`. Não mexe em `lastUserId` nem na sessão salva.
3. `npm run typecheck`: se algum mock/ponte de teste construir `AuthContextValue` (ex.: `src/app/TestBridge.tsx`, `routerContext.ts`) e quebrar, ajustar **só o necessário** e avisar; se for mais de 1 arquivo extra, parar e perguntar.
4. Fechamento: prettier; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `09-004: updateUser no AuthContext`.

## Critérios de aceite
- [ ] `updateUser` não altera `status`, `expiresAt` nem `expiryWarning`; em `anonymous` não faz nada.
- [ ] Identidade estável (`useCallback`); sem `ref` lido no render.

## Verificação (Sonnet)
- format:check, lint, typecheck, build.

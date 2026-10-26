# 04-011 — Hook useSignOut

**Status:** pendente
**Fluxo / subitem:** Fase 04 › Base de layout (Login › 7. Logout)
**Depende de:** 04-010

## Objetivo
Centralizar a ação "Sair" (menu do cabeçalho, menu lateral do perfil e, na fase 09, a lista do mobile).

## Arquivos
- criar: `src/hooks/useSignOut.ts`

## Referências
- docs/fluxos/login.md (subitem 7: vai para a Início e anuncia "Você saiu da sua conta")
- `src/contexts/AuthContext.tsx` (`signOut` já chama a API, limpa a sessão privada e anuncia)

## Instruções
1. `useSignOut(): () => Promise<void>`: usa `useAuth().signOut` e `useNavigate()`.
2. Ordem: **primeiro** `await navigate({ to: '/' })`, **depois** `await signOut()`. Assim a página privada (perfil) sai da tela antes de o estado virar `anonymous`, sem piscar conteúdo de visitante. Comentar o porquê em uma linha.
3. Não anunciar nada aqui (o `AuthContext` já anuncia). Não tratar erro (o `signOut` já ignora falha da API).
4. Retornar uma função estável (`useCallback`).
5. Fechamento: `npx prettier --write src/hooks/useSignOut.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/hooks/useSignOut.ts` e `git commit -m "04-011: hook useSignOut"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`.
- [ ] Não importa Axios nem `services/api`.
- [ ] Uma única mensagem de "Você saiu da sua conta" (a do `AuthContext`).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Coberto no 04-033 (menu do usuário › Sair).

# 05-040 — Expiração: aviso e redirecionamento para o login

**Status:** pendente
**Fluxo / subitem:** Login › 6 (sem resposta: expira; `401 SESSION_EXPIRED` dispara o mesmo fluxo)
**Depende de:** 03-017, 05-035, 05-036
**Depende de decisão:** pergunta 16 do relatório da fase 05 (o rascunho do checkout é gravado pelo Pagamento, na fase 11)

## Objetivo
Quando a sessão expira (por tempo ou por `401 SESSION_EXPIRED`), avisar com um toast e levar o usuário a `/entrar?redirect=<página atual>`, para ele voltar ao mesmo ponto depois de entrar.

## Arquivos
- alterar: `src/app/Providers.tsx`

## Referências
- docs/arquitetura/estado.md (Expiração com preservação de contexto: durante a navegação guarda a rota atual em `redirect`, vai para `/entrar` e volta depois do login) e docs/api-mock/cenarios.md (`session-expired`: toast + aviso acessível, redireciona para `/entrar?redirect=...`, volta ao fluxo depois)
- `src/contexts/AuthContext.tsx` (`onExpired` opcional, chamado depois de `expire()`, que já anuncia "Sua sessão expirou." em assertive), `src/app/router.tsx`
- O **rascunho do Pagamento**: `kurio:checkout` e `kurio:checkout-draft` já **sobrevivem** à expiração (`expire()` não chama `clearPrivateSession`) e só são apagados se outro usuário entrar. Quem grava o rascunho é o Pagamento (fase 11); aqui não se mexe nele.

## Instruções
1. Em `Providers.tsx`, passar ao `AuthProvider` a prop `onExpired`: `toast('Sua sessão expirou. Entre novamente para continuar.')` e, se o `pathname` atual (`router.state.location.pathname`) **não** é `/entrar` nem `/cadastro`, `void router.navigate({ to: '/entrar', search: { redirect: router.state.location.href }, replace: true })`. Importar `router` de `@/app/router` e `toast` de `sonner`.
2. A guarda `requireAuth` também redireciona rotas protegidas quando o status vira `anonymous`; os dois caminhos levam ao **mesmo** destino com `replace`, então não duplicam histórico. Conferir no navegador que a URL final é uma só.
3. Nada de `announce` aqui (o `AuthContext` já anuncia).
4. Fechamento: `npx prettier --write src/app/Providers.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/app/Providers.tsx` e `git commit -m "05-040: expiração leva ao login"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`.
- [ ] Expirar em `/carrinho` → `/entrar?redirect=%2Fcarrinho` com o toast; em `/perfil/dados` idem (`redirect=%2Fperfil%2Fdados`), sem histórico extra.
- [ ] Expirar já em `/entrar` não navega de novo.
- [ ] `401 SESSION_EXPIRED` numa requisição qualquer (cenário `session-expired`) faz o mesmo.
- [ ] Depois de entrar, o usuário volta à página de origem.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Os testes da fase 03 que provocam expiração podem passar a ver o redirecionamento; o 05-041 os ajusta.
- Coberto no 05-045.

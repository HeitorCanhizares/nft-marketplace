# 03-016 — clearPrivateSession

**Status:** pendente
**Fluxo / subitem:** Fase 03 › Sessão
**Depende de:** 03-009, 03-011, 03-012, 03-013

## Objetivo
Implementar a rotina única que limpa dados privados no logout, na expiração seguida de outro usuário e na troca de usuário.

## Arquivos
- criar: `src/app/clearPrivateSession.ts`

## Referências
- docs/arquitetura/estado.md#logout-e-troca-de-usuário

## Instruções
1. `clearPrivateSession(queryClient)` executa, nesta ordem: (1) `queryClient.removeQueries` das raízes privadas (`PRIVATE_QUERY_ROOTS`) **e** das queries `nfts.*` que tenham `isFavorite` (remover todo `nfts.list`/`nfts.detail` é aceitável e mais seguro: justificar em comentário curto); (2) `clearSubscriptions()` e `reconnectSocket()` com o token atual (ou sem token); (3) `getWalletProvider()?.disconnect()`; (4) apagar `kurio:checkout` e `kurio:checkout-draft` do `sessionStorage`; (5) **não** apagar o `kurio:guest-cart-id` (o próximo carrinho de visitante é um carrinho novo: gerar um novo id com `clearGuestCartId()` e deixar a criação para o primeiro item).
2. Idempotente: chamar duas vezes seguidas não falha.
3. Sem React.
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/app/clearPrivateSession.ts` e `git commit -m "03-016: clearPrivateSession"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`.
- [ ] Camadas respeitadas (pastas.md): `services/api` não conhece React; `components/shared` e `contexts` não chamam Axios direto; nada importa de `src/mocks/` além de `main.tsx`.
- [ ] Mensagens ao usuário em PT-BR; código e nomes em inglês.
- [ ] Todas as 5 etapas do estado.md executadas, na ordem.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Testado no 03-019 (cache privado removido, inscrições zeradas, carteira desconectada, rascunho apagado, novo carrinho de visitante).

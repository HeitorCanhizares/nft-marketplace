# 03-019 — Testes da base do app

**Status:** pendente
**Responsável:** Sonnet
**Fluxo / subitem:** Fase 03 › Testes
**Depende de:** 03-001 a 03-018

## Objetivo
Provar a base do app com Playwright (desktop e mobile).

## Arquivos
- criar: `tests/e2e/app-base.spec.ts`

## Referências
- docs/qualidade/testes.md

## Instruções
O Sonnet escreve, sem `data-testid`, usando `window.__kurio` e `window.__kurioMock.msw` para registrar handlers de execução:
1. **Schemas:** validadores (usuário, e-mail, senha, endereço, ETH), `paginatedSchema`; os schemas de catálogo aceitam os dados do seed e rejeitam preço `number`.
2. **ApiError:** erro do servidor com corpo válido, rede, timeout (handler que demora > 10 s com `HTTP_TIMEOUT_MS`), cancelamento, resposta fora do contrato; `isRetryable`.
3. **Cliente HTTP:** `Authorization` com sessão; `X-Cart-Id` sem sessão (sem gerar id); `SESSION_EXPIRED` dispara `onSessionExpired` uma vez.
4. **Query:** GET com 500 é repetido 2 vezes (3 chamadas), 404 uma só, falha de rede 2 repetições; mutation não repete; `staleTime`.
5. **Chaves:** formato e prefixos de `queryKeys`.
6. **Anunciador:** `getByRole('status')` e `getByRole('alert')` recebem o texto; repetir a mesma mensagem atualiza duas vezes; o foco não muda.
7. **Socket:** conecta com token no handshake, reenvia inscrições após `dropConnections`, recebe `nft:price_changed`, `session:expired` dispara o evento de sessão.
8. **Carteira:** estados e anúncios do hook (via ponte de teste) para conexão, `wallet-rejected` e `wallet-disconnect`; `shortAddress`.
9. **Sessão:** `msUntilWarning`/`isExpired`, JSON inválido, id do carrinho do visitante.
10. **AuthContext:** sem token → `anonymous` sem chamada à API; com token válido, sessão recuperada após `reload`; token vencido → limpa e `anonymous`; erro de rede mantém o token; aviso 2 min antes e expiração (com relógio controlado por `page.clock`); troca de usuário chama a limpeza; `signOut` anuncia "Você saiu da sua conta".
11. **clearPrivateSession:** cache privado removido, inscrições zeradas, carteira desconectada, rascunho apagado, carrinho de visitante novo; idempotente.
12. **Produção:** o build de produção não contém `__kurio` nem `__kurioMock`.
Commit: `git add tests/e2e/app-base.spec.ts` e `git commit -m "03-019: testes da base do app"`.

## Critérios de aceite
- [ ] Todos passam nos projetos `desktop` e `mobile`, duas execuções seguidas.
- [ ] Nenhum `data-testid`.

## Verificação (Sonnet)
- `npm run test:e2e` → todos passando; lint, format, typecheck e build → exit 0.

# 13-013 — Carteira desconectada ao voltar ao Pagamento depois de uma recusa

**Status:** pendente (aguarda a pergunta Q2 e a reprodução do 13-081)
**Responsável:** Sonnet (reprodução) e Haiku (correção, só se a Q2 pedir mudança)
**Depende de:** 13-081 (reprodução), Q2
**Toca:** depende da resposta. Candidatos (máx. 3): `src/hooks/useCheckoutEntry.ts`, `src/hooks/useCheckoutWallet.ts`, `src/hooks/useWalletConnection.ts`
**Paralelo:** não com blocos que toquem esses hooks.
**Lote:** E

## Situação
Pedido `payment-declined` → "Tentar novamente" → `/pagamento`: o formulário vem preenchido (rascunho) e o provedor/rede estão no rascunho, mas o `WalletConnectionStatus` mostra "Não conectada". A conexão é estado em memória do `useWalletConnection` (por montagem da página), então não sobrevive à navegação. Já é assim na sessão expirada (`cenarios.md`: "pede reconexão da carteira").

## Passo do Sonnet (reprodução, no 13-081)
Teste que cobre: pagar com MetaMask → recusa → "Tentar novamente" → conferir (a) campos do colecionador, modo, observação, rede e provedor iguais aos de antes, (b) estado da conexão. O teste afirma o comportamento escolhido na Q2.

## Opções (ver Q2)
- **A (manter):** a conexão é por visita; o texto do estado orienta ("Conecte uma carteira para continuar.") e o provedor do rascunho vem destacado. Nenhuma mudança de código; só documentar em `fluxos/pagamento.md` e testar.
- **B (reconectar sozinho):** ao restaurar o rascunho com provedor e rede, o `useCheckoutWallet` chama `connect(provider, network)` uma vez. Cuidados: só depois de entrar pelo "Tentar novamente"/login, nunca quando o cenário for `wallet-rejected`; uma conexão por montagem; anúncio `aria-live` "Conectando à MetaMask..."; não reconectar se o usuário clicou em "Desconectar".

## Instruções (só no caminho B, depois do detalhamento do Sonnet)
1. Implementar no hook, sem estado novo em `localStorage` (o rascunho já guarda provedor e rede).
2. `npm run format:check && npm run lint && npm run typecheck && npm run build`.

## Critérios de aceite
- [ ] Caminho A: teste do 13-081 verde com o comportamento atual e `fluxos/pagamento.md` atualizado pelo Opus.
- [ ] Caminho B: após recusa → "Tentar novamente", a carteira volta "Conectada: 0xA91F…E82C" sem clique; `wallet-rejected` não entra em laço; "Desconectar" manual não reconecta.

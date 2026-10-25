# 02-002 — Tipos de conta, carteira e erros de API

**Status:** pendente
**Fluxo / subitem:** Fase 02 › Tipos de domínio
**Depende de:** 02-001

## Objetivo
Criar os tipos de usuário, sessão, carteira (inclusive a interface do provedor simulado) e do formato de erro.

## Arquivos
- criar: `src/types/user.ts`, `src/types/wallet.ts`, `src/types/api.ts`

## Referências
- docs/api-mock/contratos.md#sessão-e-conta, #perfil, #carteiras, #formato-de-erro
- docs/api-mock/cenarios.md#carteira-simulada-não-é-http
- docs/arquitetura/estado.md#carteira-serviceswallet

## Instruções
1. `user.ts`: `User`, `Session` (`{ token; expiresAt }`), `Wallet` (com `slot`, `provider`, `ensName` etc.), `WalletsResponse` (`{ primary: Wallet | null; secondary: Wallet | null }`).
2. `wallet.ts` (a **interface** do provedor, usada pelo simulador da fase 02 e por `services/wallet` na fase 03): `WalletConnectionStatus` (`'disconnected' | 'connecting' | 'connected' | 'rejected'`), `WalletConnection` (`{ address; network; provider }`), `WalletError` (`code: 'USER_REJECTED' | 'WRONG_NETWORK' | 'SIGN_REJECTED' | 'DISCONNECTED'`), `WalletEvents` (`accountsChanged`, `chainChanged`, `disconnect` com seus payloads) e `WalletProviderApi` com `connect(provider, network)`, `disconnect()`, `switchNetwork(network)`, `signOrder(orderRef: string)` (para o cenário `wallet-sign-rejected`), `on(event, handler)` retornando função de cancelamento.
3. `api.ts`: `ApiErrorCode` (união de todos os códigos da tabela de erros), `ApiErrorBody` (`{ error: { code; message; fields?; details? } }`).
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/types/user.ts src/types/wallet.ts src/types/api.ts` e `git commit -m "02-002: tipos de conta, carteira e erros"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; tipos exportados com nome.
- [ ] `src/mocks/**` não importa nada do app além de `src/types`, `src/schemas` e `src/lib` (regra de camadas de pastas.md).
- [ ] Comentários só onde o porquê não é óbvio.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Conferir que `ApiErrorCode` cobre todos os códigos de `contratos.md#formato-de-erro`.

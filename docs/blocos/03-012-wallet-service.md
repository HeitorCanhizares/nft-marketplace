# 03-012 — Serviço de carteira e hook de conexão

**Status:** pendente
**Fluxo / subitem:** Fase 03 › Carteira
**Depende de:** 03-010

## Objetivo
Registrar o provedor de carteira (simulado) e expor o estado de conexão num hook.

## Arquivos
- criar: `src/services/wallet/index.ts`, `src/hooks/useWalletConnection.ts`, `src/lib/address.ts`

## Referências
- docs/arquitetura/estado.md#carteira-serviceswallet
- docs/api-mock/cenarios.md#carteira-simulada-não-é-http (textos)
- src/types/wallet.ts (`WalletProviderApi`)

## Instruções
1. `services/wallet/index.ts`: `registerWalletProvider(api: WalletProviderApi)`, `getWalletProvider(): WalletProviderApi | null` e `hasWalletProvider()`. Sem implementação real de carteira: em produção sem o simulador, `getWalletProvider()` devolve `null`.
2. `lib/address.ts`: `shortAddress(address)` → `0xA91F…E82C` (4 caracteres depois do `0x`, reticência `…`, 4 finais) e `isHexAddress`.
3. `hooks/useWalletConnection.ts`: estado `{ status: 'disconnected' | 'connecting' | 'connected' | 'rejected', address, network, provider, error }` e ações `connect(provider, network)`, `disconnect()`, `switchNetwork(network)`. Escuta `disconnect`, `accountsChanged` e `chainChanged` do provedor e atualiza o estado; cancela as inscrições ao desmontar. **Anuncia** (via `useLiveAnnouncer`) em PT-BR: "Conectando à MetaMask...", "Conectada: 0xA91F…E82C", "Conexão recusada na carteira", "Carteira desconectada", "Rede alterada para Polygon". Sem provedor registrado, `connect` vira estado `rejected` com mensagem "Carteira indisponível".
4. Não é estado do servidor (não usa Query) nem Context global: só o Pagamento usa.
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/services/wallet/index.ts src/hooks/useWalletConnection.ts src/lib/address.ts` e `git commit -m "03-012: serviço de carteira"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`.
- [ ] Camadas respeitadas (pastas.md): `services/api` não conhece React; `components/shared` e `contexts` não chamam Axios direto; nada importa de `src/mocks/` além de `main.tsx`.
- [ ] Mensagens ao usuário em PT-BR; código e nomes em inglês.
- [ ] O hook cancela as inscrições do provedor ao desmontar.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Testado no 03-019 (via ponte de teste: estados e anúncios com os cenários `wallet-rejected` e `wallet-disconnect`).

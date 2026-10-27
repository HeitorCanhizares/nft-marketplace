# 10-001 — Schemas do formulário de carteira, opções e serviço

**Status:** pendente
**Fluxo / subitem:** Carteiras › 6 (validação), 7 (persistência)
**Depende de:** —

## Objetivo
O schema zod **único** do `WalletForm` (usado por Carteiras agora e pelo Pagamento na fase 11), as opções de rede e provedor, a conversão formulário ⇄ `Wallet` e as chamadas HTTP de `/wallets`.

## Arquivos
- criar: `src/schemas/wallet.ts`
- criar: `src/lib/walletOptions.ts`
- criar: `src/services/api/wallets.ts`

## Referências
- Contrato: docs/api-mock/contratos.md#carteiras; docs/fluxos/carteiras.md (subitens 2, 3, 6)
- Já existem (não recriar): `walletSchema`, `walletsResponseSchema` (`src/schemas/user.ts`), `walletAddressSchema`, `networkSchema`, `walletProviderSchema`, `emailSchema`, `usernameSchema` (`src/schemas/common.ts`), `displayNameSchema`, `walletNicknameSchema`, `ensLabelSchema`, `ENS_SUFFIX`, `toEnsName` (`src/schemas/profile.ts`), tipos `Wallet`, `WalletsResponse`, `User` (`src/types/user.ts`)
- Padrão de serviço: `src/services/api/profile.ts` (`get`, `put`, `del`, `post` de `@/services/http/validate`); padrão de schema: `src/schemas/profile.ts`

## Instruções
1. **`src/lib/walletOptions.ts`** — exporta `NETWORK_OPTIONS: { value: Network; label: string }[]` (Ethereum, Polygon, Solana, nessa ordem) e `PROVIDER_OPTIONS: { value: WalletProvider; label: string }[]` (MetaMask, WalletConnect, Coinbase Wallet), mais `networkLabel(network)` e `providerLabel(provider)`. Não mexer no `useWalletConnection.ts` (as tabelas dele continuam lá).
2. **`src/schemas/wallet.ts`**:
   - `walletCoreShape` (objeto simples, não exportado) = campos **comuns** ao Carteiras e ao Pagamento: `displayName` (`displayNameSchema`, 1–40), `profileName` (trim, 1–40, "Informe o nome do perfil."), `network` (`networkSchema`; vazio → "Selecione uma rede."), `address` (`walletAddressSchema`: `0x` + 40 hex), `secondaryAddressOrEns` (opcional: vazio **ou** `0x` + 40 hex **ou** nome ENS `rótulo.eth` com rótulo de 3–63 minúsculas/números/hífen; mensagem "Use um endereço 0x ou um nome .eth."), `provider` (`walletProviderSchema`; vazio → "Selecione uma carteira."), `referralCode` (trim, 3–20, só letras, números, `_` e `-`; "Informe o código de indicação."), `email` (`emailSchema`), `ensLabel` (`ensLabelSchema` **não vazio**: "Informe o nome ENS."). Para `network` e `provider`, aceitar `''` como valor inicial do formulário e acusar o erro de "obrigatório" (use `z.string().refine`/`pipe` ou `z.enum` com `error`; o importante é o campo começar `''` e a mensagem sair no envio).
   - *(Ajustado no 10-004: não há `walletCoreSchema`; a base é `walletCoreShape`; os dois schemas são `z.object` com os mesmos campos, `nickname: string` e `username: string`, e há um tipo único `WalletFormValues`.)*
   - `walletsFormSchema` (campos comuns + `nickname`; `username: z.string()`) — `nickname` obrigatório: `walletNicknameSchema` com `min(1, "Informe o apelido da carteira.")`. Este é o formulário da tela Carteiras (campo 2 = Apelido da carteira).
   - `checkoutWalletFormSchema` (campos comuns + `username: usernameSchema`; `nickname: z.string()`) — usado só na fase 11 (campo 2 = Nome de usuário). Exportar agora para o Pagamento não redefinir regras.
   - Tipo: `WalletFormValues = z.input<typeof walletsFormSchema>` (vale para os dois formulários).
   - `walletBodySchema` (corpo do `PUT`, usado pelo mock e pelo serviço): todos os campos de `Wallet` sem `id`/`slot`, com `ensName` no formato `rótulo.eth` obrigatório (regex `^[a-z0-9-]{3,63}\.eth$`), `nickname` 1–30, `username` = `usernameSchema`, `secondaryAddressOrEns` como acima. Tipo `WalletBody`.
   - `toWalletFormValues(wallet: Wallet | null, user: User | null): WalletFormValues` — com `wallet`: copia os campos, `ensLabel` = `ensName` sem o `.eth`. Sem `wallet`: **pré-preenche com o perfil**: `displayName` = `user.displayName`, `email` = `user.email`, `ensLabel` = `user.ensName` sem `.eth`, `nickname` = `user.walletNickname ?? ''`; `username` = `user.username`; o resto vazio (`network` e `provider` `''`; `profileName` vazio). `user` nulo → tudo vazio.
   - `toWalletBody(values: WalletFormValues): WalletBody` — `ensName = toEnsName(ensLabel)`, `secondaryAddressOrEns` omitido se vazio, `username` = `values.username` (em Carteiras o campo não aparece: `toWalletFormValues` o preenche com o da carteira ou, sem carteira, o do perfil).
   - `copyWalletValues(wallet: Wallet): WalletFormValues` — o "Igual à carteira principal": igual a `toWalletFormValues(wallet, null)`.
3. **`src/services/api/wallets.ts`**: `getWallets(signal?)` → `get('/wallets', walletsResponseSchema, { signal })`; `savePrimaryWallet(body: WalletBody)` → `put('/wallets/primary', walletSchema, body)`; `saveSecondaryWallet(body)` → `put('/wallets/secondary', walletSchema, body)`; `removeSecondaryWallet()` → `del('/wallets/secondary', null)`; `swapWallets()` → `post('/wallets/swap', walletsResponseSchema, undefined)` (seguir o padrão de `changePassword` para corpo vazio).
4. Fechamento: prettier nos 3; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `10-001: schemas e serviço de carteiras`.

## Critérios de aceite
- [ ] Endereço `0x` + 40 hex (maiúsculas e minúsculas); 39 ou 41 caracteres, sem `0x` ou com caractere não hexadecimal → "Endereço de carteira inválido.".
- [ ] Os dois schemas têm o mesmo tipo de entrada (`nickname` e `username` `string`); só as regras diferem.
- [ ] Sem `any`, sem `@ts-ignore`; mensagens em português, sem hexadecimal de cor.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Comportamento exercitado pelo spec do 10-010.

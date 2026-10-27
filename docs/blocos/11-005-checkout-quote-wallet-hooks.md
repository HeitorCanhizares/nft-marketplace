# 11-005 — Hooks de cotação do checkout e de conexão da carteira

**Status:** pendente
**Fluxo / subitem:** Pagamento › 5, 6
**Depende de:** 11-001
**Toca:** `src/hooks/useCheckoutQuote.ts` (novo), `src/hooks/useCheckoutWallet.ts` (novo)
**Paralelo:** pode rodar com 11-006, 11-007, 11-008, 11-010 (depois do 11-001/11-004). `queryKeys.ts` **não** é alterado (o ramo `quote(...)` já aceita qualquer objeto).
**Lote:** E (junto com 11-010)

## Objetivo
(1) A cotação do Pagamento, refeita ao mudar rede, cupom, carrinho ou ao vencer. (2) A escolha do provedor, que já conecta a carteira simulada, com recusa, desconexão e rede diferente.

## Arquivos
- criar: `src/hooks/useCheckoutQuote.ts`
- criar: `src/hooks/useCheckoutWallet.ts`

## Referências
- docs/fluxos/pagamento.md subitens 5 e 6; docs/api-mock/cenarios.md#carteira-simulada-não-é-http
- `src/hooks/useCartQuote.ts` (padrão `useQuery` + `keepPreviousData`), `src/hooks/queryKeys.ts` (`quote`, `quoteAll`), `src/hooks/useWalletConnection.ts` (já pronto: `status`, `address`, `network`, `provider`, `error`, `connect`, `disconnect`, `switchNetwork`; anuncia os estados), `getCheckoutQuote` (11-001), `src/types/cart.ts`

## Instruções
1. `useCheckoutQuote(cart: Cart | undefined, network: Network | null)`:
   - `useQuery` com `queryKey: quote({ checkout: true, cartVersion: cart?.version, coupon: cart?.coupon?.code ?? null, network })`, `queryFn: ({ signal }) => getCheckoutQuote({ network: network ?? undefined }, signal)`, `enabled` com carrinho não vazio, `placeholderData: keepPreviousData`.
   - Vence sozinha: `refetchInterval: (query) => ` tempo até `query.state.data.expiresAt` (mínimo 1000 ms; sem dado, `false`).
   - Devolve `{ quote, isUpdating, isError, refetch, refresh }`. `refresh(): Promise<Quote>` usa `queryClient.fetchQuery` com a mesma chave e `staleTime: 0` (cotação **nova** garantida; atualiza o cache).
2. `useCheckoutWallet(expectedNetwork: Network | null, provider: WalletProvider | null, setProvider: (provider: WalletProvider | null) => void)`: o `provider` e o `setProvider` vêm do `useCheckoutForm` (11-007), porque o provedor faz parte do rascunho.
   - `const connection = useWalletConnection()`.
   - `choose(next: WalletProvider)`: sem `expectedNetwork`, **não conecta** e define `hint = 'Selecione uma rede antes de escolher a carteira.'` (anunciado com `useLiveAnnouncer`, `assertive`); com rede: `setProvider(next)` e `void connection.connect(next, expectedNetwork)`.
   - `reconnect()`: `connection.connect(provider, expectedNetwork)` (usado em "Tentar novamente" e depois de uma desconexão); sem provedor ou sem rede, nada.
   - `switchToExpected()`: `connection.switchNetwork(expectedNetwork)`.
   - `changeWallet()` ("Trocar carteira"): `setProvider(null)` e `connection.disconnect()`.
   - `isMismatch = connection.status === 'connected' && expectedNetwork !== null && connection.network !== expectedNetwork`.
   - `isReady = connection.status === 'connected' && !isMismatch`.
   - Devolve `{ connection, provider, hint, choose, reconnect, switchToExpected, changeWallet, isMismatch, isReady }`. Estado derivado no render; **sem `ref` lido no render**; nenhum estado extra além de `hint`.
3. Fechamento: prettier nos 2; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0 (se falhar por arquivo de **outro** agente, esperar e repetir). Commit só dos 2: `git commit -m "11-005: hooks de cotação e carteira do checkout" -- <arquivos>`.

## Critérios de aceite
- [ ] Trocar a rede muda a chave e refaz a cotação (taxa nova); a cotação anterior fica na tela enquanto recalcula.
- [ ] `refresh()` sempre bate no servidor.
- [ ] Escolher o provedor com rede definida chama `connect(provider, network)` uma vez; sem rede, não chama.
- [ ] Sem `any`, `as` ou `@ts-ignore`; sem `ref` no render.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Conexão, recusa e desconexão: caminho principal no 11-018; o resto no 11-020.

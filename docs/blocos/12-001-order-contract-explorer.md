# 12-001 — Serviço `getOrder` e utilitário do explorador

**Status:** concluído
**Fluxo / subitem:** Confirmação › 3, 5, 7
**Depende de:** —
**Toca:** `src/lib/explorerUrl.ts` (novo), `src/services/api/orders.ts` (alterar)
**Paralelo:** pode rodar com os lotes B, C e D da onda 1. Os blocos 12-002, 12-003, 12-009 e 12-011 esperam este.
**Lote:** A (mesmo agente de 12-002 e 12-003)

## Objetivo
`GET /orders/:id` no serviço HTTP e as funções puras que dão o nome do explorador e a URL simulada da transação conforme a rede (usadas pelo mock **e** pelo front).

## Arquivos
- criar: `src/lib/explorerUrl.ts`
- alterar: `src/services/api/orders.ts`

## Referências
- docs/fluxos/confirmacao.md subitem 5; docs/api-mock/contratos.md#pedidos (`Order.explorerUrl`: "formato do explorador da rede com o txHash fictício")
- docs/arquitetura/pastas.md (`lib/`: "formatEth, explorerUrl, storage")
- `src/services/api/orders.ts` (padrão de `get`/`post`), `src/schemas/order.ts` (`orderSchema`), `src/lib/address.ts` (`shortAddress` já formata `0xA91F…E82C`, serve para o hash), `src/types/nft.ts` (`Network`)

## Instruções
1. `src/lib/explorerUrl.ts` (sem React, sem importar de `mocks/`):
```ts
export function explorerName(network: Network): string          // 'Etherscan' | 'Polygonscan' | 'Solscan'
export function buildExplorerUrl(network: Network, txHash: string): string
export function isExplorerUrl(url: string): boolean
```
   - Bases: `ethereum` → `https://etherscan.io/tx/`, `polygon` → `https://polygonscan.com/tx/`, `solana` → `https://solscan.io/tx/`. `buildExplorerUrl` = base + `txHash`.
   - `isExplorerUrl`: `new URL(url)` dentro de `try/catch`; `true` só com protocolo `https:` e `hostname` igual a `etherscan.io`, `polygonscan.com` ou `solscan.io`. O recibo só mostra o botão do explorador quando isto é `true` (o `explorerUrl` vem da API e não é confiável por si).
   - Tabela única `Record<Network, { name: string; base: string }>`; sem `switch` duplicado.
2. `src/services/api/orders.ts`: acrescentar `getOrder(orderId: string, signal?: AbortSignal): Promise<Order>` → `get(`/orders/${encodeURIComponent(orderId)}`, orderSchema, { signal })`. Não mexer nas outras funções.
3. Fechamento: prettier nos 2; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0 (se falhar por arquivo de **outro** agente em andamento, esperar e repetir, sem mexer nele). Commit só dos 2: `git commit -m "12-001: getOrder e explorerUrl" -- <arquivos>`.

## Critérios de aceite
- [ ] `buildExplorerUrl('polygon', '0xabc…')` devolve `https://polygonscan.com/tx/0xabc…`; `explorerName('solana')` devolve `Solscan`.
- [ ] `isExplorerUrl('javascript:alert(1)')`, `isExplorerUrl('https://evil.test/tx/0x1')` e `isExplorerUrl('lixo')` devolvem `false`.
- [ ] `getOrder` valida a resposta com `orderSchema` e codifica o id na URL.
- [ ] Sem `any`, `as`, `!`, `@ts-ignore` nem `eslint-disable`; `lib/` sem importar React.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Comportamento exercitado pelos specs do 12-017.

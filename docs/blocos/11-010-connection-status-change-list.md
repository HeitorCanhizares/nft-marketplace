# 11-010 — `WalletConnectionStatus` e `QuoteChangeList`

**Status:** concluído
**Fluxo / subitem:** Pagamento › 5, 7
**Depende de:** 11-001
**Toca:** `src/components/shared/WalletConnectionStatus.tsx` (novo), `src/components/shared/QuoteChangeList.tsx` (novo)
**Paralelo:** pode rodar com 11-005, 11-006, 11-007, 11-008 (depois do 11-001). Os blocos 11-012, 11-015 e 11-016 esperam este.
**Lote:** E (depois do 11-005)

## Objetivo
O estado da conexão da carteira com a ação certa em cada caso, e a lista textual de mudanças da cotação. **Nenhum dos dois está desenhado no Figma**: seguir o estilo do restante da tela (valores propostos na seção "Valores propostos").

## Arquivos
- criar: `src/components/shared/WalletConnectionStatus.tsx`
- criar: `src/components/shared/QuoteChangeList.tsx`

## Referências
- docs/design/componentes.md (`WalletConnectionStatus`, `QuoteChangeList`); docs/fluxos/pagamento.md subitens 5 e 7; docs/qualidade/acessibilidade.md (estado nunca só por cor)
- `src/hooks/useWalletConnection.ts` (`WalletConnectionState`), `src/lib/address.ts` (`shortAddress`), `src/lib/walletOptions.ts` (`providerLabel`, `networkLabel`), `src/lib/formatEth.ts` (`formatEth`), `QuoteChangeEntry` (11-001), `src/components/shared/PriceChangedNotice.tsx` (estilo de aviso)

## Instruções
1. `WalletConnectionStatus` props: `{ status: 'disconnected' | 'connecting' | 'connected' | 'rejected'; provider: WalletProvider | null; address: string | null; network: Network | null; expectedNetwork: Network | null; errorCode?: string | null; hint?: string | null; onReconnect: () => void; onSwitchNetwork: () => void; onDisconnect: () => void }`. Textos exatos:
   - `disconnected`: "Não conectada" (+ botão "Conectar" se há `provider`, que chama `onReconnect`; sem `provider` só o texto);
   - `connecting`: "Conectando à {provedor}..." (`aria-busy`);
   - `connected` na rede certa: "Conectada: {shortAddress}" + botão "Desconectar" (`onDisconnect`);
   - `connected` em rede diferente: "Rede diferente: sua carteira está na {rede}. Selecione a {rede esperada}." + botão "Trocar para {rede esperada}" (`onSwitchNetwork`);
   - `rejected`: "Conexão recusada na carteira" (se `errorCode === 'UNAVAILABLE'`: "Carteira indisponível") + botão "Tentar novamente" (`onReconnect`);
   - `hint` (ex.: "Selecione uma rede antes de escolher a carteira.") aparece abaixo, em texto de apoio.
   O componente **não** é `aria-live` (o hook já anuncia cada estado). Cada estado tem ícone + texto (não só cor); botões com altura mínima 44 px.
2. `QuoteChangeList` props: `{ changes: readonly QuoteChangeEntry[]; onRemoveItem?: (itemId: string) => void; removingId?: string | null }`. `<ul aria-label="Mudanças desde a última cotação">`, um `<li>` por entrada, com ícone + texto:
   - `PRICE_CHANGED`: "Preço de {nome}: {from} → {to}" (valores com `formatEth`);
   - `SOLD_OUT`: "{nome} esgotou." + botão "Remover {nome}" (só se `onRemoveItem`; `aria-busy` quando `removingId === itemId`);
   - `COUPON_EXPIRED`: "O cupom {código} expirou e o desconto foi removido.";
   - `FEE_CHANGED`: "Taxa de rede: {from} → {to}".
   Lista vazia → `null`.
3. Só tokens de cor (`text-destructive`, `text-success`, `text-muted-foreground`…); `cn`; sem hexadecimal.
4. Fechamento: prettier nos 2; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0 (se falhar por arquivo de **outro** agente, esperar e repetir). Commit só dos 2: `git commit -m "11-010: status da carteira e lista de mudanças" -- <arquivos>`.

## Valores propostos (confirmar)
- Estado da conexão aparece logo abaixo das opções de provedor (acima do botão "Confirmar compra"), em texto de 14 px, com ícone de 16 px.
- Mudanças da cotação usam `text-destructive` só no ícone; o texto fica em `foreground`.

## Critérios de aceite
- [ ] Os cinco estados têm texto e ação conforme a lista; nenhum depende só de cor.
- [ ] `QuoteChangeList` mostra antes → depois para preço e taxa, e o botão de remover só para esgotado.
- [ ] Sem cor hexadecimal fora dos tokens; sem `any`, `as` ou `@ts-ignore`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Visual: dentro da revisão e da coluna no 11-019.

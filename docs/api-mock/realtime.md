# Tempo real (Socket.IO simulado pelo MSW)

O app usa o cliente oficial `socket.io-client`. Não existe servidor: o MSW intercepta a conexão WebSocket e o `@mswjs/socket.io-binding` (dependência aprovada em A7) traduz o protocolo do Socket.IO.

- O cliente conecta com `transports: ['websocket']` (o MSW intercepta WebSocket, não long-polling).
- **Armadilha (fase 02):** no bundle de navegador do MSW 2.15, `ws.link('ws://*/…')` não casa a URL real do socket.io. Usar `ws.link('*')` e filtrar pelo caminho `/socket.io/` dentro do handler. Testes em Node usam outro build do MSW e podem dar falso positivo; validar o tempo real **no navegador** (Playwright).
- **Ping:** o `@mswjs/socket.io-binding` não envia ping; o servidor simulado envia um próprio **a cada 20 s** para manter a conexão viva.
- **Queda simulada (`dropConnections`):** durante a janela de recusa, a conexão nova é **segurada até o fim da janela**, e não fechada. Fechá-la deixava o `socket.io-client` parado, porque ele só reagenda a reconexão quando vê um `error` antes do `open`.
- URL: `VITE_SOCKET_URL` (padrão: mesma origem, caminho `/socket.io`).
- O handshake envia o token da sessão quando houver.
- Reconexão automática do Socket.IO ligada. Ao reconectar, o front **invalida** as queries afetadas (pode ter perdido eventos).

## Inscrições (cliente → servidor)

| Evento | Payload | Quando |
|---|---|---|
| `nft:subscribe` | `{ ids: string[] }` | NFTs visíveis na tela (catálogo, detalhe, carrinho, pagamento) |
| `nft:unsubscribe` | `{ ids: string[] }` | Ao sair da tela |
| `order:subscribe` | `{ orderId }` | Após criar o pedido |

## Eventos (servidor → cliente)

| Evento | Payload | Efeito no front |
|---|---|---|
| `nft:price_changed` | `{ nftId, editionId, price, previousPrice }` | Atualiza `nfts.detail` e `nfts.list` com `setQueryData`; invalida `cart` e `quote`. Anuncia por `aria-live` (`polite`). No pagamento, a mudança aparece na revisão (`CheckoutReview`) e exige nova confirmação. |
| `nft:stock_changed` | `{ nftId, editionId, available }` | Atualiza o detalhe (limita o `QuantityStepper`, mostra "Esgotado"); invalida `cart` e `quote`. |
| `order:updated` | `{ orderId, status, txHash?, declineReason? }` | Atualiza `orders.detail`; anuncia o resultado (`assertive`). |
| `session:expired` | `{}` | Mesmo fluxo do `401 SESSION_EXPIRED`. |

## Simulação no mock

- Um agendador em `src/mocks/realtime/` muda, de tempos em tempos, o preço ou o estoque de um NFT inscrito e grava a mudança no banco do mock (o próximo `GET` reflete o mesmo valor).
- Os cenários `price-change-on-checkout` e `sold-out-on-checkout` disparam o evento logo após a cotação.
- O pedido emite `order:updated` quando sai de `pending`.
- Se o socket cair, o pedido ainda pode ser acompanhado por polling em `GET /orders/:id` (a cada 2s, até sair de `pending`).

## Acessibilidade

Mudanças em tempo real **nunca** movem o foco nem trocam o layout de lugar. Elas são anunciadas pelo `LiveAnnouncerContext` e destacadas visualmente com texto (não só cor), ex.: "Preço atualizado".

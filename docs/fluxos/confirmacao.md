# Confirmação de pedido

**Rota:** `/pedido/$orderId` (logado, decisão A2) · **Telas:** [desktop](../design/telas/desktop-confirmacao.png), mobile **adaptado**
**Escopo do usuário:** resultado, identificação da transação, itens, taxas e total.
**Subitens:** ✅ validados pelo usuário em 2026-10-25.

## Requisitos do usuário
- Representar pedido **pendente, confirmado e recusado**, com **recuperação após refresh ou reconexão**.
- **Exibir a confirmação (recibo) somente para pedido efetivamente confirmado** na simulação.
- Após confirmação, **remover do carrinho apenas os itens e quantidades comprados**.
- O recibo **reproduz o snapshot do pedido**: mudanças posteriores no catálogo não alteram seus valores.
- Referências de transação e links do explorador são **simulados**.

## O que o Figma mostra
- **Desktop:** `Dialog` sobre o layout do Pagamento com `OrderReceipt`: ícone "Thank you", "Seus NFTs agora estão na sua carteira", faixa (ID da transação, Data, Total, Carteira), "Detalhes da transação" com itens (Edições, Subtotal), Taxa de rede, Total, mensagem "Transação confirmada na <rede>..." e botão do explorador.
- **Mobile:** não existe. Adaptar como página cheia com `MobileTopBar` e o mesmo `OrderReceipt`.

## API
`GET /orders/:id`; `order:subscribe` + `order:updated`; polling de fallback.

## Subitens

### 1. Estrutura
- **Desktop:** `Dialog` sobre o **layout do Pagamento inerte e escurecido** (atributo `inert`, fora da árvore de acessibilidade), montado em modo somente leitura com os dados do próprio pedido — só contexto visual, como no Figma.
- **Mobile:** página cheia com `MobileTopBar` "Pedido".
- **Acesso direto pela URL** (refresh, link) funciona igual: o `loader` busca o pedido.
- O `Dialog` tem título acessível que muda conforme o estado ("Confirmando pagamento", "Pedido confirmado", "Pagamento recusado"), e o foco vai para ele.

### 2. Pendente (não desenhado; criar no padrão)
- **No mesmo modal** (desktop) / página (mobile): "Confirmando pagamento..." com indicador de progresso e `aria-live`. **Sem recibo.**
- Acompanha por `order:updated`; se o socket cair, **polling a cada 2s**; ao reconectar, refaz o `GET`.
- **Refresh** na página retoma o acompanhamento.
- Mais de **60s** pendente: aviso "Está demorando mais que o normal. Você pode sair; o pedido continua sendo processado" — e o pedido segue recuperável (o Pagamento redireciona para ele enquanto estiver pendente).

### 3. Confirmado
- O modal troca para o `OrderReceipt`, montado **só com o snapshot** (`Order.items`, `subtotal`, `discount`, `networkFee`, `total`, `wallet`, `network`, `createdAt`). Nunca consulta `GET /nfts`.
- Anúncio `assertive`: "Pedido confirmado".
- Invalida `cart` (o servidor já removeu só os itens e quantidades comprados); apaga `kurio:checkout` e o rascunho.

### 4. Recusado (não desenhado; criar no padrão)
- **No mesmo modal:** motivo (`declineReason`), "Seus itens continuam no carrinho", **"Tentar novamente"** (volta ao Pagamento com nova chave de idempotência) e **"Voltar ao carrinho"**. **Sem recibo.**
- Anúncio `assertive`. Estado de erro com ícone + texto, não só cor.

### 5. Transação e explorador simulados
- ID da transação fictício (`0x` + 64 hex), exibido abreviado ("0xA91F…E82C") com o valor completo acessível e opção de copiar.
- Botão com o nome do explorador da rede do pedido (Etherscan, Polygonscan, Solscan), que **abre em nova aba** a URL no formato do explorador com o hash fictício. Texto e dica "Transação simulada"; aviso "abre em nova aba".
- Mensagem "Transação confirmada na <rede>..." usa a rede do pedido.

### 6. Fechar
- X ou Esc (desktop) e voltar (mobile) levam à **Início**. O recibo continua acessível pela URL do pedido.

### 7. Acesso negado e inexistente
- `403` (pedido de outro usuário): "Você não tem acesso a este pedido" + link para a Início.
- `404`: "Pedido não encontrado" + link para a Início.
- Sem login: `/entrar?redirect=/pedido/$orderId`.

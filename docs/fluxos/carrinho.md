# Carrinho de NFTs

**Rota:** `/carrinho` (público, decisão A1) · **Telas:** [desktop](../design/telas/desktop-carrinho.png), [mobile](../design/telas/mobile-carrinho.png)
**Escopo do usuário:** edição de quantidades, remoção, cupom e resumo de valores.
**Subitens:** ✅ validados pelo usuário em 2026-10-25.

## Requisitos do usuário
- Adicionar, alterar e remover itens, **respeitando a disponibilidade por NFT e edição**.
- **Manter o carrinho após refresh** e **preservar os itens do visitante ao autenticar**.
- **Aplicar e remover cupom**, tratando código inválido ou expirado.
- Subtotal, desconto, taxa de rede e total **coerentes com a resposta da API**.
- **Refletir alterações de preço e disponibilidade** recebidas enquanto o carrinho estiver aberto.
- ETH como string decimal; quantidades inteiras; a cotação da API é a referência.

## O que o Figma mostra
- **Desktop:** `Breadcrumb`; `LineItemList` (NFTs, Preço, Edições, Total) com `LineItem` `cart-row` (stepper e lixeira); painel "Resumo do pedido" (corrigido) com `CouponField`, `PriceSummary`, "Conectar e finalizar" e "Continuar explorando"; `NftCarousel` "Colecionadores também viram"; `Footer`.
- **Mobile:** `MobileTopBar` "Carrinho de NFTs"; `LineItem` `cart-card`; painel inferior com cupom, resumo e "Conectar e finalizar".

## API
`GET /cart`, `POST /cart/items` (desfazer remoção), `PATCH /cart/items/:id`, `DELETE /cart/items/:id`, `PUT /cart/coupon`, `DELETE /cart/coupon`, `POST /quote`, `GET /nfts/recommendations`. Tempo real: inscrição em todos os NFTs do carrinho.

## Subitens

### 1. Lista de itens
- **Desktop:** `<table>` semântica (NFTs, Preço, Edições, Total, ação) com `LineItem` `cart-row`: miniatura, nome, ID do token, preço unitário, stepper, total da linha, lixeira.
- **Mobile:** `LineItem` `cart-card`: imagem, nome, edição, preço, stepper e **lixeira no canto superior direito do card**, separada do stepper (corrige a sobreposição do Figma).
- Nome e imagem levam ao detalhe do NFT.

### 2. Alterar quantidade
- Inteira; **mínimo 1**: o "−" fica **desabilitado** em 1 (desktop e mobile). Remover é só pela lixeira.
- **Máximo = disponível na edição**; no limite o "+" desabilita e o motivo aparece em texto ("Máximo disponível: 3").
- Atualização otimista (`PATCH`) com rollback e aviso em caso de erro (`SOLD_OUT`, `QUANTITY_EXCEEDS_STOCK`).
- Cliques rápidos são agrupados (debounce de ~400ms) num único `PATCH` com o valor final.

### 3. Remover com "Desfazer"
- Lixeira com `aria-label` "Remover Emerald Ape #042".
- Remove **na hora** (`DELETE`) e mostra toast "Emerald Ape #042 removido" com **"Desfazer"** por ~6s (também anunciado).
- "Desfazer" recria o item com a mesma edição e quantidade (`POST /cart/items`); se o estoque não permitir mais, avisa e adiciona o possível.
- Foco vai para a lixeira do item seguinte (ou do anterior; se a lista ficar vazia, para o título do estado vazio).

### 4. Aplicar e remover cupom
- `CouponField`: "Aplicar" → `PUT /cart/coupon`. Aplicado: mostra o código, o desconto e **"Remover cupom"** (`DELETE /cart/coupon`).
- Inválido (`COUPON_INVALID`) e expirado (`COUPON_EXPIRED`): erro ligado ao campo, foco no campo.
- O cupom fica no carrinho: sobrevive a refresh e segue para o pagamento.

### 5. Resumo de valores pela cotação
- Subtotal, Desconto do lançamento, Taxa de rede ("Taxa estimada") e Total são **exatamente as strings da `POST /quote`**.
- A cada mudança (quantidade, remoção, cupom, tempo real) a cotação é refeita; enquanto recalcula, o resumo mostra estado de atualização (`aria-busy`), sem valor calculado no front.

### 6. Persistência e mescla
- Refresh mantém o carrinho (servidor simulado; visitante pelo `cartId`, usuário pela sessão).
- No login, o carrinho do visitante é mesclado ao do usuário; se algo foi reduzido por estoque, aviso "Ajustamos 1 item ao estoque disponível".

### 7. Tempo real de preço e disponibilidade
- **Preço alterado:** a linha mostra "Preço atualizado: 1.19 → 1.29 ETH" e a cotação é refeita.
- **Esgotado:** linha marcada **"Esgotado"**, fora do total, e **"Conectar e finalizar" bloqueado até remover** o item (o motivo aparece junto ao botão).
- **Estoque abaixo da quantidade:** linha marcada "Restam 3" com ação **"Ajustar para 3"**; finalizar fica bloqueado até ajustar ou remover.
- Nada muda sem ação do usuário além do aviso. Avisos agrupados no `aria-live`.

### 8. Contador do cabeçalho
- Mostra o **total de unidades** (soma das quantidades) a partir da query `cart` (`itemCount`).
- `aria-label` "Carrinho, 17 itens"; mudanças anunciadas de forma discreta.

### 9. Ir para o pagamento
- "Conectar e finalizar": sem login → `/entrar?redirect=/pagamento`; com login → `/pagamento`.
- Bloqueado com carrinho vazio, item esgotado ou quantidade acima do estoque.
- "Continuar explorando" → catálogo da Início.

### 10. Recomendações (desktop)
- `NftCarousel` "Colecionadores também viram" com `GET /nfts/recommendations`; cards iguais aos da Início. Erro aqui não afeta o carrinho.

### 11. Estados
- **Vazio:** `EmptyState` "Seu carrinho está vazio" + "Explorar NFTs".
- **Carregando:** `LineItemSkeleton` e skeleton do resumo.
- **Erro:** `ErrorState` com "Tentar novamente"; erro em mutation desfaz e avisa.

# Pagamento

**Rota:** `/pagamento` (logado, carrinho não vazio) · **Telas:** [desktop](../design/telas/desktop-pagamento.png), [mobile](../design/telas/mobile-pagamento.png)
**Escopo do usuário:** dados do colecionador, seleção de carteira e rede, revisão e envio do pedido.
**Subitens:** ✅ validados pelo usuário em 2026-10-25.

## Requisitos do usuário
- **Validar os campos do layout** e **permitir revisão antes do envio**.
- **Usar as carteiras cadastradas**, com seleção de rede e **simulação de conexão, recusa e desconexão**.
- **Revalidar preço, disponibilidade, cupom e taxas antes de confirmar.** Mudanças exigem **nova confirmação**.
- **Impedir pedidos duplicados** em cliques repetidos ou reenvios após timeout.
- **Preservar os itens em falhas.**
- Sessão que expira no checkout **preserva o contexto** para retomada.

## O que o Figma mostra
- **Desktop:** `Breadcrumb`; "Perfil do colecionador" = `WalletForm`; "Usar outra carteira?"; "Observação do colecionador (opcional)"; coluna "Seus NFTs" com `LineItem` `summary`; `CouponField` recolhido; `PriceSummary`; "Carteira e rede" com `WalletProviderOption`; "Confirmar compra".
- **Mobile:** `MobileTopBar` "Pagamento com carteira"; "Carteira conectada" com `SavedWalletOption` (principal e secundária, menu "⋮") e "Trocar carteira"; "Carteira e rede"; total; "Confirmar compra". **Sem formulário do colecionador** (decisão do usuário): os dados vêm da carteira cadastrada escolhida.

## API e serviços
`GET /wallets`, `PUT /wallets/secondary`, `GET /cart`, `PUT/DELETE /cart/coupon`, `POST /quote`, `POST /orders`, `GET /orders?status=pending`; `services/wallet` (carteira simulada); tempo real dos NFTs do carrinho.

## Subitens

### 1. Entrada
- Exige login (senão `/entrar?redirect=/pagamento`) e carrinho não vazio, sem itens esgotados ou com estoque insuficiente (senão volta a `/carrinho` com o motivo).
- Pedido pendente (`kurio:checkout.orderId` ou `GET /orders?status=pending`) → `/pedido/$orderId`.
- Chave de idempotência sem `orderId` (caiu antes da resposta) → reenvia o `POST /orders` com a mesma chave para descobrir se o pedido existe.
- Restaura o rascunho (`kurio:checkout-draft`) se for do mesmo usuário; pede a cotação inicial.

### 2. Formulário do colecionador (desktop)
- `WalletForm` pré-preenchido com a **carteira principal**. Sem principal cadastrada: formulário vazio para preencher.
- Campos e validação zod (mesmo schema de Carteiras): Nome de exibição*, Nome de usuário*, Rede*, Nome do perfil*, Endereço da carteira* (`0x` + 40 hex), ENS ou carteira secundária (opcional), Tipo de carteira*, Código de indicação*, E-mail*, Nome ENS* (`EnsInput`); Observação do colecionador (opcional, até 500 caracteres).
- Validação ao sair do campo e no envio; foco no primeiro erro.
- Rascunho salvo a cada alteração (debounce).

### 3. "Usar outra carteira?"
- Ao marcar, mostra as opções: **carteira secundária** (se cadastrada) ou **"Preencher outra carteira"**, que limpa o formulário para digitar.
- Na opção manual aparece o checkbox **"Salvar como carteira secundária"** (desmarcado por padrão). Se já existir secundária, o texto vira "Substituir a carteira secundária" com aviso.
- Marcado: antes de criar o pedido, chama `PUT /wallets/secondary`; se falhar, mostra o erro e não envia o pedido.
- Desmarcado: os dados vão só para o pedido.

### 4. Carteiras cadastradas (mobile)
- `SavedWalletOption` para a principal e a secundária (nome, endereço/ENS, rede), selecionáveis por rádio.
- **"Trocar carteira":** desconecta o provedor atual para escolher outro.
- **Menu "⋮":** "Editar carteira" → `/perfil/carteiras` (com `redirect` de volta ao pagamento; o rascunho é preservado).
- Sem carteira cadastrada: `EmptyState` "Cadastre uma carteira para continuar" + link para `/perfil/carteiras`.

### 5. Rede e provedor (conexão simulada)
- **Rede:** desktop pelo campo "Rede" do formulário; mobile pela rede da carteira escolhida. Trocar a rede refaz a cotação (taxa muda).
- **Provedor:** WalletConnect, MetaMask, Coinbase Wallet. **Escolher o provedor já conecta** (`connect`): "Conectando à MetaMask..." → "Conectada: 0xA91F…E82C" (`WalletConnectionStatus`).
- **Recusa:** "Conexão recusada na carteira" + "Tentar novamente".
- **Desconexão** a qualquer momento (inclusive na revisão): volta a "Não conectada", bloqueia o envio, pede reconexão, sem perder dados.
- **Rede diferente** da escolhida: pede a troca (`switchNetwork`).
- Estados anunciados por `aria-live`.

### 6. Resumo, cupom e cotação
- `LineItem` `summary` (nome, ID, "(x 2)", subtotal da linha), `CouponField` recolhido com aplicar/remover (cupom do carrinho), `PriceSummary` com as strings da cotação.
- Cotação refeita ao mudar rede, cupom ou ao vencer (`QUOTE_TTL`), e em eventos de tempo real dos NFTs do carrinho.

### 7. Revisão
- "Confirmar compra" valida o formulário, exige carteira conectada na rede certa e **pede uma nova cotação**.
- Abre `CheckoutReview` (`Dialog` desktop / `Sheet` mobile): itens, carteira, endereço, rede, cupom, subtotal, desconto, taxa e total, com "Confirmar e pagar" e "Voltar".
- Se a nova cotação difere da exibida antes, `QuoteChangeList` destaca as mudanças com texto (preço antigo → novo, esgotado, cupom expirado, taxa alterada) e o usuário precisa confirmar de novo. Item esgotado: opção de removê-lo ali mesmo.

### 8. Envio idempotente
- "Confirmar e pagar" fica bloqueado desde o primeiro clique (`aria-busy`, "Processando...").
- Pede a assinatura à carteira simulada; depois `POST /orders` com `Idempotency-Key` ([estado](../arquitetura/estado.md#criação-de-pedido-idempotente)).
- Timeout/rede: reenvia com a mesma chave, "Confirmando seu pedido...". **Nunca cria pedido duplicado.**
- `409 QUOTE_CHANGED`: a revisão é atualizada e exige nova confirmação (nova chave).
- Pedido criado: `orderId` salvo e navegação para `/pedido/$orderId`.

### 9. Falhas
- **Assinatura recusada:** "Pagamento cancelado na carteira"; nenhum pedido criado.
- Qualquer falha (rede, 5xx, recusa, conflito): **carrinho e formulário preservados**, mensagem clara e ação de tentar de novo.

### 10. Sessão expirada
- Salva o rascunho, mantém `kurio:checkout`, redireciona para `/entrar?redirect=/pagamento`.
- Após o login **do mesmo usuário**: restaura o formulário, a seleção de carteira e rede, refaz a cotação e pede reconexão da carteira. Outro usuário: rascunho descartado (`clearPrivateSession`).

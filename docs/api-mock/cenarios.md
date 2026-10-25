# Cenários do MSW

O mock deve se comportar como um servidor real. Toda resposta passa por um **middleware de cenário** (`src/mocks/scenarios/`) que aplica latência, falhas aleatórias e cenários forçados antes do handler.

## Variáveis de ambiente

Definidas em `.env` / `.env.development` / `.env.test`. Todas com prefixo `VITE_` para chegarem ao browser.

| Variável | Padrão | Efeito |
|---|---|---|
| `VITE_API_MOCKING` | `enabled` | Liga o MSW. Precisa estar ligado também no build de preview (não existe backend). |
| `VITE_API_BASE_URL` | `/api` | Base das rotas |
| `VITE_MOCK_LATENCY_MIN_MS` | `200` | Latência mínima por requisição |
| `VITE_MOCK_LATENCY_MAX_MS` | `1200` | Latência máxima. Cada requisição sorteia um valor no intervalo, o que **gera respostas fora de ordem** naturalmente. |
| `VITE_MOCK_ERROR_RATE` | `0` | Probabilidade (0–1) de uma requisição responder 5xx aleatório |
| `VITE_MOCK_NETWORK_ERROR_RATE` | `0` | Probabilidade de falha de conexão (`HttpResponse.error()`) |
| `VITE_MOCK_SESSION_TTL_SECONDS` | `1800` | Duração da sessão |
| `VITE_MOCK_QUOTE_TTL_SECONDS` | `120` | Validade da cotação |
| `VITE_MOCK_PAYMENT_DELAY_MS` | `3000` | Tempo até o pedido sair de `pending` |
| `VITE_MOCK_PAYMENT_DECLINE_RATE` | `0` | Probabilidade de pagamento recusado |
| `VITE_MOCK_REALTIME` | `enabled` | Liga os eventos simulados de tempo real |
| `VITE_MOCK_SCENARIOS` | vazio | Lista de cenários forçados, separados por vírgula (tabela abaixo) |
| `VITE_MOCK_SEED_RESET` | `false` | Apaga o banco do mock e recria a partir do seed ao iniciar |

Falhas aleatórias (`ERROR_RATE`, `NETWORK_ERROR_RATE`) **nunca** atingem `GET /auth/session` na inicialização, para o app sempre conseguir abrir. Em `.env.test` todas as taxas aleatórias são `0`: os testes usam só cenários forçados, para serem determinísticos.

Decisão A6: em dev e teste, `localStorage['kurio:mock:scenarios']` sobrescreve `VITE_MOCK_SCENARIOS`, para o Playwright escolher o cenário por teste.

## Cenários obrigatórios

| Requisito | Cenário forçado (`VITE_MOCK_SCENARIOS`) | Comportamento do mock | O que o front deve mostrar |
|---|---|---|---|
| Sucesso | (nenhum) | Respostas normais com dados do seed | Fluxo completo |
| Resultado vazio | `empty-catalog`, `empty-cart`, `empty-wallets` | `items: []` / carrinho vazio / sem carteiras | `EmptyState` com ação ("Limpar filtros", "Explorar NFTs", "Adicionar carteira") |
| Latência variável e fora de ordem | `slow` (latência 2–5s), `jitter` (0–3s) | Sorteia latência por requisição | Skeletons; resultado final sempre corresponde ao **último** filtro escolhido |
| Falha de conexão | `offline` ou `network-error:<rota>` | `HttpResponse.error()` | `ErrorState` com "Tentar novamente"; mutations mantêm o que o usuário digitou |
| 4xx/5xx | `server-error:<rota>` (500), `unavailable:<rota>` (503), `not-found:<rota>` | Status forçado na rota indicada (ex.: `server-error:GET /nfts`) | Mensagem amigável; 404 do NFT mostra página "NFT não encontrado" |
| Sessão expirada | `session-expired` | Qualquer rota 🔒 responde `401 SESSION_EXPIRED` | Toast + aviso acessível, redireciona para `/entrar?redirect=...`, volta ao fluxo depois |
| Acesso não autorizado | `forbidden-order` | `GET /orders/:id` responde `403` | "Você não tem acesso a este pedido" |
| Conflito de cadastro | `email-taken`, `username-taken` | `409` com `fields` (também acontece de verdade se o e-mail já existe no banco) | Erro no campo certo, foco no campo |
| Validação de formulário | `validation-error:<rota>` | `422 VALIDATION_ERROR` com `fields` | Erros associados a cada campo |
| Cupom inválido ou expirado | sem cenário: códigos do seed (`EXPIRADO`, qualquer código desconhecido) | `PUT /cart/coupon` responde `422 COUPON_INVALID` / `COUPON_EXPIRED` | Mensagem no `CouponField`, valores sem desconto. Cupom aplicado pode ser **removido** (`DELETE /cart/coupon`). |
| Preço alterado durante a compra | `price-change-on-checkout` | Após a cotação, o preço de um item sobe; `POST /orders` responde `409 QUOTE_CHANGED` (`PRICE_CHANGED`) com nova cotação. Também emite `nft:price_changed` | Revisão destaca valor antigo e novo; usuário precisa confirmar de novo |
| Edição esgotada durante a compra | `sold-out-on-checkout` | Um item fica com `available: 0`; `POST /orders` responde `409 QUOTE_CHANGED` (`SOLD_OUT`). Emite `nft:stock_changed` | Aviso no item, opção de remover e confirmar de novo |
| Cupom vence durante a compra | `coupon-expires-on-checkout` | O cupom aplicado vence antes do envio; `409 QUOTE_CHANGED` (`COUPON_EXPIRED`) | Revisão mostra o desconto removido; nova confirmação |
| Taxa muda durante a compra | `fee-change-on-checkout` | Taxa de rede sobe; `409 QUOTE_CHANGED` (`FEE_CHANGED`) | Revisão mostra a taxa nova; nova confirmação |
| Cliques repetidos | (sem cenário; sempre testado) | Duas requisições com a mesma chave → um pedido | Botão bloqueia após o primeiro clique; nenhum pedido duplicado |
| Timeout após criar o pedido | `order-timeout` | O pedido **é criado**, mas a resposta demora mais que o timeout do Axios. A segunda tentativa com a mesma `Idempotency-Key` devolve o mesmo pedido | O usuário vê "Confirmando seu pedido..." e chega ao estado do pedido **sem pedido duplicado** |
| Refresh com pedido pendente | `payment-slow` (pagamento demora 30s) | Pedido fica `pending` | Após refresh em `/pagamento` ou `/pedido/$id`, o app recupera o pedido (`sessionStorage` + `GET /orders?status=pending`) e continua acompanhando |
| Socket cai com pedido pendente | `realtime-drop` | Derruba a conexão do socket por alguns segundos | Polling assume; ao reconectar, o estado é revalidado |
| Pagamento confirmado | `payment-confirmed` | Pedido vai para `confirmed` | Recibo (snapshot) com ID da transação, itens, taxas e total. **O recibo só aparece com status `confirmed`.** |
| Pagamento recusado | `payment-declined` | Pedido vai para `declined` com motivo | Estado de recusa com motivo, carrinho intacto e "Tentar novamente" |
| Sessão expira no pagamento | `session-expired-on-checkout` | A sessão vence logo após abrir `/pagamento` | Rascunho do formulário salvo; login; volta ao pagamento com tudo preenchido |

### Carteira simulada (não é HTTP)

Simulador em `src/mocks/wallet/`, usado pelo app por `src/services/wallet/` (decisão de 2026-10-25). Imita um provedor de carteira (MetaMask, WalletConnect, Coinbase Wallet): `connect(provider, network)`, `disconnect()`, `switchNetwork(network)` e eventos `accountsChanged`, `chainChanged`, `disconnect`.

| Requisito | Cenário forçado | Comportamento | O que o front deve mostrar |
|---|---|---|---|
| Conexão | (padrão) | Atraso de 800–1500ms e devolve o endereço da carteira cadastrada que corresponde ao provedor; se nenhuma corresponder, um endereço fictício | "Conectando à MetaMask..." e depois "Conectada: 0xA91F…E82C" |
| Recusa da conexão | `wallet-rejected` | `connect` falha com `USER_REJECTED` | "Conexão recusada na carteira" + "Tentar novamente"; nada é enviado |
| Desconexão | `wallet-disconnect` | Emite `disconnect` alguns segundos após conectar (inclusive durante a revisão) | Volta ao estado "Não conectada", bloqueia "Confirmar e pagar" e pede reconexão; formulário e revisão preservados |
| Rede diferente | `wallet-wrong-network` | Conecta em outra rede | Pede a troca de rede (`switchNetwork`) antes de seguir |
| Assinatura recusada | `wallet-sign-rejected` | Ao confirmar o pagamento, a carteira recusa a assinatura | "Pagamento cancelado na carteira"; nenhum pedido criado; carrinho intacto |

Cada cenário forçado vira pelo menos **um teste E2E** ([testes.md](../qualidade/testes.md)).

## Regras de negócio que o mock aplica sempre (não são cenários)

- Validação dos corpos com os mesmos schemas zod do front (`422` com `fields`).
- E-mail e nome de usuário únicos no cadastro e no perfil.
- Estoque por edição: não aceita quantidade acima do disponível.
- Preço e estoque oscilam de vez em quando pelo tempo real (só quando `VITE_MOCK_REALTIME=enabled` e sem cenário forçado), para a interface lidar com mudanças reais.
- Idempotência de pedidos guardada por 24h.

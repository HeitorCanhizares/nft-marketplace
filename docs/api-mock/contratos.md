# Contratos da API (simulada pelo MSW)

Base: `VITE_API_BASE_URL` (padrão `/api`). JSON em tudo, exceto o upload de avatar (`multipart/form-data`).
Rotas marcadas com 🔒 exigem `Authorization: Bearer <token>`. Sem token: `401 UNAUTHORIZED`. Com token vencido: `401 SESSION_EXPIRED`.

Os tipos abaixo viram schemas zod em `src/schemas/` e são usados **tanto pelo app quanto pelo mock**, para os dois nunca divergirem.

## Convenções

### Valores em ETH
- Trafegam como **string decimal** (`"1.19"`, `"26.846"`), nunca como `number`, para não perder precisão.
- O mock calcula em inteiros (unidades de 0,000001 ETH) e converte para string.
- **O front não soma valores.** Subtotal, desconto, taxa e total vêm sempre de `POST /quote`.

### Formato de erro
```json
{
  "error": {
    "code": "EMAIL_TAKEN",
    "message": "Este e-mail já está em uso.",
    "fields": { "email": "Este e-mail já está em uso." },
    "details": {}
  }
}
```
`message` já vem em PT-BR, pronta para exibir. `fields` só aparece em erros de validação ou conflito de formulário.

| Status | Códigos |
|---|---|
| 400 | `BAD_REQUEST` |
| 401 | `UNAUTHORIZED`, `SESSION_EXPIRED`, `INVALID_CREDENTIALS` |
| 403 | `FORBIDDEN` |
| 404 | `NOT_FOUND` |
| 429 | `TOO_MANY_ATTEMPTS` |
| 409 | `EMAIL_TAKEN`, `USERNAME_TAKEN`, `SOLD_OUT`, `QUOTE_CHANGED`, `QUOTE_EXPIRED`, `CART_CHANGED` |
| 422 | `VALIDATION_ERROR`, `COUPON_INVALID`, `COUPON_EXPIRED`, `INVALID_CURRENT_PASSWORD`, `IDEMPOTENCY_KEY_REUSED`, `QUANTITY_EXCEEDS_STOCK` |
| 500 / 502 / 503 | `INTERNAL_ERROR`, `BAD_GATEWAY`, `SERVICE_UNAVAILABLE` |

### Paginação
```json
{ "items": [], "page": 1, "pageSize": 9, "total": 0, "totalPages": 0 }
```

## Tipos principais

```ts
type Network = 'ethereum' | 'polygon' | 'solana'
type WalletProvider = 'metamask' | 'walletconnect' | 'coinbase'

type NftSummary = {
  id: string                 // "emerald-ape-042"
  name: string               // "Emerald Ape #042"
  tokenId: string            // "#0042"
  image: { src: string; alt: string }
  price: string              // menor preço entre as edições disponíveis
  previousPrice?: string     // preço riscado
  rarity?: 'rare'
  collection: { id: string; name: string }
  network: Network
  isFavorite?: boolean       // só quando logado
}

type Edition = {
  id: string
  label: string              // "1/1" | "1/10" | "1/50" | "ABERTA"
  supply: number | null      // null = aberta
  available: number | null   // null = ilimitado
  price: string
}

type NftDetail = NftSummary & {
  description: string
  images: { src: string; alt: string }[]
  editions: Edition[]
  attributes: string[]       // ["Óculos", "Esmeralda", "Raro"]
  rating: { average: number; count: number }
  details: { body: string; network: string; contract: string; royalties: string }
}

type CartItem = {
  id: string
  nft: NftSummary
  edition: Pick<Edition, 'id' | 'label'>
  quantity: number
  unitPrice: string
  lineTotal: string
  availability: 'available' | 'low_stock' | 'sold_out' | 'insufficient'  // insufficient = estoque < quantidade
  available: number | null   // estoque atual da edição (null = edição aberta)
}

type Cart = {
  id: string
  items: CartItem[]
  itemCount: number          // total de UNIDADES (soma das quantidades), usado no contador do cabeçalho
  version: number
}

type Quote = {
  id: string
  expiresAt: string          // ISO
  cartVersion: number
  items: (CartItem & { priceChanged?: { from: string; to: string } })[]
  subtotal: string
  discount: string
  networkFee: string
  networkFeeEstimated: boolean
  total: string
  coupon?: { code: string; status: 'applied' | 'invalid' | 'expired'; message: string }
  warnings: ('PRICE_CHANGED' | 'SOLD_OUT' | 'LOW_STOCK')[]
}

type Wallet = {
  id: string
  slot: 'primary' | 'secondary'
  displayName: string
  username: string
  nickname: string           // "Apelido da carteira"
  profileName: string
  network: Network
  address: string            // 0x...
  secondaryAddressOrEns?: string
  provider: WalletProvider   // "Tipo de carteira"
  referralCode: string
  email: string
  ensName: string            // "nova.kurio.eth"
}

type OrderStatus = 'pending' | 'confirmed' | 'declined'

// Snapshot imutável: gravado na criação do pedido a partir da cotação aceita.
// Mudanças posteriores no catálogo (preço, nome, imagem) NUNCA alteram estes valores.
type OrderItemSnapshot = {
  nftId: string
  name: string
  tokenId: string
  image: { src: string; alt: string }
  editionId: string
  editionLabel: string
  quantity: number
  unitPrice: string
  lineTotal: string
}

type Order = {
  id: string
  status: OrderStatus
  createdAt: string
  quoteId: string
  txHash?: string            // simulado: "0x" + 64 hex, exibido como "0xA91F...E82C"
  declineReason?: string
  network: Network
  wallet: { label: string; provider: WalletProvider; address: string }
  collector: Omit<Wallet, 'id' | 'slot'> & { note?: string }  // dados enviados no pagamento (fundo inerte da confirmação)
  items: OrderItemSnapshot[]
  subtotal: string
  discount: string
  coupon?: { code: string }
  networkFee: string
  total: string
  explorerUrl?: string       // simulado: formato do explorador da rede com o txHash fictício
}

// Tipos da Início e das avaliações (bloco 02-001, aprovados pelo usuário)
type Review = { id: string; nftId: string; author: string; rating: 1 | 2 | 3 | 4 | 5; body: string; createdAt: string }

type Promo = {
  id: string
  title: string
  text: string
  ctaLabel: string           // "Explorar"
  image: { src: string; alt: string }   // os cards de promo têm imagem no Figma
  query: { tab?: 'all' | 'new' | 'trending'; collection?: string; network?: Network; sort?: string }
                             // "Lançamentos gênesis" → tab 'new'; "Arte digital selecionada" → collection
}

type Post = {
  id: string
  date: string
  readingMinutes: number
  title: string
  summary: string
  image: { src: string; alt: string }   // os cards do blog têm imagem no Figma
}

type HomeResponse = { hero: NftSummary[]; featured: NftSummary; promos: Promo[]; posts: Post[] }

type User = {
  id: string
  displayName: string
  username: string
  email: string
  ensName?: string
  walletNickname?: string
  avatarUrl?: string
}
```

## Sessão e conta

| Método e rota | Corpo | Sucesso | Erros |
|---|---|---|---|
| `POST /auth/register` | `{ username, email, password }` | `201 { user, session: { token, expiresAt } }` | `409 EMAIL_TAKEN` / `USERNAME_TAKEN` (com `fields`), `422 VALIDATION_ERROR` |
| `POST /auth/login` | `{ email, password }` | `200 { user, session }` | `401 INVALID_CREDENTIALS`, `422` |
| `GET /auth/session` 🔒 | — | `200 { user, expiresAt }` | `401 SESSION_EXPIRED` / `UNAUTHORIZED` |
| `POST /auth/availability` | `{ email }` ou `{ username }` (no corpo, para não pôr dado pessoal na URL) | `200 { available: boolean }` | `422` (formato inválido) |
| `POST /auth/refresh` 🔒 | — | `200 { session: { token, expiresAt } }` | `401 SESSION_EXPIRED` |
| `POST /auth/logout` 🔒 | — | `204` | — |

- `POST /auth/login`: a partir da **5ª tentativa errada** para o mesmo e-mail (inclusive ela) responde `429 TOO_MANY_ATTEMPTS` com `details.retryAfterSeconds` (30) até o prazo acabar.

A sessão expira após `VITE_MOCK_SESSION_TTL_SECONDS`. O login também **mescla o carrinho de visitante** (decisão A1).

## NFTs

| Método e rota | Parâmetros | Sucesso |
|---|---|---|
| `GET /home` | — | `{ hero: NftSummary[], featured: NftSummary, promos: Promo[], posts: Post[] }` |
| `GET /nfts` | `q, tab, collection, network, minPrice, maxPrice, sort, page, pageSize, favorites` | `Paginated<NftSummary> & { facets: { collections: {id,name,count}[], networks: {id,name,count}[], priceRange: {min,max} } }` |
| `GET /nfts/:id` | — | `NftDetail` · `404 NOT_FOUND` |
| `GET /nfts/:id/related` | — | `NftSummary[]` ("Mais desta coleção") |
| `GET /nfts/:id/reviews` | `page` | `Paginated<Review>` |
| `GET /nfts/recommendations` | — | `NftSummary[]` ("Colecionadores também viram") |

Valores: `tab` = `all` \| `new` (últimos 30 dias) \| `trending` (mais vendidos e favoritados em 7 dias); `sort` = `recent` \| `price_asc` \| `price_desc` \| `top_rated` \| `most_favorited`. O mapeamento dos valores da URL em PT-BR para estes fica em `services/api/nfts.ts`.

`favorites=1` exige token. Busca sem resultado devolve `200` com `items: []` (estado vazio, não erro).

## Favoritos 🔒

| Método e rota | Sucesso |
|---|---|
| `GET /favorites` | `{ ids: string[] }` |
| `PUT /favorites/:nftId` | `204` (idempotente) |
| `DELETE /favorites/:nftId` | `204` (idempotente) |

Visitante que clica em favoritar é levado ao login com `redirect` e, ao voltar, a ação é concluída.

## Carrinho

Identificação: com sessão, o carrinho do usuário; sem sessão, cabeçalho `X-Cart-Id` (decisão A1).

| Método e rota | Corpo | Sucesso | Erros |
|---|---|---|---|
| `GET /cart` | — | `Cart` | — |
| `POST /cart/items` | `{ nftId, editionId, quantity }` | `Cart` | `409 SOLD_OUT`, `422 QUANTITY_EXCEEDS_STOCK` |
| `PATCH /cart/items/:itemId` | `{ quantity }` | `Cart` | `409 SOLD_OUT`, `422 QUANTITY_EXCEEDS_STOCK`, `404` |
| `DELETE /cart/items/:itemId` | — | `Cart` | `404` |
| `PUT /cart/coupon` | `{ code }` | `Cart` (com `coupon`) | `422 COUPON_INVALID` / `COUPON_EXPIRED` |
| `DELETE /cart/coupon` | — | `Cart` | — |

- Adicionar o mesmo NFT e a mesma edição **soma** a quantidade no item existente, limitada ao estoque da edição.
- Quantidades são **inteiras** ≥ 1 (o mock rejeita decimais com `422`).
- O cupom fica **guardado no carrinho**: sobrevive a refresh, segue para o pagamento e é mesclado no login (o cupom do visitante prevalece se o usuário não tinha um).
- Carrinho do visitante é mesclado ao do usuário no login (decisão A1): mesmos NFT e edição somam, respeitando o estoque; o excedente é descartado e informado em `details.adjustments` da resposta do login (e do cadastro), no formato:

```ts
type CartAdjustment = {
  nftId: string
  nftName: string        // "Emerald Ape #042", para a mensagem
  editionId: string
  editionLabel: string   // "1/50"
  requested: number      // quantidade somada antes do ajuste
  applied: number        // quantidade que ficou no carrinho (0 = removido)
  reason: 'stock'
}
// details.adjustments?: CartAdjustment[]
```

O front monta a mensagem a partir desses campos ("Ajustamos Emerald Ape #042 (1/50) de 5 para 3 unidades, o estoque disponível").
- O tipo `Cart` ganha `coupon?: { code: string }`.

## Cotação

| Método e rota | Corpo | Sucesso | Erros |
|---|---|---|---|
| `POST /quote` | `{ network?, provider? }` | `Quote` (usa os itens e o cupom do carrinho) | — (cupom que venceu desde que foi aplicado volta como `coupon.status: 'expired'`, sem desconto) |

- **A cotação é a referência para finalizar o pedido.** O front não soma nem arredonda valores; só exibe as strings recebidas.
- Cotação vale `VITE_MOCK_QUOTE_TTL_SECONDS` (padrão 120s). Vencida → o front pede outra.
- Taxa de rede depende da rede; sempre marcada como estimada.
- Cupons do seed: `KURIO10` (10%), `GENESIS5` (5%), `EXPIRADO` (expirado). Qualquer outro: inválido.
- Se o preço ou o estoque mudou desde a última cotação, `items[].priceChanged` e `warnings` indicam.

## Pedidos 🔒

| Método e rota | Cabeçalhos / corpo | Sucesso | Erros |
|---|---|---|---|
| `POST /orders` | `Idempotency-Key: <uuid>` · `{ quoteId, collector: Wallet-like, walletId?, network, provider, walletAddress, note? }` | `201 Order` (status `pending`) · **mesma chave e mesmo corpo → `200` com o mesmo `Order`** | `409 QUOTE_CHANGED` (com nova cotação em `details.quote` e a lista `details.changes`: `PRICE_CHANGED`, `SOLD_OUT`, `COUPON_EXPIRED`, `FEE_CHANGED`), `409 QUOTE_EXPIRED`, `409 CART_CHANGED`, `422 IDEMPOTENCY_KEY_REUSED` (mesma chave, corpo diferente), `422 VALIDATION_ERROR` |
| `GET /orders/:id` | — | `Order` | `404`, `403 FORBIDDEN` (pedido de outro usuário) |
| `GET /orders?status=pending` | — | `Order[]` | — |

### Revalidação
Antes de criar o pedido, o mock **recalcula a cotação** com o estado atual (preço, estoque, cupom, taxa). Qualquer diferença em relação ao `quoteId` enviado → `409 QUOTE_CHANGED` com a cotação nova. O front mostra as mudanças e **exige nova confirmação**; o reenvio usa o novo `quoteId` e uma **nova** `Idempotency-Key` (o corpo mudou).

### Ciclo de vida
`pending` → após `VITE_MOCK_PAYMENT_DELAY_MS` →
- `confirmed`: gera `txHash` e `explorerUrl` fictícios, baixa o estoque e **remove do carrinho só os itens e quantidades comprados** (se o carrinho ganhou itens ou quantidades depois da cotação, o excedente continua lá).
- `declined`: com `declineReason`; **carrinho intacto**.

A mudança é emitida no tempo real (`order:updated`) e também aparece no `GET`, para quem consulta por polling. `GET /orders?status=pending` permite **recuperar um pedido pendente após refresh ou reconexão**.

### Snapshot
`Order.items`, `subtotal`, `discount`, `networkFee` e `total` são copiados da cotação no momento da criação e **nunca mudam**. O recibo é montado só com esses dados, nunca com `GET /nfts`.

## Perfil 🔒

| Método e rota | Corpo | Sucesso | Erros |
|---|---|---|---|
| `GET /profile` | — | `User` | — |
| `PATCH /profile` | `{ displayName, username, email, ensName?, walletNickname?, currentPassword? }` — `currentPassword` **obrigatório quando o e-mail muda** | `User` | `409 EMAIL_TAKEN` / `USERNAME_TAKEN`, `422 INVALID_CURRENT_PASSWORD`, `422 VALIDATION_ERROR` |
| `PUT /profile/avatar` | `multipart: file` (png/jpg/webp, até 2 MB) | `{ avatarUrl }` | `422 VALIDATION_ERROR` (tipo ou tamanho) |
| `DELETE /profile/avatar` | — | `204` | — |
| `POST /profile/password` | `{ currentPassword, newPassword }` | `204` (a sessão atual continua; as outras sessões do usuário são encerradas) | `422 INVALID_CURRENT_PASSWORD`, `422 VALIDATION_ERROR` (inclui nova senha igual à atual) |

`POST /auth/register` define `displayName` igual ao `username` (os cenários `email-taken`/`username-taken` afetam só o `register`, não o `availability`); `ensName` e `walletNickname` começam vazios.

## Carteiras 🔒

| Método e rota | Corpo | Sucesso | Erros |
|---|---|---|---|
| `GET /wallets` | — | `{ primary: Wallet \| null, secondary: Wallet \| null }` | — |
| `PUT /wallets/primary` | campos de `Wallet` sem `id`/`slot` | `Wallet` (cria ou atualiza) | `422 VALIDATION_ERROR` (ex.: endereço fora do formato `0x` + 40 hex) |
| `PUT /wallets/secondary` | campos de `Wallet` sem `id`/`slot` | `Wallet` (cria ou atualiza) | `422 VALIDATION_ERROR` |
| `DELETE /wallets/secondary` | — | `204` | `404` se não existir |
| `POST /wallets/swap` | — | `{ primary: Wallet, secondary: Wallet }` | `404 NOT_FOUND` se faltar uma das duas |

"Igual à carteira principal" é feito no front (copia os dados da principal para o formulário); o servidor só recebe uma carteira comum.

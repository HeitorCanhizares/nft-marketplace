# Persistência

Decisão: IndexedDB para dados grandes ou numerosos, localStorage para dados pequenos. Tudo com prefixo `kurio`.

## IndexedDB — banco do mock (`kurio-mock-db`)

Só o código em `src/mocks/` acessa. O app nunca lê este banco direto: ele conversa com a "API".

| Store | Conteúdo | Chave |
|---|---|---|
| `nfts` | NFTs com edições, preço e estoque atuais | `id` |
| `collections` | Coleções | `id` |
| `users` | Usuários. **Senha nunca em claro**: hash PBKDF2-SHA-256 (Web Crypto) com salt aleatório por usuário | `id`, índices únicos `email` e `username` |
| `sessions` | Tokens e expiração | `token` |
| `carts` | Carrinhos de usuário e de visitante | `id` |
| `quotes` | Cotações emitidas | `id` |
| `orders` | Pedidos | `id` |
| `idempotency` | `Idempotency-Key` → hash do corpo + id do pedido + data | `key` |
| `favorites` | `userId` + `nftId` | composta |
| `wallets` | Carteiras principal e secundária | `id`, índice `userId` |
| `avatars` | Blob da imagem do avatar | `userId` |
| `reviews` | Avaliações | `id`, índice `nftId` |
| `meta` | Versão do seed | `key` |

- Na primeira execução (ou com `VITE_MOCK_SEED_RESET=true`, ou se a versão do seed mudou), o banco é recriado a partir de `src/mocks/seed/`.
- O seed inclui usuários de teste com **credenciais fictícias**, que ficam **só** no arquivo de seed (`src/mocks/seed/`), nunca na documentação ou na interface. O seed guarda o hash, não a senha.
- `orders` guarda o **snapshot** do pedido; nenhum handler o altera depois de criado, exceto `status`, `txHash`, `explorerUrl` e `declineReason`.
- Alterações confirmadas (perfil, senha, avatar, carteiras, favoritos, carrinho) ficam no IndexedDB e **sobrevivem a refresh**.
- O avatar é servido por um handler (`GET /api/avatars/:userId`) que lê o Blob do IndexedDB.

## localStorage — dados pequenos do app

| Chave | Conteúdo |
|---|---|
| `kurio:session` | `{ token, expiresAt }` |
| `kurio:guest-cart-id` | id do carrinho de visitante (decisão A1) |
| `kurio:mock:scenarios` | sobrescrita de cenários em dev/teste (decisão A6) |

## sessionStorage

| Chave | Conteúdo |
|---|---|
| `kurio:checkout` | `{ idempotencyKey, quoteId, orderId? }` do pedido em andamento (recuperação após refresh) |
| `kurio:checkout-draft` | Rascunho do formulário do Pagamento (sem senha nem dado sensível além do que o próprio formulário pede), para retomar após expiração da sessão. Apagado ao confirmar o pedido, no logout e na troca de usuário. |

## Regras

- Todo acesso ao storage passa por `src/lib/storage.ts`, com `try/catch`: em navegação privada ou com storage bloqueado, o app continua funcionando (sessão só em memória).
- Nada de dado pessoal em URL ou query string.

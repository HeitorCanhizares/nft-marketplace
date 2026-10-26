# Estado e camada HTTP

## Onde fica cada estado

| Tipo | Ferramenta | Exemplos |
|---|---|---|
| Estado remoto (vem da API) | **TanStack Query** | catálogo, NFT, favoritos, carrinho, cotação, pedido, perfil, carteiras |
| Estado na URL | **TanStack Router** | busca, filtros, ordenação, página, aba |
| Estado do cliente compartilhado | **React Context** | sessão (`AuthContext`), avisos acessíveis (`LiveAnnouncerContext`) |
| Estado de formulário | **react-hook-form + zod** | todos os formulários |
| Estado local | `useState` | aberto/fechado, item do carrossel |

Regra: **nada que vem da API é copiado para um Context.** O contador do carrinho no cabeçalho lê a query do carrinho.

## Contexts

### `AuthContext`
- Guarda: `user`, `status` (`loading` \| `authenticated` \| `anonymous`), `expiresAt`.
- Ações: `signIn`, `signUp`, `signOut`, `refreshSession`.
- Na inicialização, chama `GET /auth/session` se houver token salvo: **a sessão é recuperada após refresh**.
- Agenda um aviso quando a sessão está perto de expirar e trata a expiração.
- O token fica no localStorage ([persistencia](../api-mock/persistencia.md)).

#### Expiração com preservação de contexto
- Durante a navegação: guarda a rota atual em `redirect`, vai para `/entrar`, e volta para ela após o login.
- Durante o checkout: antes de redirecionar, salva o rascunho do formulário em `kurio:checkout-draft` e mantém `kurio:checkout` (chave de idempotência / pedido pendente). Após o login **do mesmo usuário**, o Pagamento é restaurado com os campos preenchidos e a cotação é refeita. Se outro usuário entrar, o rascunho é descartado.
- Ação pendente (ex.: favoritar) é concluída após o login.

#### Logout e troca de usuário
Uma única rotina `clearPrivateSession()` roda no logout, na expiração seguida de login de **outro** usuário, e no login quando já havia sessão de outro usuário:
1. `queryClient.removeQueries` de todas as chaves privadas (`favorites`, `cart`, `quote`, `orders`, `profile`, `wallets`, `session`) e `nfts.*` com `isFavorite`.
2. Encerra as inscrições do socket (`nft:unsubscribe`, `order` da sessão anterior) e reconecta com o novo token (ou sem token).
3. Desconecta a carteira simulada.
4. Apaga `kurio:checkout` e `kurio:checkout-draft`.
5. Após logout, o próximo carrinho é um novo carrinho de visitante.

### `LiveAnnouncerContext`
- Expõe `announce(message, politeness)` que escreve numa região `aria-live` (`polite` ou `assertive`).
- Usado por mutations ("Item adicionado ao carrinho"), tempo real ("O preço de Emerald Ape #042 mudou para 1.29 ETH") e erros.

## TanStack Query

### Chaves
Fábrica de chaves em `hooks/queryKeys.ts`:

```
nfts.list(params)    nfts.detail(id)    nfts.related(id)    nfts.reviews(id, page)
home
favorites
cart
quote(input)
orders.detail(id)    orders.pending
profile
wallets
session
```

### Padrões
- `useCart` só liga depois da recuperação da sessão e invalida o carrinho quando o status de autenticação muda (traz a mescla do visitante).
- "Carregar mais" (mobile) acumula por `pageSize` (`page=1&pageSize=9×N`), não por `useInfiniteQuery`; a ordem dos cards fica estável entre atualizações (`keepOrder`).
- `staleTime` padrão de 30s; catálogo com `placeholderData: keepPreviousData` (troca de página sem piscar).
- **Respostas fora de ordem:** cada query passa o `signal` do Query para o Axios. Mudou o filtro, a requisição antiga é cancelada e não sobrescreve a nova. Busca com debounce de 300ms.
- **Retry:** GET tenta de novo até 2 vezes só em erro de rede ou 5xx. Nunca em 4xx. Mutations não fazem retry automático, **exceto a criação de pedido** (abaixo).
- **Clique repetido em mutations** (fase 06): a trava é síncrona via `queryClient.isMutating({ mutationKey, predicate })`, com `mutationKey` própria (ex.: `['toggle-favorite']`, `['add-to-cart']`). Não usar state nem ref no render para isso; o `pendingIds` em state serve só para a UI.
- **Atualização otimista:** favoritos e quantidade do carrinho. Em caso de erro, desfaz e avisa.
- **Invalidação:** mutations do carrinho e do cupom invalidam `cart` e `quote`; login/logout limpam tudo que é privado (`clearPrivateSession`); pedido confirmado invalida `cart`.
- **Persistência:** o carrinho e o cupom vivem no servidor simulado, então sobrevivem a refresh; o front só guarda o `cartId` do visitante.
- **Tempo real:** eventos do socket atualizam o cache com `setQueryData` ou invalidam a chave ([realtime](../api-mock/realtime.md)).

### Valores
- ETH trafega e é exibido como **string decimal**. O front **não faz contas** com valores: subtotal, desconto, taxa e total vêm da cotação. Formatação (`formatEth`) só troca separadores e adiciona "ETH", sem converter para `number`.
- Quantidades são inteiras; o `QuantityStepper` e os schemas zod rejeitam decimais.
- **A cotação é a referência** para finalizar o pedido.

### Criação de pedido idempotente
1. Na revisão, gera uma `Idempotency-Key` (UUID) para aquele `quoteId` e guarda em `kurio:checkout`.
2. `POST /orders` envia a chave no cabeçalho. O botão fica bloqueado desde o primeiro clique (`aria-busy`), impedindo cliques repetidos.
3. Em **timeout ou erro de rede**, reenvia com **a mesma chave** (até 3 tentativas, com espera crescente). O servidor devolve o mesmo pedido em vez de criar outro.
4. Se ainda falhar, mostra "Não conseguimos confirmar seu pedido" com "Tentar novamente", que reusa a chave.
5. `409 QUOTE_CHANGED`: a revisão mostra as mudanças; a nova confirmação usa o novo `quoteId` e uma **nova** chave.
6. Com o `orderId` recebido, ele é salvo em `kurio:checkout` e a navegação vai para `/pedido/$orderId`.
7. A chave só é descartada quando o pedido sai de `pending`.

### Recuperação de pedido pendente
- Refresh em `/pagamento` com `kurio:checkout.orderId` ou com `GET /orders?status=pending` não vazio → leva para `/pedido/$orderId`.
- Refresh em `/pagamento` com chave mas sem `orderId` (caiu antes da resposta) → reenvia o `POST /orders` com a mesma chave para descobrir se o pedido existe.
- Em `/pedido/$orderId`: acompanha por `order:updated`; se o socket cair, polling a cada 2s; ao reconectar, refaz o `GET`.

### Carteira (`services/wallet`)
- Estado da conexão (`disconnected` \| `connecting` \| `connected` \| `rejected`), endereço, rede e provedor ficam num hook (`useWalletConnection`) que lê o provedor simulado. Não é estado do servidor, então não vai para o Query; e só o Pagamento usa, então não vira Context.
- Eventos `disconnect`, `accountsChanged` e `chainChanged` atualizam o estado e são anunciados.

## Camada HTTP (`services/http`)

Instância única do Axios:
- `baseURL` = `import.meta.env.VITE_API_BASE_URL` (padrão `/api`).
- `timeout` = 10s (configurável).
- Interceptor de requisição: adiciona `Authorization: Bearer <token>` quando há sessão.
- Interceptor de resposta: converte qualquer erro em um `ApiError` tipado (`status`, `code`, `message`, `fields`). `401 SESSION_EXPIRED` dispara o fluxo de expiração do `AuthContext`.
- `services/api/*` validam a resposta com o schema zod do recurso. Resposta fora do contrato vira erro, não dado quebrado na tela.

Formato de erro: ver [contratos](../api-mock/contratos.md#formato-de-erro).

## Formulários

- Um schema zod por formulário em `schemas/`, reaproveitado entre telas (o `WalletForm` usa o mesmo schema no Pagamento e em Carteiras).
- Mensagens de validação em PT-BR, definidas no schema.
- Erros do servidor por campo (`fields` do `ApiError`, ex.: `409 EMAIL_TAKEN`) entram no formulário com `setError` e aparecem no campo certo.
- Validação ao sair do campo e ao enviar; foco vai para o primeiro campo com erro.

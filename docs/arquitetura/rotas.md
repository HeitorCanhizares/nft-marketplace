# Rotas

Rotas **baseadas em arquivos** com o plugin `@tanstack/router-plugin` do Vite. URLs em PT-BR, código em inglês.

| URL | Arquivo em `src/routes/` | Página | Acesso |
|---|---|---|---|
| `/` | `index.tsx` | `Home` | público |
| `/nft/$nftId` | `nft.$nftId.tsx` | `NftDetails` | público |
| `/carrinho` | `carrinho.tsx` | `Cart` | público (decisão A1) |
| `/pagamento` | `pagamento.tsx` | `Checkout` | **logado** e carrinho não vazio |
| `/pedido/$orderId` | `pedido.$orderId.tsx` | `OrderConfirmation` | **logado** (decisão A2) |
| `/entrar` | `entrar.tsx` | `SignIn` | só deslogado |
| `/cadastro` | `cadastro.tsx` | `SignUp` | só deslogado |
| `/perfil` | `perfil.index.tsx` | `ProfileMenu` (mobile) · redireciona para `/perfil/dados` (desktop) | **logado** |
| `/perfil/dados` | `perfil.dados.tsx` | `Profile` | **logado** |
| `/perfil/carteiras` | `perfil.carteiras.tsx` | `Wallets` | **logado** |
| (layout) | `__root.tsx` | `AppShell` | — |
| (layout do perfil) | `perfil.tsx` | `ProfileLayout` | **logado** |

Criadores, Aprenda e os itens desabilitados do perfil **não têm rota**.

## Parâmetros de busca (validados com zod em `validateSearch`)

### `/`
| Parâmetro | Tipo | Padrão |
|---|---|---|
| `q` | string | — |
| `aba` | `todos` \| `novos` \| `em-alta` | `todos` |
| `colecao` | string (id) | — |
| `rede` | `ethereum` \| `polygon` \| `solana` | — |
| `precoMin`, `precoMax` | number | — |
| `ordem` | `recentes` \| `menor-preco` \| `maior-preco` \| `mais-avaliados` \| `mais-favoritados` | `recentes` |
| `pagina` | number ≥ 1 | 1 (desktop: página atual; mobile: quantas páginas o "Carregar mais" já trouxe) |
| `favoritos` | `1` | — (decisão A4) |

> **Armadilha do TanStack Router (achada no 04-008/04-010):** o router mescla o retorno do `validateSearch` sobre a busca bruta. Uma chave inválida que o `validateSearch` simplesmente omite **continua** em `useSearch()` com o valor bruto (ex.: `redirect: "//evil.com"`). Todo `validateSearch` (inclusive os schemas zod das fases 05+) deve **devolver as chaves conhecidas sempre, com `undefined` quando inválidas**, ou usar o middleware `stripSearchParams`.

Filtros, busca, ordenação e página **vivem na URL**. Recarregar ou compartilhar o link mantém o mesmo resultado.

### `/entrar` e `/cadastro`
| Parâmetro | Tipo | Uso |
|---|---|---|
| `redirect` | string (caminho interno) | Para onde voltar após autenticar. Só aceita caminhos que começam com `/` (evita redirecionamento aberto). |

## Proteção de rotas

- Implementação (fase 05): `beforeLoad` com **contexto do roteador** (`app/routerContext.ts`, `app/routeGuards.ts`: `requireAuth`, `requireGuest`). As guardas esperam a promessa **`ready`** do `AuthContext` (fim da recuperação da sessão). O `AppRouter` chama `router.invalidate()` quando o status muda.

- Rotas **logado**: `beforeLoad` consulta a sessão (`AuthContext`). Sem sessão → `redirect({ to: '/entrar', search: { redirect: location.href } })`.
- Rotas **só deslogado**: com sessão → redireciona para `redirect` ou `/`.
- `/pagamento` com carrinho vazio → redireciona para `/carrinho`.
- Sessão expirada no meio do uso: o interceptor HTTP detecta `401 SESSION_EXPIRED`, limpa a sessão, avisa (toast + `aria-live`) e manda para `/entrar?redirect=<atual>`. Depois do login, o usuário volta exatamente para onde estava.

## Login, Cadastro e Confirmação: modal no desktop, página no mobile

Decidido para Login, Cadastro e Confirmação (A2).

- A rota é a mesma nos dois tamanhos.
- **Desktop:** a página renderiza o conteúdo de fundo do Figma (Início para Login/Cadastro; layout do Pagamento para a Confirmação) e, por cima, um `Dialog` com o formulário. Fechar o Dialog navega para `redirect` (ou `/`).
- **Mobile:** a página renderiza só o formulário, em tela cheia.
- A troca usa `useMediaQuery` com o breakpoint de [tokens.md](../design/tokens.md#layout-e-breakpoints).

## Outras regras

- `notFoundComponent` na raiz: página 404 no padrão visual.
- `errorComponent` por rota: `ErrorState` com "Tentar novamente".
- `pendingComponent`: skeleton da página.
- Dados críticos da página são pré-carregados no `loader` com `queryClient.ensureQueryData`, para não piscar.
- Preload ao passar o mouse nos links (`defaultPreload: 'intent'`).
- Ao trocar de rota, o foco vai para o `<h1>` da nova página e o título do documento é atualizado ([acessibilidade](../qualidade/acessibilidade.md)).

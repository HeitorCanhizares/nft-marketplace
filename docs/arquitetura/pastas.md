# Estrutura de pastas

Aprovada pelo usuário em 2026-10-25 (com `services/wallet/` e `mocks/wallet/` acrescentadas no mesmo dia). Organização **por camada**. Criar pasta ou arquivo fora deste mapa exige pergunta ao usuário.

```
nft-marketplace/
  docs/                    planejamento (este diretório)
  public/
    mockServiceWorker.js   gerado pelo MSW
  src/
    main.tsx               ponto de entrada: inicia o MSW (quando habilitado) e monta o app
    app/                   providers (QueryClient, contexts), instância do router
    routes/                arquivos de rota do TanStack Router (finos: validam params e montam a página)
    pages/                 uma pasta por tela: Home, NftDetails, Cart, Checkout, OrderConfirmation,
                           SignIn, SignUp, ProfileMenu, Profile, Wallets
    components/
      ui/                  primitivos do shadcn
      layout/              Header, Footer, MobileTabBar, MobileTopBar, Breadcrumb, ProfileLayout...
      shared/              componentes de domínio (NftCard, LineItem, PriceSummary, WalletForm...)
    contexts/              AuthContext, LiveAnnouncerContext
    hooks/                 queries e mutations do TanStack Query, useMediaQuery, useDebounce
    services/
      http/                instância do Axios e interceptors
      api/                 um arquivo por recurso: auth, nfts, favorites, cart, quote, orders, profile, wallets
      realtime/            cliente Socket.IO
      wallet/              interface do provedor de carteira (connect, disconnect, switchNetwork, eventos)
    schemas/               schemas zod (formulários e respostas da API)
    types/                 tipos de domínio
    lib/                   utilitários puros (cn, formatEth, explorerUrl, storage)
    mocks/
      browser.ts           setupWorker com todos os handlers
      handlers/            um arquivo por recurso
      db/                  stores do mock sobre IndexedDB e localStorage
      seed/                dados iniciais (NFTs, coleções, posts, cupons, usuário de teste)
      scenarios/           leitura das variáveis de ambiente e cenários forçados
      realtime/            servidor Socket.IO simulado
      wallet/              provedor de carteira simulado (atraso, recusa, desconexão, troca de rede)
    styles/
      globals.css          tokens (variáveis CSS) e base do Tailwind
    assets/                imagens dos NFTs, ícones de marca, fontes
  tests/
    e2e/                   fluxos com Playwright
    visual/                regressão visual com Playwright
```

## Regras de dependência entre camadas

```
routes → pages → components/shared → components/ui
                ↘ hooks → services/api → services/http
                ↘ contexts
qualquer camada → lib, types, schemas
mocks → (nada do app; só types, schemas e lib)
```

- `components/ui` não importa nada de `shared`, `hooks` ou `services`.
- `components/shared` recebe dados por props. **Não chama hooks de API.** Quem busca dados é a página.
- `pages` usam hooks e montam componentes. Não chamam o Axios direto.
- `services/api` só conhece HTTP; não conhece React.
- O app **nunca** importa de `mocks/`, exceto `main.tsx`, que inicia o worker e registra o simulador de carteira como implementação de `services/wallet/`.

## Nomes

- Componentes: `PascalCase.tsx`, um componente por arquivo, export nomeado.
- Hooks: `useCamelCase.ts`.
- Serviços, schemas, utilitários: `camelCase.ts`.
- Arquivos de rota: convenção do plugin do TanStack Router (ver [rotas.md](rotas.md)).

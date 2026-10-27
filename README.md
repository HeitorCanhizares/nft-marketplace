# Kurio — Marketplace de NFTs

Frontend de um marketplace de NFTs construído a partir de um layout no Figma (desktop e mobile). O app cobre a jornada completa de compra — catálogo, detalhes, carrinho, pagamento com carteira e confirmação do pedido — além de login, cadastro, perfil e carteiras.

Não existe backend: toda a API REST e o tempo real são simulados no navegador com **MSW**, que se comporta como um servidor de verdade (latência, erros, conflitos, sessão que expira, estado persistido e eventos em tempo real).

## Funcionalidades

- **Início:** carrossel de destaques, catálogo com busca, filtros (coleção, rede, faixa de preço), abas, ordenação e paginação. Tudo fica na URL, então recarregar ou compartilhar o link mantém o resultado.
- **Detalhes do NFT:** galeria, informações, escolha de edição, quantidade, favoritos e compra. Preço e estoque atualizam em tempo real.
- **Carrinho:** alterar quantidade, remover com desfazer, cupom de desconto e resumo com cotação (taxas e total). O carrinho de visitante é mesclado ao do usuário no login.
- **Pagamento:** dados do colecionador, carteira e rede, conexão com carteira simulada (MetaMask, WalletConnect, Coinbase Wallet), revisão do pedido e envio idempotente (cliques repetidos ou timeout nunca geram pedido duplicado). Mudanças de preço, estoque, cupom ou taxa durante a compra aparecem na revisão.
- **Confirmação:** acompanhamento do pedido por tempo real com polling de reserva, recibo com ID da transação, itens, taxas e total, e estados de pendente, confirmado e recusado.
- **Conta:** login e cadastro (modal no desktop, página no mobile) com validação e conflito de e-mail/usuário, sessão com expiração e retorno ao fluxo anterior, perfil (dados, avatar, senha) e carteiras principal e secundária.

## Stack

React · TypeScript · Vite · TanStack Router (rotas por arquivo) · TanStack Query · Axios · Socket.IO · Tailwind CSS · shadcn/ui · react-hook-form + zod · MSW · Playwright · axe-core · Lighthouse CI.

## Rotas

| URL                                             | Página                | Acesso                     |
| ----------------------------------------------- | --------------------- | -------------------------- |
| `/`                                             | Início                | público                    |
| `/nft/$nftId`                                   | Detalhes do NFT       | público                    |
| `/carrinho`                                     | Carrinho              | público                    |
| `/pagamento`                                    | Pagamento             | logado, carrinho não vazio |
| `/pedido/$orderId`                              | Confirmação do pedido | logado                     |
| `/entrar`, `/cadastro`                          | Login e cadastro      | deslogado                  |
| `/perfil`, `/perfil/dados`, `/perfil/carteiras` | Perfil e carteiras    | logado                     |

## Como rodar

Requer Node.js 20+ e npm.

```bash
npm install
npm run dev
```

O app abre em `http://localhost:5173` com o banco do mock já populado.

As credenciais do usuário de teste do seed estão em `tests/e2e/fixtures.ts` (ou crie uma conta nova em `/cadastro`). Cupons de exemplo: `KURIO10` (válido) e `EXPIRADO`.

### Scripts

| Script                                    | O que faz                                     |
| ----------------------------------------- | --------------------------------------------- |
| `npm run dev`                             | Servidor de desenvolvimento                   |
| `npm run build`                           | Typecheck e build de produção                 |
| `npm run preview`                         | Serve o build                                 |
| `npm run lint` / `npm run typecheck`      | ESLint e TypeScript                           |
| `npm run format` / `npm run format:check` | Prettier                                      |
| `npm run test:e2e`                        | Testes E2E e de regressão visual (Playwright) |
| `npm run lhci`                            | Auditoria Lighthouse CI                       |

## API simulada

A configuração do mock fica em `.env`, `.env.development` e `.env.test`:

| Variável                                                        | Efeito                                                          |
| --------------------------------------------------------------- | --------------------------------------------------------------- |
| `VITE_MOCK_LATENCY_MIN_MS` / `VITE_MOCK_LATENCY_MAX_MS`         | Faixa de latência por requisição (gera respostas fora de ordem) |
| `VITE_MOCK_ERROR_RATE` / `VITE_MOCK_NETWORK_ERROR_RATE`         | Probabilidade de erro 5xx ou de falha de conexão                |
| `VITE_MOCK_SESSION_TTL_SECONDS`                                 | Duração da sessão                                               |
| `VITE_MOCK_PAYMENT_DELAY_MS` / `VITE_MOCK_PAYMENT_DECLINE_RATE` | Tempo e chance de recusa do pagamento                           |
| `VITE_MOCK_SCENARIOS`                                           | Cenários forçados, separados por vírgula                        |
| `VITE_MOCK_SEED_RESET`                                          | Recria o banco do mock a partir do seed                         |

Em dev, um cenário também pode ser forçado pelo navegador: `localStorage.setItem('kurio:mock:scenarios', 'payment-declined')`. Exemplos: `empty-catalog`, `slow`, `offline`, `server-error:GET /nfts`, `session-expired`, `email-taken`, `price-change-on-checkout`, `sold-out-on-checkout`, `order-timeout`, `payment-slow`, `realtime-drop`, `payment-declined`, `wallet-rejected`. A lista completa está em [docs/api-mock/cenarios.md](docs/api-mock/cenarios.md).

Os dados ficam no IndexedDB e no localStorage do navegador, então carrinho, pedidos e conta sobrevivem ao refresh.

## Estrutura

```
src/
  app/          providers, router e bootstrap
  routes/       rotas (TanStack Router, baseadas em arquivos)
  pages/        telas
  components/   ui (primitivos), layout e shared (reutilizáveis)
  contexts/     estado do cliente (auth, anúncios acessíveis etc.)
  hooks/        hooks de dados e de UI
  services/     http (Axios), api, realtime (Socket.IO) e wallet
  schemas/      validação com zod
  mocks/        handlers do MSW, banco, seed, cenários, tempo real e carteira simulada
  styles/       tokens e estilos globais
tests/
  e2e/          testes E2E por fluxo, casos de borda e acessibilidade
  visual/       regressão visual desktop e mobile
docs/           documentação de design, arquitetura, API simulada, fluxos e qualidade
```

## Qualidade

- **Testes:** Playwright em Chromium (desktop 1440 px e mobile 414 px), Firefox e WebKit, cobrindo o caminho principal e os casos de borda de todos os fluxos e cenários do mock, com regressão visual contra baselines.
- **Acessibilidade:** navegação por teclado com foco visível, foco preso em dialogs e drawers, labels e erros associados, avisos `aria-live` para mutations e tempo real, verificação com axe e sem overflow horizontal em 320 px.
- **Desempenho:** Lighthouse CI nas rotas públicas e autenticadas.

## Documentação

Detalhes de design, arquitetura, contratos da API, fluxos e decisões estão em [docs/](docs/README.md).

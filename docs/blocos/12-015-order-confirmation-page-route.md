# 12-015 — Página da Confirmação e rota `/pedido/$orderId`

**Status:** pendente
**Fluxo / subitem:** Confirmação › todos (1, 2, 3, 4, 6, 7)
**Depende de:** 12-001, 12-011, 12-012, 12-013, 12-014
**Toca:** `src/pages/OrderConfirmation/OrderConfirmation.tsx` (novo), `src/routes/pedido.$orderId.tsx` (alterar)
**Paralelo:** **não**: espera todos os anteriores e é o único bloco que liga tudo. `routeTree.gen.ts` só muda se o plugin do roteador regenerar (a rota já existe); nesse caso este agente o inclui no commit.
**Lote:** I

## Objetivo
Ligar o carregamento do pedido, os estados de acesso (403 e 404), o acompanhamento em tempo real, o desfecho e as telas desktop e mobile, trocando a rota provisória pela tela real.

## Arquivos
- criar: `src/pages/OrderConfirmation/OrderConfirmation.tsx`
- alterar: `src/routes/pedido.$orderId.tsx` (mantém `staticData: { title: 'Pedido' }` e `beforeLoad: requireAuth`; ganha `loader`, `pendingComponent` e o novo `component`)

## Referências
- docs/fluxos/confirmacao.md (todos os subitens); docs/arquitetura/rotas.md (`/pedido/$orderId`, `loader` com `ensureQueryData`/`fetchQuery`, `pendingComponent`); docs/api-mock/cenarios.md (`forbidden-order`)
- Padrão de rota com `loader`, 404 e título: `src/routes/nft.$nftId.tsx` + `src/pages/NftDetails/NftDetails.tsx`; padrão de estados com `PageHeader`: `src/pages/Cart/Cart.tsx` (`PageHeader({ isDesktop })` local: `Breadcrumb` + `h1` `sr-only` no desktop, `MobileTopBar` no mobile)
- `orderOptions`, `useOrder` (12-011), `useOrderLive` (12-011), `useOrderOutcome` (12-012), `OrderConfirmationDesktop/Mobile/Skeleton`, `viewProps.ts` (12-013, 12-014, 12-008), `EmptyState`, `ErrorState`, `Button`, `queryClient` (`@/app/queryClient`), `isApiError`, `useAuth` de `@/contexts/auth`, `useIsDesktop`

## Instruções
1. **Rota** (`pedido.$orderId.tsx`): 
   - `loader({ params })`: `try { await queryClient.fetchQuery(orderOptions(params.orderId)); return { access: 'ok', documentTitle: 'Pedido' } } catch (error) { … }`. `isApiError(error) && error.status === 403` → `{ access: 'forbidden', documentTitle: 'Acesso negado' }`; `status === 404` → `{ access: 'not-found', documentTitle: 'Pedido não encontrado' }`; qualquer outro erro é relançado (o `errorComponent` da raiz mostra o `ErrorState` com "Tentar novamente"). O `fetchQuery` com `staleTime: 0` sempre busca o servidor (o cache de uma visita antiga nunca vale). Declarar o tipo de retorno do `loader` para `access` ser a união `'ok' | 'forbidden' | 'not-found'` (sem `as`).
   - `pendingComponent: OrderConfirmationSkeleton`, `pendingMs: 200`; `component` lê `Route.useParams()` e `Route.useLoaderData()` e renderiza `<OrderConfirmation orderId access />`.
2. `OrderConfirmation({ orderId, access })`:
   - `useIsDesktop()`. `access !== 'ok'` → estado sem diálogo: `PageHeader({ isDesktop })` local (desktop: `Breadcrumb` `Início` → `/` e `Pedido` + `h1` `sr-only` "Pedido"; mobile: `MobileTopBar title="Pedido" backTo={{ to: '/' }}`) e `EmptyState as="h2"` dentro do `container-page` (desktop) ou da largura toda (mobile):
     - `forbidden`: título "Você não tem acesso a este pedido", descrição "Este pedido pertence a outra conta.", botão `asChild` + `Link to="/"` "Voltar para o início".
     - `not-found`: título "Pedido não encontrado", descrição "O pedido que você procura não existe ou foi removido.", o mesmo botão.
     - Pedido de outro usuário e inexistente **não** vazam nenhum dado do pedido.
   - `access === 'ok'` → `<OrderConfirmationContent key={orderId} orderId={orderId} />`; a `key` zera o estado dos hooks se o parâmetro mudar.
3. `OrderConfirmationContent({ orderId })`: `useAuth()` (de `@/contexts/auth`; `user?.id`), `query = useOrder(orderId)`, `order = query.data`, `useOrderLive(orderId, order?.status)`, `{ isSlow } = useOrderOutcome(order, user?.id)`, `navigate = useNavigate()`.
   - `order === undefined`: `query.isError` → `PageHeader` + `ErrorState` com "Tentar novamente" (`query.refetch`); senão `OrderConfirmationSkeleton`.
   - Com `order`: `viewProps: OrderViewProps = { order, isSlow, onClose: () => { void navigate({ to: '/' }) } }` e `isDesktop ? <OrderConfirmationDesktop {...viewProps} /> : <OrderConfirmationMobile {...viewProps} />`. Redimensionar entre desktop e mobile no meio não perde o estado (ele está nos hooks, não nas telas).
4. **Não** renderizar o recibo nem o `txHash` fora do `OrderStatus` (ele só mostra o recibo com `confirmed`). Sem `ref` lido no render; sem estado duplicado que já exista nos hooks. `routeTree.gen.ts`: não editar à mão.
5. Fechamento: prettier; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit só dos arquivos tocados (inclui `routeTree.gen.ts` se o plugin o regenerou): `git commit -m "12-015: página da confirmação" -- <arquivos>`.

## Critérios de aceite
- [ ] Depois de pagar, `/pedido/<id>` mostra "Confirmando pagamento..." e, sem recarregar, troca para o recibo (ou para a recusa) sozinha.
- [ ] Refresh em `/pedido/<id>` pendente retoma o acompanhamento; a lista de pendentes e `kurio:checkout` ficam consistentes depois do desfecho.
- [ ] `403` mostra "Você não tem acesso a este pedido" com o link para a Início; `404` mostra "Pedido não encontrado"; ambos com `h1`, breadcrumb (desktop) ou barra (mobile).
- [ ] Sem login: `/entrar?redirect=/pedido/<id>` (guarda `requireAuth` já existente).
- [ ] X, Esc (desktop) e voltar (mobile) levam à Início; o recibo continua acessível pela URL.
- [ ] Sem `any`, `as`, `!`, `@ts-ignore` nem `eslint-disable`; sem `ref` no render.

## Verificação (Sonnet)
- format:check, lint, typecheck, build e uma passada manual no navegador (desktop e mobile): pagar → pendente → confirmado → fechar; `localStorage['kurio:mock:scenarios']='payment-declined'` → recusado → "Tentar novamente".

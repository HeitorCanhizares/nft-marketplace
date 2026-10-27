# 11-017 — Página do Pagamento e rota `/pagamento`

**Status:** concluído
**Fluxo / subitem:** Pagamento › todos
**Depende de:** 11-008, 11-012, 11-013, 11-015, 11-016
**Toca:** `src/pages/Checkout/Checkout.tsx` (novo), `src/routes/pagamento.tsx` (alterar)
**Paralelo:** **não**: espera todos os anteriores e é o único bloco que liga tudo. `routeTree.gen.ts` só muda se o plugin do roteador regenerar; nesse caso este agente o inclui no commit (nenhum outro agente toca nele nesta etapa).
**Lote:** L

## Objetivo
Ligar entrada, dados, hooks, telas e revisão e trocar a rota provisória pela tela real.

## Arquivos
- criar: `src/pages/Checkout/Checkout.tsx`
- alterar: `src/routes/pagamento.tsx` (renderizar `Checkout`; manter `staticData: { title: 'Pagamento' }` e `beforeLoad: requireAuth`; **sem `validateSearch`**)

## Referências
- docs/fluxos/pagamento.md (todos os subitens); `src/pages/Cart/Cart.tsx` (padrão de página: `useIsDesktop`, carregando/erro, `viewProps`); `src/pages/Wallets/Wallets.tsx` (padrão "conteúdo só monta com os dados")
- `useCheckoutEntry` (11-008), `useWallets`, `useCheckoutForm` (11-007), `useCheckoutQuote`, `useCheckoutWallet` (11-005), `useCheckoutReview` (11-013), `useCartCoupon`, `useCartLive` (`src/hooks`), `CheckoutDesktop`, `CheckoutMobile`, `CheckoutSkeleton`, `CheckoutViewProps` (11-014 a 11-016), `CheckoutReview` (11-012), `ErrorState`, `useAuth`

## Instruções
1. `Checkout()`: `useIsDesktop()`, `useCheckoutEntry()` e `useWallets()`.
   - `entry.status === 'checking'` ou `useWallets` carregando → `CheckoutSkeleton` (variant por viewport; no mobile, `MobileTopBar` fica dentro da tela real, então o esqueleto basta).
   - Erro do carrinho ou das carteiras → `ErrorState` com "Tentar novamente" (`entry.retryCart` / `refetch`).
   - Com tudo pronto, renderiza `CheckoutContent` (componente interno) com `cart`, `wallets` e `user`; assim os hooks do formulário **não** são condicionais.
2. `CheckoutContent`: monta `form = useCheckoutForm(wallets, user)`, `quoteState = useCheckoutQuote(cart, form.network)`, `wallet = useCheckoutWallet(form.network, form.provider, form.setProvider)`, `review = useCheckoutReview({ user, form, wallet, quote: quoteState.quote, refreshQuote: quoteState.refresh })`, `coupon = useCartCoupon()` e `useCartLive(cart)`.
3. Monta `CheckoutViewProps` (`items: cart.items`; `quote: { quote, isUpdating, isError, onRetry: refetch }`; `coupon` no mesmo formato de `Cart.tsx` — `status` vem de `quoteState.quote?.coupon?.status`; `confirm: { onConfirm: review.confirmPurchase, isChecking: review.isChecking, message: review.blockMessage ?? form.noteError }`; `onEditWallet: () => navigate({ to: '/perfil/carteiras', search: { redirect: '/pagamento' } })`) e escolhe `CheckoutDesktop` ou `CheckoutMobile` (este com `primaryWallet`/`secondaryWallet`).
4. Renderiza também `CheckoutReview` com `review.review` (`open`, `quote`, `changes`, `phase`, `error`, `removingId`, `canPay`, `blockMessage`), `collectorName`/`collectorAddress` de `review.collected?.collector` (`displayName`, `address`), `provider = wallet.provider`, `walletAddress = wallet.connection.address`, `network = form.network`, `onReconnect = wallet.reconnect`, `onPay = review.pay`, `onBack = review.closeReview`, `onRemoveItem = review.removeSoldOut`.
5. **Não** usar `UnsavedChangesGuard` (o rascunho já preserva o formulário; o guarda bloquearia a navegação para `/entrar` e `/pedido`).
6. Sem `ref` lido no render; sem estado duplicado que já exista nos hooks.
7. Fechamento: prettier; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit só dos arquivos tocados: `git commit -m "11-017: página do pagamento" -- <arquivos>`.

## Critérios de aceite
- [ ] Logado com carrinho: desktop mostra formulário e coluna "Seus NFTs"; mobile mostra as carteiras salvas.
- [ ] Carrinho vazio → `/carrinho`; pedido pendente → `/pedido/$orderId`.
- [ ] Redimensionar entre desktop e mobile mantém modo, provedor, observação e conexão (estado está nos hooks, não nas telas).
- [ ] "Confirmar compra" → revisão → "Confirmar e pagar" → `/pedido/$orderId`.
- [ ] Sem `any`, `as` ou `@ts-ignore`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build e uma passada manual no navegador (desktop e mobile) até a navegação para `/pedido/…`.

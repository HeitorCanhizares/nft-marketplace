# 08-012 — Página do carrinho (dados, estados, foco) e rota

**Status:** concluído
**Fluxo / subitem:** Carrinho › 3 (foco), 6 (persistência), 8 (contador), 9 (ir para o pagamento), 11 (estados)
**Depende de:** 08-011, 08-008, 08-006, 08-007

## Objetivo
Ligar os hooks às telas, tratar carregando, vazio e erro, devolver o foco depois de remover e trocar a rota provisória.

## Arquivos
- criar: `src/pages/Cart/Cart.tsx`
- criar: `src/pages/Cart/CartSkeleton.tsx`
- alterar: `src/routes/carrinho.tsx`

## Referências
- docs/fluxos/carrinho.md (subitens 3, 8, 9, 11); docs/arquitetura/rotas.md (`/carrinho` público; `staticData` com `title`)
- `src/pages/NftDetails/NftDetails.tsx` e `src/routes/nft.$nftId.tsx` (modelo de página/rota), `src/hooks/useCart.ts`, `useCartQuote`, `useCartItemActions`, `useCartCoupon`, `useCartLive`, `lib/cartCheckout.ts`, `src/contexts/auth.ts`, `src/hooks/useMediaQuery.ts` (`useIsDesktop`), `EmptyState`, `ErrorState`, `LineItemSkeleton`

## Instruções
1. `Cart.tsx`: `useCart()`; `useCartQuote(cart)`; `useCartItemActions()`; `useCartCoupon()`; `useCartLive(cart)`; `useAuth()`; `useIsDesktop()`. Monta `CartViewProps` e renderiza `CartDesktop` ou `CartMobile`.
   - `priceChanges`: mapa `item.id → priceChanged` a partir de `quote.items`.
   - `busyIds`: ids em `pendingIds` das ações; o resumo recebe `isUpdating` = `isUpdating` da cotação **ou** há ação em andamento.
   - `checkout`: `getCheckoutState(items)` (08-008); `onCheckout` navega com `checkoutTarget(status === 'authenticated')`.
   - **Carregando** (`useCart` sem dado e sem erro): `CartSkeleton` (3 `LineItemSkeleton` + bloco do resumo; desktop e mobile). **Erro** (`useCart` com erro e sem dado): `ErrorState` com "Tentar novamente" (`refetch`). **Vazio** (`items.length === 0`): `EmptyState as="h2"` "Seu carrinho está vazio" com ação "Explorar NFTs" (`/` com `hash="catalogo"`), **sem** painel de resumo nem carrossel; no mobile mantém a `MobileTopBar`, no desktop o `Breadcrumb` e o `h1` oculto.
   - **Foco ao remover:** no `onRemove`, guardar o índice da linha, chamar `remove(item)` e, no quadro seguinte (`requestAnimationFrame`), focar a lixeira `[data-remove-for]` que agora ocupa aquele índice (ou a anterior, se era a última); se a lista ficou vazia, focar o título do estado vazio (definir `tabindex="-1"` no elemento e chamar `focus()`). Nada de `useRef` lido no render.
2. `CartSkeleton.tsx`: só composição dos skeletons existentes (`LineItemSkeleton`, `Skeleton`), `aria-busy`.
3. `routes/carrinho.tsx`: `createFileRoute('/carrinho')` com `staticData: { title: 'Carrinho' }` (continua público, **sem** `mobileTabBar`) e `component` = `Cart`. Remover o comentário "Placeholder". Regerar `routeTree.gen.ts` se o plugin exigir (não editar à mão).
4. Procurar testes antigos que dependem do `h1` provisório "Carrinho" (`grep -rn "Carrinho" tests/e2e/layout.spec.ts`, linhas ~375–440: foco no `h1` e título "Carrinho | Kurio") e ajustar para o nome **"Carrinho de NFTs"** (o título da aba continua "Carrinho | Kurio").
5. Fechamento: prettier nos 3; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0; `npm run test:e2e -- layout` verde (um projeto de cada vez se for lento). Commit: `08-012: página do carrinho`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; nenhuma conta de ETH; nenhum `ref` lido ou escrito durante o render; `react-hooks` sem avisos.
- [ ] `/carrinho` mostra skeleton, depois a lista; vazio mostra "Seu carrinho está vazio" e "Explorar NFTs"; erro mostra "Tentar novamente".
- [ ] Remover a linha do meio leva o foco à lixeira da próxima; remover a última leva ao título do estado vazio.
- [ ] Visitante clica "Conectar e finalizar" → `/entrar?redirect=/pagamento`; logado → `/pagamento`. Carrinho com item esgotado ou `insufficient`: botão desabilitado com o motivo.
- [ ] Recarregar a página mantém itens e cupom.

## Verificação (Sonnet)
- format:check, lint, typecheck, build, spec `layout`. Fluxo completo no 08-013.

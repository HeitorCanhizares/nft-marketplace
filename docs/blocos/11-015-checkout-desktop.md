# 11-015 — Coluna "Seus NFTs", `PriceSummary` variante `checkout` e tela desktop

**Status:** pendente
**Fluxo / subitem:** Pagamento › 5, 6, 7
**Depende de:** 11-005, 11-009, 11-010, 11-011, 11-014
**Toca:** `src/pages/Checkout/OrderSummaryColumn.tsx` (novo), `src/pages/Checkout/CheckoutDesktop.tsx` (novo), `src/components/shared/PriceSummary.tsx` (alterar; usado pelo carrinho e pela revisão)
**Paralelo:** pode rodar com 11-012, 11-013 e 11-016 (arquivos distintos). Nenhum outro bloco da fase altera `PriceSummary.tsx`.
**Lote:** J (depois do 11-014)

## Objetivo
A coluna direita do desktop (itens, cupom recolhido, valores, "Carteira e rede", estado da conexão e "Confirmar compra") e a composição da tela desktop com o `Breadcrumb`.

## Arquivos
- criar: `src/pages/Checkout/OrderSummaryColumn.tsx`
- criar: `src/pages/Checkout/CheckoutDesktop.tsx`
- alterar: `src/components/shared/PriceSummary.tsx` (prop opcional `variant?: 'default' | 'checkout'`, padrão `default`)

## Referências
- docs/fluxos/pagamento.md subitens 5, 6 e 7; tela `docs/design/telas/desktop-pagamento.png` (1:1; **medir com recorte**)
- `CheckoutViewProps` (11-014), `LineItemList variant="summary"` (11-011), `CouponField collapsible`, `WalletProviderOption` (11-009), `WalletConnectionStatus` (11-010), `PriceSummary`, `Breadcrumb`, `RadioGroup`, `src/pages/Cart/CartDesktop.tsx` (breadcrumb e `container-page`)

## Medidas do Figma (desktop; coluna direita de **405 px**, x 915–1320)
- "Seus NFTs" (`h2`, negrito ≈ 17 px, centro y 158, **na mesma linha** do "Perfil do colecionador"); cabeçalho "NFTs | Subtotal" em y 185; linhas de 70 px a partir de y 217 (11-011).
- Cupom recolhido: centro y 471, ≈ 20 px abaixo da última linha. Valores (`PriceSummary` do carrinho): linhas em y 501, 534 e 566 (passo ≈ 33 px).
- Linha divisória de 1 px em y 614 e linha "Total" (negrito) em y 636.
- "Carteira e rede" (`h2`, negrito ≈ 17 px, **centralizado** na coluna, centro y 664). Opções de provedor (`WalletProviderOption variant="desktop"`) de **405 × 45 px** em y 691, 752 e 813 (passo 61). Botão "Confirmar compra" de **405 × 45 px** em y 882–927 (24 px abaixo da última opção), largura total, `Button` padrão (`primary`), texto `primary-foreground`.
- Breadcrumb "Início / Mercado / Pagamento" em y 110; breadcrumb → título: 48 px (centro a centro). Container de 1200 px (x 120–1320), colunas `grid-cols-[minmax(0,1fr)_405px]` com 32 px de espaço.

## Instruções
1. `OrderSummaryColumn(props: CheckoutViewProps)`:
   - `h2` "Seus NFTs" e `LineItemList variant="summary" items={items}`.
   - `CouponField collapsible variant="desktop"` ligado a `coupon` (mesmas props do carrinho).
   - `PriceSummary variant="checkout"` com `quote`.
   - `PriceSummary.tsx`: acrescentar `variant` (padrão `default`, que **não muda nada**: carrinho e revisão). `checkout` segue o Figma do Pagamento, medido no recorte: linhas Subtotal, Desconto do lançamento e Taxa de rede com passo ≈ 33 px (centros em y 501, 534, 566), **"Taxa estimada" centralizada** na coluna (y 596, texto pequeno), linha divisória de 1 px em y 614 e a linha "Total" (negrito, `price`) em y 636 com o rótulo recuado como no Figma. Medir x/y no recorte e copiar.
   - `h2` "Carteira e rede" centralizado e `RadioGroup` (`value={wallet.provider ?? ''}`, `onValueChange` → `wallet.choose`, `aria-label="Carteira e rede"`) com `WalletProviderOption` WalletConnect, MetaMask, Coinbase Wallet (nessa ordem, `PROVIDER_OPTIONS` reordenado).
   - `WalletConnectionStatus` logo abaixo das opções, ligado a `wallet` (`status`/`address`/`network`/`errorCode` de `wallet.connection`; `expectedNetwork = form.network`; `hint = wallet.hint`; `onReconnect = wallet.reconnect`; `onSwitchNetwork = wallet.switchToExpected`; `onDisconnect = wallet.changeWallet`).
   - Botão "Confirmar compra": `onClick={confirm.onConfirm}`, **bloqueado contra clique repetido** (`aria-busy={confirm.isChecking}` e ignora cliques enquanto `isChecking`), **sem `disabled`** quando a carteira não está pronta (a mensagem explica); a mensagem `confirm.message` aparece abaixo em `role="alert"` com `aria-describedby` no botão.
2. `CheckoutDesktop(props: CheckoutViewProps)`: `container-page`, `Breadcrumb` (`Início` → `/`, `Mercado` → `/` + `hash: 'catalogo'`, `Pagamento`), `h1` `sr-only` "Pagamento", grade de duas colunas com `CollectorSection` (11-014) e `OrderSummaryColumn`. A coluna direita não é `sticky` (a esquerda é mais alta, como no Figma).
3. Só tokens de cor; `cn`; sem `ref` no render; sem hexadecimal.
4. Fechamento: prettier nos 2; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0 (se falhar por arquivo de **outro** agente, esperar e repetir). Commit só dos 2: `git commit -m "11-015: tela desktop do pagamento" -- <arquivos>`.

## Critérios de aceite
- [ ] A 1440 px: coluna direita de 405 px; opções e botão de 405 × 45 px; passo das opções de 61 px (DOM e recorte).
- [ ] `PriceSummary` `default` idêntico ao anterior (spec do carrinho verde); `checkout` confere com o recorte.
- [ ] Escolher uma opção chama `wallet.choose`; o estado da conexão muda abaixo das opções.
- [ ] "Confirmar compra" não dispara duas vezes em cliques repetidos.
- [ ] Sem rolagem horizontal de 1024 a 1440 px. Sem cor hexadecimal fora dos tokens; sem `any`, `as` ou `@ts-ignore`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build, `npm run test:e2e -- cart`. Visual no 11-019.

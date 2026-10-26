# 08-009 — `LineItem` (`cart-row` e `cart-card`), `LineItemList` e `LineItemSkeleton`

**Status:** concluído
**Fluxo / subitem:** Carrinho › 1 (lista), 2 (quantidade), 3 (lixeira), 7 (esgotado, estoque, preço atualizado), 11 (carregando)
**Depende de:** 08-006

## Objetivo
A linha do carrinho em duas variantes, a lista com cabeçalho (tabela no desktop, cards no mobile) e o skeleton.

## Arquivos
- criar: `src/components/shared/LineItem.tsx`
- criar: `src/components/shared/LineItemList.tsx`
- criar: `src/components/shared/LineItemSkeleton.tsx`

## Referências
- Telas: `docs/design/telas/desktop-carrinho.png` e `mobile-carrinho.png` (1:1); correção do Figma: **lixeira mobile no canto superior direito do card, separada do stepper** (docs/design/telas/README.md)
- docs/design/componentes.md (`LineItem` variantes `cart-row` e `cart-card`; `LineItemList` com cabeçalho NFTs / Preço / Edições / Total; `PriceChangedNotice`)
- docs/fluxos/carrinho.md (subitens 1, 2, 3, 7)
- `QuantityStepper`, `PriceTag`, `PriceChangedNotice`, `Skeleton`, `src/lib/formatEth.ts`, `src/lib/maxQuantity.ts` (`MAX_PER_PURCHASE`), `NftCardSkeleton` (padrão de skeleton)

## Instruções
1. **`LineItem`** — props: `variant: 'cart-row' | 'cart-card'`, `item: CartItem`, `priceChange?: { from: string; to: string }`, `busy?: boolean`, `onQuantityChange(item, quantity)`, `onRemove(item)`, `onAdjust(item)`. Componentes internos **no mesmo arquivo**; nada de dois componentes copiados.
   - `cart-row` renderiza `<tr>`; células: **NFTs** (miniatura 70 px arredondada + nome + "ID do token: {tokenId}" + "Edição {label}"), **Preço** (`unitPrice` em ETH, cor primária), **Edições** (stepper), **Total** (`lineTotal`), **ação** (lixeira).
   - `cart-card` renderiza `<li>`: imagem à esquerda, nome, "Edição: {label}", **`lineTotal`** (como no Figma mobile: Ivory 2 × 1.79 mostra 3.58), stepper embaixo e **lixeira no canto superior direito do card**, com espaço próprio (não sobrepõe o "+").
   - Nome e imagem são `Link` para `/nft/$nftId` (um só link por NFT em cada variante, o da imagem com `aria-hidden` e `tabIndex={-1}` ou o nome cobrindo ambos).
   - Stepper: `QuantityStepper` `size="sm"`, `min` 1, `max = item.available ?? MAX_PER_PURCHASE`, `value = item.quantity`, `label` "Quantidade de {nome}", dentro de `role="group"` com `aria-label` "Quantidade de {nome}". O "−" fica **desabilitado em 1** (já é o comportamento do `QuantityStepper`); `hint` "Máximo disponível: N" (ou "Máximo por compra: 99" quando `available` é `null`) **só quando** `quantity >= max`. `onChange={(q) => onQuantityChange(item, q)}`.
   - Lixeira: `Button variant="icon"` com `aria-label` "Remover {nome}" (ex.: "Remover Emerald Ape #042"), alvo ≥ 44 px, atributo `data-remove-for={item.id}` (a página usa para devolver o foco), ícone `Trash2Icon` com `aria-hidden`.
   - **Estados:** `availability === 'sold_out'`: `PriceChangedNotice kind="sold-out"` junto ao nome, texto "Remova este item para finalizar.", `lineTotal` com `line-through` e texto só para leitor de tela "fora do total", stepper desabilitado (`max` 0). `'insufficient'`: texto "Restam {available}" + botão "Ajustar para {available}" (`onAdjust`). `priceChange`: texto "Preço atualizado: {from} → {to} ETH" (`formatEth`) com ícone (não só cor). `low_stock`: sem marca extra. `busy`: `aria-busy="true"` e opacidade reduzida **só** no total da linha.
   - **Sem conta de valores**: `unitPrice` e `lineTotal` vêm prontos da API.
2. **`LineItemList`** — props: `variant`, `items`, `priceChanges: ReadonlyMap<string, { from: string; to: string }>`, `busyIds: ReadonlySet<string>`, os três callbacks, `isLoading?`. `cart-row`: `<table>` semântica com `<caption className="sr-only">Itens do carrinho</caption>`, `<thead>` NFTs / Preço / Edições / Total / `<span className="sr-only">Remover</span>` (`scope="col"`), `<tbody>` com `LineItem`; espaçamento entre linhas e fundo das linhas como no Figma. `cart-card`: `<ul>` de `LineItem`. Com `isLoading`, 3 `LineItemSkeleton` no mesmo formato.
3. **`LineItemSkeleton`** — `variant`; `cart-row` como `<tr>`, `cart-card` como `<li>`, `aria-hidden`.
4. Fechamento: prettier nos 3; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `08-009: linha e lista do carrinho`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; sem cor hexadecimal fora dos tokens; classes de fonte e raio personalizadas já registradas no `cn` (sem `!`).
- [ ] Desktop é tabela com cabeçalhos; mobile é lista; lixeira mobile no canto superior direito sem tocar o stepper.
- [ ] Acessibilidade: cada lixeira com nome único; stepper em grupo nomeado; alvos ≥ 44 px; sem overflow horizontal em 320 px; estado de esgotado/preço com texto, não só cor.
- [ ] Nenhum `ref` no render.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Visual no 08-013 (uma captura por tela).

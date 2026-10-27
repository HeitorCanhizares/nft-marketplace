# 12-006 — `LineItem` variante `receipt` (recibo do pedido)

**Status:** concluído
**Fluxo / subitem:** Confirmação › 3 (recibo montado só com o snapshot)
**Depende de:** —
**Toca:** `src/components/shared/LineItem.tsx` (alterar), `src/components/shared/LineItemList.tsx` (alterar), `src/components/shared/LineItemSkeleton.tsx` (alterar)
**Paralelo:** pode rodar com os lotes A, B e D da onda 1. O 12-009 espera este. **Atenção:** os três arquivos são do carrinho e do Pagamento; as variantes `cart-row`, `cart-card` e `summary` não podem mudar.
**Lote:** C (mesmo agente de 12-007)

## Objetivo
A linha só de leitura do recibo, que recebe um `OrderItemSnapshot` (nunca um `CartItem`), e a lista com o cabeçalho "NFTs | Edições | Subtotal".

## Arquivos
- alterar: `src/components/shared/LineItem.tsx`
- alterar: `src/components/shared/LineItemList.tsx`
- alterar: `src/components/shared/LineItemSkeleton.tsx`

## Referências
- docs/design/componentes.md (`LineItem` `receipt`, `LineItemList`); tela `docs/design/telas/desktop-confirmacao.png` (1:1; **medir com recorte**)
- Os três arquivos atuais (`LineItemVariant`, `LineItemProps`, `SummaryLine`, `SummaryLineItemList`), `src/lib/formatEth.ts`, `src/types/order.ts` (`OrderItemSnapshot`)

## Medidas do Figma (desktop, tabela de **490 px**, x 475–965 dentro do modal)
- Cabeçalho "NFTs" à esquerda, "Edições" centralizado em ≈ x 805 e "Subtotal" à direita, 15 px (`text-body`) `foreground`, y 438–454; linha de **1 px** (`border-soft`) em y 464.
- Linhas de **70 px** de altura (y 477, 559, 641 com **12 px** de espaço; o Figma tem miniaturas de 70, 66 e 65 px: usar 70 nas três). Miniatura **70 × 70 px**, raio `rounded-media`. Nome em 16 px (`text-base`) negrito `foreground` e "ID do token: #0042" em 14 px (`text-sm`) `tan`, empilhados a **12 px** da miniatura (texto a x 557). "(x 2)" em 14 px `muted-foreground`, centralizado sob "Edições" (coluna de ≈ 90 px). Subtotal da linha em 17 px (`text-subtitle`) negrito `text-price` (`#e89b55`, **não** `primary`), alinhado à direita da tabela.
- Fundo das linhas = `card` (o mesmo do modal, então não aparece como bloco).

## Instruções
1. `LineItem.tsx`: `LineItemVariant` ganha `'receipt'`. A união de props ganha `ReceiptLineItemProps = { variant: 'receipt'; item: OrderItemSnapshot }` (sem handlers). `ReceiptLine` renderiza `<li>` com: miniatura sem link, `alt=""` (o nome está ao lado), nome, "ID do token: {tokenId}", **"Edição {editionLabel}" abaixo do ID (decisão Q5; mesma linha de 14 px `tan`)**, "(x {quantity})" e `formatEth(lineTotal)`. Sem estado esgotado: o snapshot só tem o que foi comprado. Textos longos quebram (`min-w-0`), e "(x N)" e o subtotal nunca se sobrepõem ao nome; a altura da linha cresce. **Mobile** (adaptado; a mesma linha, responsiva por CSS): abaixo de 1024 px (`max-lg:`) a linha é um cartão (`rounded-card overflow-hidden`, miniatura encostada à esquerda, `pr-3`) sobre o fundo `background` da página.
2. `LineItemList.tsx`: acrescentar `ReceiptLineItemListProps = { variant: 'receipt'; items: readonly OrderItemSnapshot[]; isLoading?: boolean }` e `ReceiptLineItemList`: `<div>` com o cabeçalho visual "NFTs | Edições | Subtotal" (`aria-hidden="true"`, `grid` de 3 colunas como acima) e a linha de 1 px, seguido de `<ul aria-label="Itens do pedido" className="mt-3 flex flex-col gap-3">`; chave das linhas `${nftId}-${editionId}`. `isLoading` usa `LineItemSkeleton variant="receipt"`.
3. `LineItemSkeleton.tsx`: aceitar `receipt` (linha de 70 px com miniatura 70 × 70 e duas barras de texto).
4. Só tokens de cor; `cn`; sem hexadecimal. As outras variantes ficam byte a byte como estão.
5. Fechamento: prettier nos 3; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0 (se falhar por arquivo de **outro** agente em andamento, esperar e repetir, sem mexer nele). Commit só dos 3: `git commit -m "12-006: LineItem receipt" -- <arquivos>`.

## Critérios de aceite
- [ ] Linha de 70 px, miniatura de 70 × 70 e espaço de 12 px conferidos no recorte da captura (verificação final no 12-019).
- [ ] Carrinho e Pagamento idênticos aos de antes (specs `cart` e `checkout` verdes).
- [ ] Os tipos impedem passar `CartItem` à `receipt` e `OrderItemSnapshot` às outras variantes.
- [ ] Sem cor hexadecimal fora dos tokens; sem `any`, `as`, `!`, `@ts-ignore` nem `eslint-disable`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build, `npm run test:e2e -- cart checkout`. Visual no 12-019.

# 11-011 — `LineItem` variante `summary` (Pagamento e revisão)

**Status:** concluído
**Fluxo / subitem:** Pagamento › 6, 7
**Depende de:** —
**Toca:** `src/components/shared/LineItem.tsx` (alterar), `src/components/shared/LineItemList.tsx` (alterar), `src/components/shared/LineItemSkeleton.tsx` (alterar)
**Paralelo:** pode rodar com 11-001, 11-004, 11-009. Os blocos 11-012 e 11-015 esperam este. **Atenção:** os três arquivos são do carrinho; as variantes `cart-row` e `cart-card` não podem mudar.
**Lote:** D

## Objetivo
A linha só de leitura da coluna "Seus NFTs" do Pagamento e da revisão, e a lista com o cabeçalho "NFTs | Subtotal".

## Arquivos
- alterar: `src/components/shared/LineItem.tsx`
- alterar: `src/components/shared/LineItemList.tsx`
- alterar: `src/components/shared/LineItemSkeleton.tsx`

## Referências
- docs/design/componentes.md (`LineItem` `summary`, `LineItemList`); tela `docs/design/telas/desktop-pagamento.png` (1:1)
- Os três arquivos atuais (`LineItemVariant = 'cart-row' | 'cart-card'`, `LineItemProps`), `src/lib/formatEth.ts`

## Medidas do Figma (desktop, coluna de 405 px, x 915–1320)
- Título "Seus NFTs" em negrito (y 158) e, abaixo, o cabeçalho "NFTs" (esquerda) e "Subtotal" (direita, alinhado à direita), y 185, sem linha.
- Linhas de **70 px** de altura, fundo `card`, **espaço de 12 px** entre elas (y 217, 299, 381). Miniatura **70 × 70 px** (x 919–989), raio pequeno. Nome em negrito e "ID do token: #0042" em `muted-foreground` empilhados ao lado da miniatura (≈ 8 px de espaço); "(x 2)" em `muted-foreground` (≈ x 1160); subtotal da linha em `price`, negrito, alinhado à direita com 12 px de margem (x 1308). Em linhas com nome longo o texto quebra, a altura da linha cresce, e "(x N)" e o subtotal não se sobrepõem a ele.

## Instruções
1. `LineItem`: `LineItemVariant` ganha `'summary'`. Mudar `LineItemProps` para **união discriminada**: as variantes do carrinho continuam com `onQuantityChange`, `onRemove`, `onAdjust` obrigatórios; `summary` recebe só `{ variant: 'summary', item: CartItem }` (sem handlers). A variante `summary` renderiza `<li>` com: miniatura (a mesma `LineThumb`, mas **sem link** dentro da revisão: usar só imagem decorativa `alt=""`), `LineName` sem link (texto), "ID do token: {tokenId}", "(x {quantidade})" e `formatEth(item.lineTotal)`. Item esgotado: subtotal riscado + "esgotado" em texto (`sr-only` "fora do total" como no carrinho).
2. `LineItemList`: a união também vale aqui; com `variant="summary"` renderiza `<ul aria-label="Seus NFTs">` com o cabeçalho visual "NFTs | Subtotal" (decorativo, `aria-hidden`) e as linhas com `gap-3` (12 px). As outras variantes ficam como estão. Estado `isLoading` com `LineItemSkeleton variant="summary"`.
3. `LineItemSkeleton`: aceitar `summary` (retângulo de 70 px de altura, miniatura 70 × 70).
4. Só tokens de cor; `cn`; sem hexadecimal.
5. Fechamento: prettier nos 3; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0 (se falhar por arquivo de **outro** agente, esperar e repetir). Commit só dos 3: `git commit -m "11-011: LineItem summary" -- <arquivos>`.

## Critérios de aceite
- [ ] Linha de 70 px, miniatura de 70 × 70 e espaço de 12 px conferidos no recorte da captura.
- [ ] Carrinho (desktop e mobile) idêntico ao anterior (o spec do carrinho continua verde: `npm run test:e2e -- cart`).
- [ ] Os tipos impedem passar handlers à `summary` e exigem os handlers nas variantes do carrinho.
- [ ] Sem cor hexadecimal fora dos tokens; sem `any`, `as` ou `@ts-ignore`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build, `npm run test:e2e -- cart`. Visual: uma captura lado a lado no 11-019.

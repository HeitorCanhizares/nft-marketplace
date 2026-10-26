# 06-048 — `PromoCard`

**Status:** pendente
**Fluxo / subitem:** Início › 10 (promos levam ao catálogo filtrado; só desktop)
**Depende de:** 06-004, 06-001, 01-015

## Objetivo
Criar o cartão promocional ("Lançamentos gênesis de edição limitada" / "Arte digital selecionada e muito mais") com o botão "Explorar" que abre o catálogo filtrado, e o esqueleto dele.

## Arquivos
- criar: `src/components/shared/PromoCard.tsx`
- criar: `src/components/shared/PromoCardSkeleton.tsx`

## Referências
- docs/fluxos/inicio.md (subitem 10) e docs/api-mock/contratos.md (`Promo`: `query.tab`/`collection`...)
- `src/lib/catalogOptions.ts` (`promoToSearch`)
- Captura 1:1 `desktop-inicio.png`: dois cartões de **586×250 px** (x 120–706 e 734–1320, **28 px** entre eles, y 2116–2365), `bg-card`, raio pequeno; imagem à esquerda **287×250** (raio 24 em todos os cantos); coluna de texto à direita, **alinhada à direita**, com 30 px de recuo à direita; título **18 px** negrito `foreground` (2 linhas, passo 24), texto **14 px** `muted-foreground` (3 linhas, passo 24), botão **"Explorar →" 140×40 px** (`primary`, 14 px, `ArrowRightIcon` 16 px) alinhado à direita, com ≈ 46 px de espaço abaixo. **No Figma o título do 2º cartão invade a imagem:** corrigir deixando o texto quebrar dentro da coluna

## Instruções
1. Props: `promo: Promo`, `className?`. `<article className="grid grid-cols-[287px_1fr] overflow-hidden rounded-lg bg-card">`; coluna da imagem (`<img>` `alt` = `promo.image.alt`, `h-full w-full rounded-panel object-cover`) e coluna de texto `flex flex-col items-end justify-center gap-3 py-6 pr-7.5 pl-4 text-right`.
2. `<h3 className="text-lg font-bold">` com `promo.title`; `<p className="text-sm text-muted-foreground">` com `promo.text`; `Button asChild` com `Link to="/" search={promoToSearch(promo.query)} hash="catalogo"` e o texto `promo.ctaLabel` + `ArrowRightIcon` (o nome acessível inclui o título: `aria-label={promo.ctaLabel + ': ' + promo.title}`).
3. O `search` de `promoToSearch` tem **as 9 chaves** (valores ou `undefined`), como pede a regra do `validateSearch`.
4. `PromoCardSkeleton`: mesma caixa 586×250 (colunas 287 + 1fr) com `Skeleton`s; `role="status"` + sr-only "Carregando promoção…".
5. Fechamento: `npx prettier --write` nos 2 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/shared/PromoCard.tsx src/components/shared/PromoCardSkeleton.tsx` e `git commit -m "06-048: PromoCard"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; sem cor hexadecimal, `oklch()` ou `rgb()`.
- [ ] "Lançamentos gênesis…" leva a `/?aba=novos#catalogo`; "Arte digital selecionada…" a `/?colecao=arte-digital#catalogo`.
- [ ] 586×250 px, imagem 287 px; o texto do 2º cartão não passa para cima da imagem.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Probe **não commitado** com os 2 promos do seed; comparado com a captura; axe. Coberto no 06-061.

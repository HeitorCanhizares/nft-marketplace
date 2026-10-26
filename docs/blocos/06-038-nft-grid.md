# 06-038 — `NftGrid`

**Status:** pendente
**Fluxo / subitem:** Início › 3 (grade 3 colunas no desktop; 2 colunas desalinhadas no mobile) e 12 (carregando, grade anterior esmaecida)
**Depende de:** 06-035, 06-037

## Objetivo
Criar a grade de cards: 3 colunas no desktop, 2 colunas desalinhadas no mobile, com o modo de carregamento (skeletons) e o modo "ocupado" (grade anterior esmaecida).

## Arquivos
- criar: `src/components/shared/NftGrid.tsx`

## Referências
- docs/design/componentes.md (`NftGrid`) e docs/fluxos/inicio.md (subitens 3, 11 e 12: "a grade anterior continua visível, esmaecida, `aria-busy`")
- Capturas 1:1. **Desktop:** coluna do catálogo com 842 px de largura (x 478–1319); 3 cartões de 258 px com **34 px** entre colunas; passo entre linhas ≈ 424 px (428 e 422 medidos) = bloco 300 + texto ≈ 60 + **64 px** de espaço. **Mobile:** 2 colunas de 175 px (x 24–199 e 215–390), **16 px** entre colunas; a coluna da direita começa **32 px** mais abaixo (375 vs 343); passo ≈ 268 px (200 + texto 44 + 24)

## Instruções
1. Props: `items?: NftSummary[]` (indefinido = carregando), `loadingCount?: number` (padrão 9; no mobile o chamador passa 6), `busy?: boolean`, `updatedIds?: ReadonlySet<string>`, `pendingFavoriteIds?: ReadonlySet<string>`, `pendingCartIds?: ReadonlySet<string>`, `onAddToCart`, `onToggleFavorite`, `className?`, `ref?: Ref<HTMLUListElement>` (para o 06-053 achar os cards).
2. Lista semântica: `<ul role="list">` com `<li>` por card. Classes: `grid grid-cols-2 gap-x-4 gap-y-6 pb-8 [&>li:nth-child(even)]:translate-y-8 lg:grid-cols-3 lg:gap-x-8.5 lg:gap-y-16 lg:pb-0 lg:[&>li:nth-child(even)]:translate-y-0` (o deslocamento de 32 px é só visual e só no mobile; o `pb-8` guarda o espaço dele; a ordem do DOM = a ordem de leitura).
3. Carregando (`items` indefinido): `loadingCount` × `NftCardSkeleton` e um `<span className="sr-only" role="status">Carregando NFTs…</span>` **fora** da lista (um só `status`).
4. `busy` (trocou o filtro, dados anteriores na tela): `aria-busy="true"` na lista e `opacity-60 transition-opacity motion-reduce:transition-none`; os cards continuam clicáveis.
5. Cada card: `NftCard` com `updated={updatedIds?.has(id)}`, `favoriteBusy`, `cartBusy`.
6. Fechamento: `npx prettier --write src/components/shared/NftGrid.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/shared/NftGrid.tsx` e `git commit -m "06-038: NftGrid"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; sem cor hexadecimal, `oklch()` ou `rgb()`.
- [ ] Desktop: 3 colunas, 34 px entre elas, passo de linha ≈ 424 px. Mobile: 2 colunas, a da direita 32 px mais baixa, 16 px entre elas.
- [ ] O esqueleto tem a mesma altura do card real (sem pulo de layout ao chegar o dado).
- [ ] Sem rolagem horizontal em 320 px (o `translate-y` não gera rolagem horizontal).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Probe **não commitado** com 9 itens reais do seed, carregando e ocupado, em 1440×900, 414×896 e 320×700; medidas conferidas com as capturas.

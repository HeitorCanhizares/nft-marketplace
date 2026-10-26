# 06-043 — `FilterPanel`

**Status:** concluído
**Fluxo / subitem:** Início › 6 (barra lateral de filtros; "Limpar filtros" sempre disponível quando houver filtro ativo)
**Depende de:** 06-041, 06-042, 06-003
**Depende de decisão:** pergunta 3 do relatório da fase 06

## Objetivo
Montar o painel de filtros (Coleções, Faixa de preço, Rede e "Limpar filtros"), usado como barra lateral no desktop e dentro do drawer no mobile.

## Arquivos
- criar: `src/components/shared/FilterPanel.tsx`

## Referências
- docs/design/componentes.md (`FilterPanel`) e docs/fluxos/inicio.md (subitem 6)
- Captura 1:1 `desktop-inicio.png`: painel `bg-card`, **310 px** de largura (x 120–429), altura 785 px (y 647–1431) com 20 px de recuo lateral; posições dos centros: "Coleções" y 675, opções a cada 40 px a partir de 716, "Faixa de preço" y 1103, slider 1133, texto 1166, botão 1188–1224, "Rede" y 1272, opções 1312/1352/1392

## Instruções
1. Props: `facets?: CatalogFacets` (indefinido = carregando), `collection?: string`, `network?: Network`, `priceMin?: number`, `priceMax?: number`, `onCollectionChange: (id?: string) => void`, `onNetworkChange: (id?: Network) => void`, `onPriceApply: (range: { min?: number; max?: number }) => void`, `onClear: () => void`, `hasActiveFilters: boolean`, `variant?: 'sidebar' | 'sheet'` (padrão `sidebar`), `className?`.
2. **`sidebar`:** `<aside aria-label="Filtros">` (`complementary`) `bg-card px-5 py-7`, grupos separados por `gap-8`; **`sheet`:** `<div>` sem fundo nem recuo (o drawer cuida disso), sem `aside`.
3. Ordem: `FilterOptionList legend="Coleções"` (opções de `facets.collections`), `PriceRangeFilter` (`bounds={facets.priceRange}`, `value={{ min: priceMin, max: priceMax }}`, `key` = `JSON.stringify([facets.priceRange, priceMin, priceMax])`, título "Faixa de preço"), `FilterOptionList legend="Rede"` (`facets.networks`). O valor ativo do grupo = `collection`/`network`; `onChange` de Rede converte o `id` para `Network`.
4. **Carregando** (`facets` indefinido): o painel com `Skeleton` no lugar das listas (mesma altura aproximada), um `role="status"` sr-only "Carregando filtros…".
5. **"Limpar filtros"** (`Button variant="link"`, no fim do painel, só no `sidebar` e só com `hasActiveFilters`): chama `onClear`. No `sheet` o botão fica no rodapé do drawer (06-044).
6. Fechamento: `npx prettier --write src/components/shared/FilterPanel.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/shared/FilterPanel.tsx` e `git commit -m "06-043: FilterPanel"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; sem cor hexadecimal.
- [ ] Desktop: painel de 310 px, posições dos títulos e das opções conferidas com a captura (tolerância de 4 px).
- [ ] Escolher uma coleção ou rede chama o callback **na hora**; o preço só no "Aplicar".
- [ ] "Limpar filtros" só aparece com filtro ativo.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Probe **não commitado** com as `facets` do seed, nas duas variantes; comparado com a captura; axe.

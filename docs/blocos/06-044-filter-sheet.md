# 06-044 — `FilterSheet` (drawer de filtros no mobile)

**Status:** concluído
**Fluxo / subitem:** Início › 6 e 5 (mobile: `Sheet` aberto pelo botão de filtros, com os mesmos grupos, a ordenação, "Limpar filtros" e "Ver N resultados")
**Depende de:** 06-040, 06-043, 01-009
**Depende de decisão:** pergunta 10 do relatório da fase 06 (o drawer **não foi desenhado**: forma e textos propostos)

## Objetivo
Criar o botão de filtros da barra mobile e o drawer que abre por ele.

## Arquivos
- criar: `src/components/shared/FilterSheet.tsx`

## Referências
- docs/fluxos/inicio.md (subitens 5 e 6) e docs/design/componentes.md (`FilterPanel`: "Mobile: dentro de um Sheet aberto pelo botão de filtro, junto com a ordenação")
- Captura 1:1 `mobile-inicio.png`: botão de filtros **45×45 px** (x 345–390, y 40–84), raio 12, fundo `bg-gradient-primary`, ícone claro de duas linhas com círculos (usar `Settings2Icon` do lucide, 24 px, `text-foreground`)
- `src/components/ui/sheet.tsx` (`Sheet`, `SheetTrigger`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription`, `SheetFooter`), `FilterPanel` (`variant="sheet"`), `SortSelect` (`variant="field"`)

## Instruções
1. Props: as do `FilterPanel` (menos `variant`) **mais** `sort: CatalogSort`, `onSortChange`, `total?: number` (resultados atuais), `activeCount: number` (nº de filtros ativos, só para o rótulo), `className?`.
2. Gatilho: `SheetTrigger asChild` + `Button` `size-11.25 rounded-mobile bg-gradient-primary text-foreground` com `Settings2Icon`; `aria-label` = `"Filtros"` ou `"Filtros, N ativos"`.
3. Conteúdo: `SheetContent side="bottom"` com `max-h-[85dvh]` e rolagem interna (`overflow-y-auto`), `SheetTitle` "Filtros" e `SheetDescription` sr-only ("Filtre e ordene os NFTs. As escolhas valem na hora."); corpo: `SortSelect variant="field"` e `FilterPanel variant="sheet"`; rodapé (`SheetFooter`, fixo, `border-t`): `Button variant="outline"` "Limpar filtros" (`aria-disabled` sem filtro ativo; **não** fecha o drawer) e `Button` "Ver N resultados" (`SheetClose asChild`; textos: `Ver 1 resultado`, `Ver N resultados`, `Nenhum resultado` quando 0 ou indefinido: "Ver resultados").
4. **As escolhas valem na hora** (o fundo da página atualiza com o drawer aberto); o drawer só fecha pelo "Ver N resultados", pelo X, por Esc ou clicando fora. Foco: Radix (primeiro foco no título/primeiro controle; volta ao botão ao fechar).
5. Fechamento: `npx prettier --write src/components/shared/FilterSheet.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/shared/FilterSheet.tsx` e `git commit -m "06-044: FilterSheet"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; sem cor hexadecimal, `oklch()` ou `rgb()`.
- [ ] O botão mede 45×45 px e fica como na captura; o drawer abre de baixo, rola por dentro e **não** gera rolagem horizontal em 320 px.
- [ ] Esc fecha e o foco volta ao botão de filtros; `Tab` não escapa do drawer.
- [ ] "Ver N resultados" mostra o total atual e fecha.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Probe **não commitado** em 414×896 e 320×700 com o drawer aberto; axe com o drawer aberto.

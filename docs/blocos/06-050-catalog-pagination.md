# 06-050 — `CatalogPagination` (paginação numérica do desktop)

**Status:** concluído
**Fluxo / subitem:** Início › 3 (desktop: paginação numérica ligada a `?pagina=`)
**Depende de:** 01-012
**Depende de decisão:** pergunta 14 do relatório da fase 06 (botões de 40 px do primitivo)

## Objetivo
Criar a função que monta a lista de páginas a mostrar e o componente de paginação do catálogo, com links reais (`?pagina=`).

## Arquivos
- criar: `src/lib/pagination.ts`
- criar: `src/components/shared/CatalogPagination.tsx`

## Referências
- docs/fluxos/inicio.md (subitem 3) e `src/components/ui/pagination.tsx` (`Pagination`, `PaginationContent`, `PaginationItem`, `PaginationLink`, `PaginationPrevious`, `PaginationNext`, `PaginationEllipsis`; botões de 40 px **aceitos** pelo usuário na fase 01)
- Captura 1:1 `desktop-inicio.png`: "1 2 3 4 >" alinhado à **direita** da coluna (termina em x 1319), y 1985–2019, ativa preenchida `primary`, as outras com borda; no Figma, a seta "anterior" não existe na página 1

## Instruções
1. `lib/pagination.ts`: `buildPageItems(current: number, total: number): (number | 'ellipsis')[]`: até 7 páginas → todas; senão sempre a 1 e a última, a atual com 1 vizinha de cada lado e `'ellipsis'` nos intervalos (ex.: página 1 de 32 → `1 2 3 4 … 32`; página 16 → `1 … 15 16 17 … 32`; página 32 → `1 … 29 30 31 32`). Entradas inválidas (`total < 1`) → `[]`. Pura.
2. `CatalogPagination` — props: `page: number`, `totalPages: number`, `getHref: (page: number) => string`, `onPageChange: (page: number) => void`, `className?`. Não renderiza nada com `totalPages <= 1`.
3. `Pagination` (`aria-label="Paginação do catálogo"`, `justify-end`): "Anterior" (`PaginationPrevious`) só com `page > 1`, os números e `PaginationEllipsis`, "Próxima" só com `page < totalPages`. Cada link é um `<a href={getHref(n)}>` cujo clique, **sem modificadores** (Ctrl, Cmd, Shift, botão do meio), chama `event.preventDefault()` e `onPageChange(n)`. A atual: `aria-current="page"` e `isActive`. `aria-label="Página N"` nos números, "Página anterior" e "Próxima página" nas setas.
4. Fechamento: `npx prettier --write` nos 2 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/lib/pagination.ts src/components/shared/CatalogPagination.tsx` e `git commit -m "06-050: CatalogPagination"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; sem cor hexadecimal.
- [ ] `buildPageItems(1, 32)` → `[1,2,3,4,'ellipsis',32]`; `buildPageItems(16, 32)` → `[1,'ellipsis',15,16,17,'ellipsis',32]`; `buildPageItems(3, 5)` → `[1,2,3,4,5]`.
- [ ] Ctrl+clique num número abre o link em outra aba (o `href` é real); clique simples não recarrega a página.
- [ ] Alinhada à direita; contraste e foco visíveis.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Probe **não commitado** com 32 páginas; comparado com a captura; axe. Coberto no 06-061.

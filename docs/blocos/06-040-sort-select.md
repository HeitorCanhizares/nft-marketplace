# 06-040 — `SortSelect`

**Status:** concluído
**Fluxo / subitem:** Início › 5 (ordenação "Ordenar por:" com 5 opções)
**Depende de:** 01-006, 06-004

## Objetivo
Criar o seletor de ordenação do catálogo: em linha no desktop ("Ordenar por: Listados recentemente ⌄") e como campo com rótulo dentro do drawer de filtros no mobile.

## Arquivos
- criar: `src/components/shared/SortSelect.tsx`

## Referências
- docs/design/componentes.md (`SortSelect`) e docs/fluxos/inicio.md (subitem 5: "No mobile (não desenhado), a ordenação fica dentro do drawer de filtros")
- `src/components/ui/select.tsx` (`Select`, `SelectTrigger`, `SelectContent`, `SelectItem`; a seta é o SVG `arrow-down`), `src/lib/catalogOptions.ts` (`CATALOG_SORTS`)
- Captura 1:1 `desktop-inicio.png`: texto de 15 px, "Ordenar por:" colado ao valor "Listados recentemente" (33 caracteres em ≈ 298 px), seta à direita, sem borda nem fundo, alinhado à direita da coluna (termina em x 1319), y 651–665. **No Figma o texto e a seta se sobrepõem** (a seta cobre o "e" final): corrigir com espaço entre o valor e a seta

## Instruções
1. Props: `value: CatalogSort`, `onValueChange: (value: CatalogSort) => void`, `variant?: 'inline' | 'field'` (padrão `inline`), `className?`.
2. **`inline`:** `Select` com `SelectTrigger` `h-auto w-auto gap-2 border-0 bg-transparent px-0 text-body` cujo conteúdo é `<span className="text-foreground">Ordenar por:</span>` + `SelectValue` (o nome acessível vira "Ordenar por: Listados recentemente"); `SelectContent position="popper" align="end"`.
3. **`field`:** um `Label` visível "Ordenar por" acima de um `SelectTrigger` de largura total (estilo padrão do primitivo, 50 px no mobile) com o `SelectValue`; `id`/`htmlFor` por `useId`.
4. Itens: `CATALOG_SORTS` (rótulo e valor). A seleção é aplicada na hora (`onValueChange`).
5. Fechamento: `npx prettier --write src/components/shared/SortSelect.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/shared/SortSelect.tsx` e `git commit -m "06-040: SortSelect"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; sem cor hexadecimal.
- [ ] Teclado: Enter/Espaço/setas abrem, setas navegam, Enter escolhe, Esc fecha e o foco volta ao gatilho (Radix).
- [ ] `inline` não tem sobreposição entre texto e seta; `field` tem `label` associado.
- [ ] As 5 opções com os rótulos do contrato.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Probe **não commitado** nas duas variantes; comparado com a captura; axe.

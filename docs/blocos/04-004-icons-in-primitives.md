# 04-004 — Trocar os ícones do lucide pelos do Figma nos primitivos

**Status:** pendente
**Fluxo / subitem:** Fase 04 › Ícones
**Depende de:** 04-003

## Objetivo
Substituir, nos primitivos que já existem, o `XIcon` (Dialog e Sheet) e a seta do Select pelos SVGs do Figma (`x` e `arrow-down`).

## Arquivos
- alterar: `src/components/ui/dialog.tsx`, `src/components/ui/sheet.tsx`, `src/components/ui/select.tsx`

## Referências
- docs/design/tokens.md#ícones
- Capturas: desktop-perfil.png (seta do `.eth`), desktop-login.png (fechar do modal)

## Instruções
1. `dialog.tsx` e `sheet.tsx`: remover `XIcon` do import de `lucide-react` e usar `<SvgIcon name="x" />` (import de `@/assets/icons/SvgIcon`). O botão já tem `text-primary`, então a cor do X do Figma (`primary`) vem sozinha. Manter `aria-label="Fechar"` e o resto das classes.
2. `select.tsx`: no `SelectTrigger`, trocar o `ChevronDownIcon` por `<SvgIcon name="arrow-down" className="pointer-events-none text-foreground" />` (no Figma a seta é `foreground`; hoje é `muted-foreground`). Manter dentro do `SelectPrimitive.Icon asChild`.
3. **Não** trocar `CheckIcon`, `ChevronUpIcon` e `ChevronDownIcon` dos botões de rolagem do `SelectContent`, nem os ícones do Pagination, Carousel, Dropdown e Breadcrumb: não fazem parte dos 6 ícones do Figma.
4. Corrigir imports que ficaram sem uso (o lint acusa).
5. Fechamento: `npx prettier --write` nos 3 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/ui/dialog.tsx src/components/ui/sheet.tsx src/components/ui/select.tsx` e `git commit -m "04-004: ícones do Figma no Dialog, Sheet e Select"`.

## Critérios de aceite
- [ ] `grep -n "XIcon" src/components/ui/dialog.tsx src/components/ui/sheet.tsx` sem resultado.
- [ ] A seta do Select continua dentro do `SelectPrimitive.Icon` e o clique no ícone abre o Select.
- [ ] Foco visível do botão de fechar e `aria-label="Fechar"` preservados.
- [ ] Sem cor hexadecimal, `oklch()` ou `rgb()`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Probe **não commitado** com Dialog, Sheet e Select abertos; captura do X (primary, 18 px) e da seta (foreground) comparada com `desktop-login.png` e `desktop-perfil.png`.
- Tab até o X e Esc: o comportamento do Radix não mudou.

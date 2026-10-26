# 04-016 — ComingSoon (item desabilitado com dica "Em breve")

**Status:** concluído
**Fluxo / subitem:** Fase 04 › Itens desabilitados
**Depende de:** 03-020

## Objetivo
Um único jeito de mostrar itens sem tela (Criadores, Aprenda, botão central da barra mobile, itens do menu do perfil, newsletter, redes sociais): visíveis, desabilitados e com a dica "Em breve" acessível por foco.

## Arquivos
- criar: `src/components/shared/ComingSoon.tsx`

## Referências
- docs/qualidade/acessibilidade.md#itens-desabilitados (`aria-disabled="true"`, sem ação, dica "Em breve" por foco; **não usar `disabled` em links**)
- docs/decisoes.md (Design: itens sem tela ficam visíveis e desabilitados)
- `src/components/ui/tooltip.tsx`

## Instruções
1. Props: `children: ReactNode`, `label?: string` (padrão `'Em breve'`), `className?: string` e o resto de `React.ComponentProps<'button'>` (exceto `type`, `disabled`, `onClick`).
2. Renderiza `Tooltip` → `TooltipTrigger asChild` → `<button type="button" aria-disabled="true" …>` com `{children}` e `<span className="sr-only"> (em breve)</span>` ao fim, e `TooltipContent` com o `label`.
   - `onClick` sempre `preventDefault()` (sem ação).
   - Classes base: `cursor-not-allowed opacity-50`, mais `className`. **Não** usar o primitivo `Button` (ele aplica `pointer-events-none` em `aria-disabled`, o que impede o tooltip no hover).
   - O botão **recebe foco por Tab** (o tooltip abre no foco).
3. O `TooltipProvider` fica no `AppShell` (04-030); este componente não o cria.
4. Fechamento: `npx prettier --write src/components/shared/ComingSoon.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/shared/ComingSoon.tsx` e `git commit -m "04-016: ComingSoon"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; export nomeado `ComingSoon`.
- [ ] `aria-disabled="true"`, **sem** atributo `disabled`; clique não faz nada.
- [ ] Tab foca o item e o tooltip "Em breve" aparece; hover também mostra.
- [ ] Sem cor hexadecimal, `oklch()` ou `rgb()`.
- [ ] Nome acessível inclui "(em breve)".

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Probe **não commitado** dentro de um `TooltipProvider`: Tab, hover, clique, leitor de acessibilidade (`getByRole('button', { name: /em breve/i })`).

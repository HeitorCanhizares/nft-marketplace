# 07-007 — `EditionSelector`, `QuantityStepper` e `RatingStars`

**Status:** concluído
**Fluxo / subitem:** Detalhes › 3, 4, 7 (edição, quantidade, nota)
**Depende de:** 06-068

## Objetivo
Três componentes de apresentação, sem dados nem hooks de API.

## Arquivos
- criar: `src/components/shared/EditionSelector.tsx`
- criar: `src/components/shared/QuantityStepper.tsx`
- criar: `src/components/shared/RatingStars.tsx`

## Referências
- docs/design/componentes.md (`EditionSelector`, `QuantityStepper`, `RatingStars`); telas desktop e mobile de detalhes (1:1)
- `src/components/ui/radio-group.tsx` (importar `RadioGroup as RadioGroupPrimitive` de `radix-ui`), `src/components/ui/button.tsx`, `cn` de `@/lib/utils`
- Estados do Radix: `data-[state=checked]`, nunca `data-checked:`; sem cor literal fora dos tokens

## Instruções
1. `EditionSelector({ editions, value, onChange, className })`: `RadioGroup` (ui) com `aria-label="Edição"`, `orientation="horizontal"`; cada pílula é `RadioGroupPrimitive.Item` (sem `Indicator`) com o `label` da edição; selecionada com borda `primary`. `available === 0`: `disabled` e o texto visível "Esgotado" dentro da pílula (não só cor). Pílulas com área de toque ≥ 44 px no mobile.
2. `QuantityStepper({ value, min = 1, max, onChange, hint, size = 'md', label = 'Quantidade', className })`: botões "Diminuir quantidade" e "Aumentar quantidade" (ícones lucide `MinusIcon`/`PlusIcon`, círculos como no Figma) e o número no meio (`<output>` com `aria-label={label}`). "−" desabilitado em `min`; "+" desabilitado em `max` (e os dois se `max < min`). `hint` (texto) aparece abaixo, com `id` ligado ao "+" por `aria-describedby`. Só inteiros; `size 'sm'` para a `BuyBar`.
3. `RatingStars({ average, count, variant = 'stars', onClick, className })`: `stars` = 5 estrelas (preenchidas = `Math.round(average)`) com `aria-hidden` + texto "N avaliações de colecionadores" ("1 avaliação…"); `pill` = "★ 4.8 (19)" (`average.toFixed(1)`). Com `onClick` e `count > 0`, o conjunto inteiro é um `<button>` com `aria-label="Ver N avaliações de colecionadores, nota 4.8 de 5"`; sem avaliações mostra "Sem avaliações" sem botão.
4. Fechamento: prettier nos 3; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `07-007: seletor de edição, stepper e nota`.

## Critérios de aceite
- [ ] Sem `any`; sem `useEffect`; teclado: setas movem a seleção do grupo; Space/Enter ativam os botões.
- [ ] Acessibilidade: edição esgotada tem texto "Esgotado"; botões têm nome; foco visível.
- [ ] Sem cor hexadecimal fora dos tokens.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Visual no 07-016.

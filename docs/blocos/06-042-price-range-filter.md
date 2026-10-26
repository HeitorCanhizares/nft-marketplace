# 06-042 — `PriceRangeFilter` (faixa de preço com "Aplicar")

**Status:** pendente
**Fluxo / subitem:** Início › 6 (Faixa de preço: slider de dois cursores; só aplica no botão "Aplicar")
**Depende de:** 01-011, 01-004
**Depende de decisão:** perguntas 3 e 9 do relatório da fase 06 (limites estáveis; vírgula no rótulo como no Figma)

## Objetivo
Criar o filtro de faixa de preço: um `Slider` com dois cursores, o texto "Preço: 0,02 - 12,30 ETH" e o botão "Aplicar".

## Arquivos
- criar: `src/components/shared/PriceRangeFilter.tsx`

## Referências
- docs/fluxos/inicio.md (subitem 6) e `src/components/ui/slider.tsx` (`Slider` com `thumbLabels`)
- Captura 1:1 `desktop-inicio.png` (painel x 120–429): título "Faixa de preço" 18 px negrito; trilho em x 153–410, na altura 1133, cursores de 18 px (com o anel); texto "Preço: 0,02 - 12,30 ETH" 15 px `foreground` 33 px abaixo do trilho; botão **"Aplicar" 92×36 px** (x 152–244), 22 px abaixo do texto, `primary`, raio pequeno, 16 px negrito
- Os limites vêm de `facets.priceRange` como **string**. O `Slider` só aceita `number`: a conversão `Number(...)` é **só para o controle** (o front não faz conta de negócio com preço)

## Instruções
1. Props: `bounds: { min: string; max: string }`, `value?: { min?: number; max?: number }` (a faixa **aplicada**, vinda da URL), `onApply: (range: { min?: number; max?: number }) => void`, `className?`.
2. Estado local `draft: [number, number]`, iniciado por `value` (ou pelos `bounds`). **Quem usa passa `key` com `bounds` e `value`**: o rascunho reinicia quando a faixa aplicada ou os limites mudam (sem `useEffect` que copia props para estado).
3. `Slider` (`min`/`max` = `Number(bounds…)`, `step={0.01}`, `value={draft}`, `onValueChange`, `thumbLabels={['Preço mínimo', 'Preço máximo']}`, `minStepsBetweenThumbs={0}`); desabilitado quando `bounds.min === bounds.max`.
4. Texto: `Preço: {fmt(min)} - {fmt(max)} ETH`, com `fmt(n) = n.toFixed(2).replace('.', ',')`, em `<p aria-live="off">`; `id` ligado ao `aria-describedby` do slider.
5. Botão "Aplicar" (`Button` `type="button"`, `h-9 px-3 text-base`): `aria-disabled` quando o rascunho é igual ao aplicado (nada a aplicar). Ao clicar: `onApply({ min, max })`, **omitindo** o lado que coincide com o limite (`min === bounds.min` → `undefined`; `max === bounds.max` → `undefined`).
6. Fechamento: `npx prettier --write src/components/shared/PriceRangeFilter.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/shared/PriceRangeFilter.tsx` e `git commit -m "06-042: PriceRangeFilter"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; sem cor hexadecimal.
- [ ] Mexer nos cursores **não** chama `onApply`; só o botão chama.
- [ ] Teclado: cada cursor responde às setas (Radix), com nomes "Preço mínimo" e "Preço máximo"; o botão é alcançável por Tab.
- [ ] "Aplicar" mede 92×36 px (tolerância de 2 px); o trilho ocupa a largura do painel menos o recuo.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Probe **não commitado** com os limites do seed; comparado com a captura; axe.

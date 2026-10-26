# 06-033 — `PriceTag` (preço em ETH com preço anterior riscado)

**Status:** pendente
**Fluxo / subitem:** Início › 8 (preço e preço riscado no card)
**Depende de:** 06-004
**Depende de decisão:** pergunta 9 do relatório da fase 06 (ponto decimal como no Figma)

## Objetivo
Criar o componente que mostra o preço de um NFT e, quando houver, o preço anterior riscado.

## Arquivos
- criar: `src/components/shared/PriceTag.tsx`

## Referências
- docs/design/componentes.md (`PriceTag`: "valor em ETH; opcionalmente preço anterior riscado") e docs/qualidade/acessibilidade.md ("`aria-label="1,19 ETH"` quando o número estiver estilizado em partes"; preço riscado com contraste sobre `surface`)
- Capturas 1:1: `desktop-inicio.png` ("1.99 ETH" **18 px** negrito `price` + "2.29 ETH" 18 px regular `tan` riscado, 13 px depois; "1.19 ETH" 8 caracteres em 86 px = 18 px) e `mobile-inicio.png` ("1.19 ETH" negrito 16 px, 8 caracteres em 76 px)
- `src/lib/formatEth.ts` (`formatEth`, `formatEthSpoken`)

## Instruções
1. Props: `price: string`, `previousPrice?: string`, `className?`.
2. Estrutura: `<p>` flex com `gap-x-3` e `flex-wrap`; o preço atual em `<span>` `font-bold text-price` com o texto de `formatEth(price)` (**ponto**, como no Figma); `text-base lg:text-lg`.
3. Com `previousPrice`: `<s>` com o texto de `formatEth(previousPrice)`, `font-normal text-tan` (mesmo tamanho) e, antes dele, `<span className="sr-only">preço anterior </span>`. O preço atual ganha `<span className="sr-only">preço atual </span>` antes do valor.
4. Quando o valor vier em partes, o `aria-label` do `<p>` **não** é necessário: o texto já é lido inteiro; só use `formatEthSpoken` se algum dia o número for dividido em elementos.
5. Sem cor hexadecimal. Export nomeado.
6. Fechamento: `npx prettier --write src/components/shared/PriceTag.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/shared/PriceTag.tsx` e `git commit -m "06-033: PriceTag"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; "1.99 ETH" + "2.29 ETH" riscado como na captura.
- [ ] O texto riscado tem contraste ≥ 4,5:1 sobre `card` (se `tan` não alcançar, **parar e relatar** em vez de trocar a cor).
- [ ] Quebra de linha sem estourar o card em 320 px.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Probe **não commitado** com e sem preço anterior; axe sem violações.

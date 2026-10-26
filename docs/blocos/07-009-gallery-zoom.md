# 07-009 — `NftGallery` e zoom em tela cheia

**Status:** concluído
**Fluxo / subitem:** Detalhes › 1 (galeria, swipe, zoom)
**Depende de:** 06-068

## Objetivo
Galeria com miniaturas (desktop) ou swipe (mobile) e imagem ampliada num `Dialog`.

## Arquivos
- criar: `src/components/shared/ImageZoomDialog.tsx`
- criar: `src/components/shared/NftGallery.tsx`

## Referências
- docs/fluxos/detalhes-nft.md (subitem 1); telas desktop e mobile de detalhes (1:1)
- `src/components/ui/dialog.tsx`, `src/components/ui/carousel.tsx` (`Carousel`, `CarouselContent`, `CarouselItem`, `CarouselDots`, `setApi`), `src/hooks/useMediaQuery.ts` (`useIsDesktop`)

## Instruções
1. `ImageZoomDialog({ images, index, onIndexChange, open, onOpenChange, name })`: `Dialog` com título `sr-only` "Imagem ampliada de <name>" (e descrição `sr-only`), imagem `object-contain` até ~90dvh, botões "Imagem anterior" / "Próxima imagem" (desabilitados nas pontas), texto "Imagem 2 de 4" em região `aria-live="polite"`. Teclas ← → trocam a imagem; Esc fecha e o Radix devolve o foco ao gatilho (não mexer nisso).
2. `NftGallery({ images, name, className })`, com `useState` do índice. **Desktop** (`useIsDesktop()`): coluna de miniaturas (botões `aria-label="Imagem 2 de 4"`, `aria-current` na ativa, 4 como no Figma), imagem principal em cartão `bg-card` e botão de lupa "Ampliar imagem" no canto (abre o zoom no índice atual). **Mobile:** `Carousel` (swipe do embla) com uma imagem por slide, arredondada como no Figma, e `CarouselDots` discretos; o toque na imagem (botão "Ampliar imagem N de M") abre o zoom; o índice acompanha o slide por `setApi` + evento `select`.
3. Com 1 imagem: sem miniaturas nem indicadores. Renderizar só a variante da largura atual (nada duplicado no DOM). `loading="lazy"` só nas imagens que não são a principal.
4. Fechamento: prettier nos 2; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `07-009: galeria e zoom`.

## Critérios de aceite
- [ ] Sem `any`; sem `useEffect` que copia state; ouvintes do embla removidos ao desmontar.
- [ ] Acessibilidade: foco preso no diálogo; Esc devolve o foco à lupa/imagem; miniaturas e setas por teclado.
- [ ] Sem cor hexadecimal fora dos tokens.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Visual e fluxo no 07-016.

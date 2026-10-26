# 06-046 — `HeroBanner` (desktop e mobile)

**Status:** pendente
**Fluxo / subitem:** Início › 1 (hero automático com pausa; indicadores; "EXPLORAR" rola ao catálogo)
**Depende de:** 06-031, 06-001, 01-013, 01-004
**Depende de decisão:** pergunta 7 do relatório da fase 06 (textos fixos; 3 imagens; botão de pausa)

## Objetivo
Criar o hero da Início, com as duas variantes do Figma, o carrossel de imagens com rotação automática pausável e o esqueleto.

## Arquivos
- criar: `src/components/shared/HeroBanner.tsx`
- criar: `src/components/shared/HeroBannerSkeleton.tsx`

## Referências
- docs/fluxos/inicio.md (subitem 1) e docs/design/componentes.md (`HeroBanner`: "variante desktop e mobile... carrossel automático com botão de pausar/retomar") e docs/qualidade/acessibilidade.md
- `src/components/ui/carousel.tsx` (`Carousel`, `CarouselContent`, `CarouselItem`, `CarouselDots`; `setApi`; o primitivo já põe `role="region"`/`aria-roledescription="carousel"` e `role="group"`/`slide`), `src/hooks/useCarouselAutoplay.ts`
- Capturas 1:1 e a tabela abaixo

## Medidas lidas nas capturas
| Item | Desktop (1440) | Mobile (414) |
|---|---|---|
| Área do hero | 1200×450 (y 101–550), sem fundo | card 365×190 (x 24–389, y 101–290), raio 24 (`rounded-panel`), fundo `bg-gradient-primary` a **55 %** de opacidade, com 2 círculos translúcidos decorativos (`bg-foreground/5`) |
| Texto | coluna em x 160 (recuo 40), largura máx. ≈ 544 | coluna em x 40 (recuo 16), largura ≈ 188 |
| "Bem-vindo à Kurio" | 16 px, `foreground`, topo em y 146 | 12 px, topo ≈ 109 |
| Título (`h2`) | 43 px (`text-display`) **negrito**, altura de linha 70 px, 2 linhas, 32 px abaixo do "Bem-vindo" | 18 px (`text-lg`) negrito, altura de linha 29 px |
| Texto | 14 px, altura de linha 24, `muted-foreground`, 28 px abaixo do título | 12 px, altura de linha 18 |
| "EXPLORAR" | `Button` **140×40**, texto 16 px negrito, 39 px abaixo do texto | texto 12 px negrito `primary` + `ArrowRightIcon` 18 px, sem fundo |
| Imagem | 450×450 à direita (x 870–1319), raio 24 | grande 138×139 (x 236–374, y 111–250) e pequena 58×59 (x 250–308, y 199–258) **sobreposta** ao canto inferior esquerdo, ambas raio 12 |
| Indicadores | 3 bolinhas de 8 px, 8 px de espaço, y 500–507, centradas em x 740 (centro de 160–1320) | bolinhas ≈ 6 px, 7 px de espaço, y ≈ 282, centradas no card |

## Instruções
1. `HeroBanner` — props: `slides: NftSummary[]`, `variant: 'desktop' | 'mobile'`, `onExplore: () => void`, `className?`. **Textos fixos** (copiar exatamente): desktop: "Bem-vindo à Kurio", título "SEJA DONO DO FUTURO DA ARTE DIGITAL", texto "Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet."; mobile: "Bem-vindo à Kurio", "SEJA DONO DA CULTURA DIGITAL", "Descubra NFTs selecionados de criadores do mundo todo."; botão "EXPLORAR".
2. Estrutura: `<section aria-label="Destaques">`; o texto (`p`, `h2`, `p`, botão) **fora** do carrossel; o `Carousel` (`opts={{ loop: true }}`, `setApi`) só com as imagens: cada `CarouselItem` leva `aria-label={'Destaque ' + (i + 1) + ' de ' + total}` e a `<img>` (`alt` = `slide.image.alt`; o primeiro com `loading="eager"` e `fetchpriority="high"`). **Mobile:** o slide `i` mostra `slides[i]` grande e `slides[(i + 1) % total]` pequena (par sobreposto; a pequena é decorativa, `alt=""`).
3. Rotação: `useCarouselAutoplay(api)` (6 s); `containerProps` no `<section>`. Região do carrossel com `aria-live="off"` enquanto `running` e `"polite"` quando parada (padrão WAI).
4. Controles: `CarouselDots` (o ativo preenchido, os outros só com borda: o estado **não** depende só de cor) e, ao lado direito das bolinhas, um botão de **pausar/retomar** (24×24, `PauseIcon`/`PlayIcon` de 14 px, `aria-label` "Pausar rotação dos destaques" / "Retomar rotação dos destaques", `aria-pressed`); **escondido** com `prefers-reduced-motion` (não há rotação para pausar). Desktop: linha de controles em `absolute bottom-12 left-10 right-0 grid grid-cols-[1fr_auto_1fr]` (bolinhas na coluna do meio, centradas em x 740; botão na 3ª coluna, `ml-3`); mobile: centrada, `bottom-2.5`.
5. Swipe no mobile é do Embla (arrastar). "EXPLORAR" chama `onExplore`.
6. `HeroBannerSkeleton({ variant, className })`: mesma caixa (450 px de altura no desktop; 190 px e raio `rounded-panel` no mobile) com `Skeleton`s no lugar do texto, do botão e da imagem; `role="status"` e texto sr-only "Carregando destaques…". Sem deslocamento de layout ao carregar.
7. Sem cor hexadecimal. Fechamento: `npx prettier --write` nos 2 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/shared/HeroBanner.tsx src/components/shared/HeroBannerSkeleton.tsx` e `git commit -m "06-046: HeroBanner"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; sem cor hexadecimal, `oklch()` ou `rgb()`.
- [ ] Medidas das duas variantes conferidas com as capturas (tolerância de 4 px); texto e título exatamente como acima.
- [ ] Só há **um** título no hero e ele é `h2` (o `h1` da página é da 06-057); o texto do hero não está dentro do carrossel.
- [ ] Rotação a cada 6 s; para com hover, foco, botão e `prefers-reduced-motion`; as bolinhas e o botão são alcançáveis por Tab; as bolinhas têm `aria-label`.
- [ ] O esqueleto tem a mesma altura do hero (sem pulo).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Probe **não commitado** com os 3 NFTs do hero, nas duas variantes e em 320×700; comparado com as capturas; axe. Coberto no 06-060.

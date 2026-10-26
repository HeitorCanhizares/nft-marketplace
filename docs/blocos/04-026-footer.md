# 04-026 — Footer (composição)

**Status:** concluído
**Fluxo / subitem:** Fase 04 › Layout (Footer, parte 4)
**Depende de:** 04-023, 04-024, 04-025

## Objetivo
Montar o rodapé completo do desktop: destaques e newsletter, faixa de contato, colunas de links, redes sociais, carteiras compatíveis e copyright.

## Arquivos
- criar: `src/components/layout/Footer.tsx`

## Referências
- docs/design/componentes.md (`Footer`: IN, DE, CA, PG d)
- Capturas: desktop-carrinho.png (rodapé: painel em `y` 1120–1694 e copyright em `y` ≈ 1715, página com 1754 de altura), desktop-inicio.png, desktop-detalhes.png

## Medidas lidas nas capturas (painel de 1200 px, `x` 120–1320)
| Elemento | Valor |
|---|---|
| Painel | fundo `card`, 574 px de altura (`y` 1120–1694) |
| Faixa de destaques | 250 px (`FooterHighlights`, 04-023) |
| Faixa de contato | 88 px (`y` 1370–1458), fundo `surface-3` (`#38220f`), padding lateral de 32 px |
| Colunas da faixa de contato e dos links | começam em `x` 152 / 455 / 758 / 1060 → grade `grid-cols-[303fr_303fr_302fr_227fr]` com `px-8` |
| Faixa de contato: conteúdo | "KURIO" (14 px, bold, `foreground`, mesmo estilo do logo do cabeçalho); "Feito para colecionadores, criadores e cultura" (14 px, 2 linhas, `foreground`); "contato@email.com"; "+55 11 4002 8922" (14 px) |
| Faixa de links | padding de 24 px em cima e ≈ 36 px embaixo; 3 `FooterLinkColumn` + 4ª coluna com "Redes sociais" (`SocialLinks`) e "Carteiras compatíveis" (`WalletBadges`), 24 px entre os dois blocos |
| Copyright | "© 2026 Kurio. Propriedade digital para todos." (14 px, `foreground`), centralizado, fora do painel, 12 px abaixo dele e 28 px acima do fim da página |
| Espaço acima do painel | ≈ 80 px entre o fim do conteúdo (indicadores do carrossel) e o topo do painel: `mt-20` no rodapé |

## Instruções
1. `Footer({ className })`: `footer` (landmark `contentinfo`) com `mt-20`; dentro, `div.container-page` com o painel `bg-card`, depois o `<p>` do copyright (`pt-3 pb-7 text-center text-sm`). `className` é aplicado no `footer` (o `AppShell` passa `max-lg:hidden`).
2. Painel: `FooterHighlights`; faixa de contato (`bg-surface-3`); faixa de links com `FOOTER_COLUMNS.map` → `FooterLinkColumn` e a 4ª coluna (`h2` "Redes sociais" + `SocialLinks`; `h2` "Carteiras compatíveis" + `WalletBadges`).
3. Contato: `contato@email.com` como `<a href="mailto:contato@email.com">` e o telefone como `<a href="tel:+551140028922">` (são dados do Figma, sem tela própria; `foreground`, hover `primary`).
4. O ano "2026" é o do Figma e fica **fixo no texto** (não calcular pela data).
5. Fechamento: `npx prettier --write src/components/layout/Footer.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/layout/Footer.tsx` e `git commit -m "04-026: Footer"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; export nomeado `Footer`.
- [ ] Um `contentinfo`; títulos em `h2`; sem `h1`.
- [ ] Nenhuma rolagem horizontal entre 1024 e 1440 px.
- [ ] Textos do Figma idênticos (acentos incluídos).
- [ ] Sem cor hexadecimal, `oklch()` ou `rgb()`.
- [ ] Contraste do texto `muted-foreground` sobre `card` ≥ 4.5:1 (conferir com o teste de contraste do 01-021, acrescentando o par se faltar).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Probe **não commitado** em 1440×900 e 1024×768; captura do rodapé sobreposta a `desktop-carrinho.png` (altura do painel 574 px, faixas e colunas com tolerância de 2 px); axe sem violações graves.

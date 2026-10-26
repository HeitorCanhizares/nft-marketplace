# 04-019 — MobileTopBar

**Status:** concluído
**Fluxo / subitem:** Fase 04 › Layout (mobile)
**Depende de:** 04-010

## Objetivo
Criar a barra superior do mobile: botão de voltar circular e título centralizado (Carrinho, Pagamento e telas adaptadas).

## Arquivos
- criar: `src/components/layout/MobileTopBar.tsx`

## Referências
- docs/design/componentes.md (`MobileTopBar`: CA, PG m e telas adaptadas)
- Capturas (414 px, medidas em pixels): mobile-carrinho.png e mobile-pagamento.png

## Medidas lidas nas capturas
| Elemento | Valor |
|---|---|
| Botão voltar | círculo de 36 px, `x` 28–63, `y` 32–68; fundo `muted` (`#2f1d15`); borda de 1 px `border`; chevron `<` em `tan` |
| Título | centralizado na largura da tela, `y` 42–56 (centro ≈ 49 px, alinhado ao botão); **20 px** (`text-xl`, não está na escala 9–43 do projeto; é o tamanho padrão do Tailwind, sem token novo), bold, `foreground` |
| Margem lateral | 28 px |
| Espaço acima | 32 px até o topo do botão; o primeiro conteúdo começa a 20 px abaixo do botão |

## Instruções
1. Props: `title: string`, `backTo?: LinkProps` (volta para uma rota fixa, ex.: o menu do perfil), `fallbackTo?: LinkProps` (padrão `{ to: '/' }`, usado quando não há histórico), `action?: ReactNode` (slot à direita; ocupa o mesmo espaço do botão para manter o título centralizado), `className?`.
2. Estrutura: `header` com `grid grid-cols-[36px_1fr_36px] items-center px-7 pt-8 pb-5 lg:hidden` (somar `env(safe-area-inset-top)` ao `pt-8`). O título é um **`<h1>`** (no mobile ele é o título da página; o desktop tem o `<h1>` da própria página e esta barra fica oculta).
3. Botão voltar: com `backTo`, `Button asChild` + `Link`; sem `backTo`, `Button` que faz `router.history.back()` quando `router.history.canGoBack()` for verdadeiro e `navigate(fallbackTo)` caso contrário (quem abriu `/carrinho` direto pela URL não pode "voltar" para fora do site). `variant="icon"` com `className="size-9 rounded-full border-border text-tan"`; `aria-label="Voltar"`; ícone `ChevronLeftIcon` do lucide.
4. Não fixar no topo (rola junto com a página, como no Figma).
5. Fechamento: `npx prettier --write src/components/layout/MobileTopBar.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/layout/MobileTopBar.tsx` e `git commit -m "04-019: MobileTopBar"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; export nomeado `MobileTopBar`.
- [ ] Botão com 36 px (área de toque ≥ 24 px, WCAG 2.2) e `aria-label="Voltar"`; foco visível.
- [ ] O título está no centro da tela mesmo com `action` ausente.
- [ ] Título longo quebra linha sem empurrar o botão.
- [ ] Oculto a partir de 1024 px; sem cor hexadecimal, `oklch()` ou `rgb()`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Probe **não commitado** em 414×896; captura sobreposta a `mobile-carrinho.png` e `mobile-pagamento.png` (tolerância de 2 px). Testar `backTo`, voltar com histórico e voltar sem histórico (abrir a rota direto).

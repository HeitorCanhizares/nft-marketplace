# 04-027 — MobileTabBar

**Status:** pendente (**formato do recorte e rotas com a barra: perguntas 4 e 8 do relatório da fase 04**)
**Fluxo / subitem:** Fase 04 › Layout (mobile)
**Depende de:** 04-003, 04-010, 04-016

## Objetivo
Criar a barra de abas inferior do mobile: Início, Favoritos, botão central (desabilitado), Carrinho e Perfil.

## Arquivos
- criar: `src/components/layout/MobileTabBar.tsx`

## Referências
- docs/design/componentes.md (`MobileTabBar`: IN m) e docs/decisoes.md (A4: Favoritos abre `/?favoritos=1`; botão central desabilitado)
- docs/fluxos/login.md (subitem 8: a aba Perfil leva a `/perfil`)
- Capturas (414 px): mobile-inicio.png (barra e botão central)

## Medidas lidas na captura (414 × 896)
| Elemento | Valor |
|---|---|
| Barra | do topo em `y` 801 até a borda inferior (≈ 95 px de altura: `h-24`, mais `env(safe-area-inset-bottom)`); largura total; fundo `card` (`#241612`); cantos superiores arredondados de ≈ 40 px (os cantos inferiores arredondados da captura são da moldura do dispositivo, não do app) |
| Botão central | círculo de 64 px, gradiente `bg-gradient-primary`, centrado na largura e **com o centro sobre a borda superior da barra** (metade para fora); ícone de scan (`ScanLineIcon`, lucide, 28 px) em `foreground` |
| Recorte atrás do botão | a barra tem um recorte circular de raio ≈ 52 px centrado na borda superior, por onde se vê o conteúdo da página (proposto: `mask-image: radial-gradient(circle 52px at 50% 0, transparent 99%, #000 100%)`; os cantos arredondados do recorte do Figma ficam de fora, ver pergunta 8) |
| Ícones | 24 px; ativo: `price` (`#e89b55`); inativos: `muted-foreground` (`#cfb28c`); centros a `x` ≈ 46, 118 (esquerda) e 302, 364 (direita) e `y` ≈ 851; no código: dois grupos `justify-around` de cada lado do botão (tolerância de 12 px) |
| Início e Favoritos | ícones cheios: `HouseIcon` e `HeartIcon` com `fill-current` |
| Carrinho e Perfil | `SvgIcon name="shop"` e `SvgIcon name="user"` (20 px, do Figma) |

## Instruções
1. Props: `cartCount?: number` (só entra no `aria-label`; o Figma não desenha contador na barra, ver pergunta 9), `className?`. O `AppShell` passa `lg:hidden`.
2. `nav aria-label="Navegação principal"`, `fixed inset-x-0 bottom-0 z-40`, com o recorte acima. Itens (cada um `Link` com `aria-label` e texto `sr-only`, alvo de toque ≥ 44 px):
   - **Início** → `/`, ativo quando `pathname === '/'` e **sem** `favoritos` na URL;
   - **Favoritos** → `/` com `search={{ favoritos: 1 }}`, ativo quando `favoritos === 1` na URL na Início;
   - **botão central** → `ComingSoon` (04-016) com o gradiente e 64 px; o conteúdo é o ícone e o texto `sr-only` "Ação central" (o `ComingSoon` já acrescenta "(em breve)" e a dica "Em breve"); sem navegação;
   - **Carrinho** → `/carrinho`, ativo em `/carrinho`; `aria-label`: `Carrinho` / `Carrinho, N itens`;
   - **Perfil** → `/perfil`, ativo em qualquer `/perfil/*` (visitante: a proteção de rota da fase 05 leva a `/entrar?redirect=/perfil`).
   Ativo = cor `price` + `aria-current="page"` + um ponto de 4 px em `price` abaixo do ícone (o Figma só muda a cor; o ponto é o complemento para não depender só de cor, regra de acessibilidade do projeto).
3. Pathname e search por `useLocation`; sem estado próprio.
4. Reservar espaço para a barra: exportar a constante `MOBILE_TAB_BAR_HEIGHT = 96` (px), usada pelo `AppShell` para o `padding-bottom` do conteúdo e pelo `Toaster`.
5. Fechamento: `npx prettier --write src/components/layout/MobileTabBar.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/layout/MobileTabBar.tsx` e `git commit -m "04-027: MobileTabBar"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; export nomeado `MobileTabBar`.
- [ ] Landmark `navigation` com 5 itens focáveis; o central é `aria-disabled` com "Em breve" no foco.
- [ ] Item ativo com `aria-current="page"`, cor e ponto; exatamente um ativo por vez.
- [ ] Respeita a área segura inferior (`env(safe-area-inset-bottom)`).
- [ ] Oculta a partir de 1024 px; sem cor hexadecimal, `oklch()` ou `rgb()`.
- [ ] Alvos de toque ≥ 44 × 44 px.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Probe **não commitado** em 414×896 sobre uma lista longa; captura sobreposta a `mobile-inicio.png` (barra, botão central e ícones, tolerância de 12 px nos ícones e 2 px na barra); trocar de aba e conferir o ativo; 1024 px: a barra some.

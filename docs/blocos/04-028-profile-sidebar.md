# 04-028 — ProfileSidebar

**Status:** pendente
**Fluxo / subitem:** Fase 04 › Layout (Perfil e Carteiras, desktop)
**Depende de:** 04-016, 04-017, 04-009

## Objetivo
Criar o menu lateral "Meu perfil" do desktop, com item ativo, itens desabilitados e "Sair".

## Arquivos
- criar: `src/components/layout/ProfileSidebar.tsx`

## Referências
- docs/design/componentes.md (`ProfileSidebar`: só os dois primeiros itens e "Sair" habilitados) e docs/fluxos/perfil.md (subitem 1)
- Capturas: desktop-perfil.png e desktop-carteiras.png (1440 px)
- `src/components/layout/profileMenuItems.ts` (04-017)

## Medidas lidas na captura (1440 px)
| Elemento | Valor |
|---|---|
| Painel | `x` 120–430 (**310 px**), fundo `card`, topo em `y` 101, altura ≈ 407 px |
| Título "Meu perfil" | 18 px (`text-lg`) bold, `foreground`, `x` 131 (`pl-2.5`), `y` 120–137; o primeiro item começa em `y` 145 (bloco do título com 44 px) |
| Itens | 45 px de altura, passo de 45 px; ícone de 20 px a 16 px da borda esquerda (`pl-4`), rótulo 12 px depois (`gap-3`); texto de 15 px (`text-body`) em `price` (`#e89b55`) |
| Ícones | ativo em `primary`; os outros em `tan` (`#b39463`) |
| Item ativo | barra vertical de **6 px**, `primary`, na borda esquerda e na altura toda do item (45 px) |
| Separador antes de "Sair" | 1 px `border-soft` (`#55321f`) em `y` 459 |
| "Sair" | bold, `price`, ícone `LogOutIcon` em `primary`; item de 45 px |

## Instruções
1. Props: `onSignOut: () => void`, `className?`. O `ProfileLayout` (04-029) passa `onSignOut`.
2. `aside` (landmark `complementary`) com `aria-label="Menu do perfil"` → `nav aria-label="Meu perfil"` com `h2` "Meu perfil" e `ul` dos `PROFILE_MENU_ITEMS`, depois o separador e o item "Sair" (`button type="button"`, chama `onSignOut`).
3. Itens com `to`: `Link` com `aria-current="page"` quando o `pathname` começa com o `to` (`useLocation`); item ativo ganha a barra de 6 px (elemento `span aria-hidden` absoluto) e o ícone em `primary`. Itens `disabled`: `ComingSoon` (04-016) com o mesmo visual de linha (opacidade do `ComingSoon`).
4. Foco visível em todos os itens (anel `ring`, sem `outline: none`).
5. Fechamento: `npx prettier --write src/components/layout/ProfileSidebar.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/layout/ProfileSidebar.tsx` e `git commit -m "04-028: ProfileSidebar"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; export nomeado `ProfileSidebar`.
- [ ] Item ativo: cor + barra + `aria-current="page"`; em `/perfil/carteiras` o ativo é "Carteiras".
- [ ] 5 itens `aria-disabled` com "Em breve"; "Sair" é botão e chama `onSignOut`.
- [ ] Ordem de Tab = ordem visual.
- [ ] Sem cor hexadecimal, `oklch()` ou `rgb()`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Probe **não commitado** em `/perfil/dados` e `/perfil/carteiras`; captura sobreposta ao painel de `desktop-perfil.png` (largura 310 px, passo de 45 px, barra de 6 px; tolerância de 2 px).

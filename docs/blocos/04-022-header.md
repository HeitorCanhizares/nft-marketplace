# 04-022 — Header (desktop)

**Status:** pendente (**ícones da lupa e do carrinho aguardam a pergunta 2; busca aberta, a 7**)
**Fluxo / subitem:** Fase 04 › Layout
**Depende de:** 04-005, 04-016, 04-017, 04-020, 04-021

## Objetivo
Montar o cabeçalho do desktop: logo, menu de navegação, busca, carrinho com contador e "Entrar" ou o `UserMenu`.

## Arquivos
- criar: `src/components/layout/Header.tsx`

## Referências
- docs/design/componentes.md (`Header`), docs/decisoes.md (A3, A5; Fluxo Login: cabeçalho logado)
- docs/fluxos/login.md (subitem 8: sem piscar o botão "Entrar" durante a recuperação da sessão)
- Capturas: desktop-inicio.png, desktop-carrinho.png, desktop-perfil.png (topo, 1440 px)

## Medidas lidas nas capturas (1440 px, container de 1200 px: `x` 120–1320)
| Elemento | Valor |
|---|---|
| Altura | 68 px de conteúdo + linha inferior de 1 px `border-strong` (`#432b1a`): `h-17` + `border-b` |
| Logo "KURIO" | `x` 120, texto de 14 px (`text-sm`), bold, `foreground`, com espaçamento entre letras ≈ 1 px (`tracking-widest` é um pouco largo; ajustar para `tracking-[0.07em]`); centro vertical ≈ 41 px |
| Itens do menu | 15 px (`text-body`), `foreground`; item ativo em `price` (`#e89b55`), bold; 40 px entre itens; centro vertical ≈ 35 px |
| Sublinhado do item ativo | 3 px, `primary`, largura do texto, colado na linha inferior do cabeçalho (cobre a linha: `-bottom-px`) |
| Lupa | 22 px, `foreground`; centro `x` ≈ 1123 |
| Carrinho | 22 px, `foreground`; centro `x` ≈ 1173; contador: círculo de 16 px, `primary`, número de 9 px (`Badge variant="count"`, `text-tiny`), no canto superior direito do ícone |
| "Entrar" | `x` 1220–1320, `y` 24–59 (altura de 36 px: `h-9`), `Button` `default`, ícone `LogInIcon` de 16 px + texto bold |
| Espaço entre ícones | centros a ≈ 50 px (botões de 32 px com `gap-4.5`); "Entrar" começa ≈ 31 px depois do carrinho |

## Instruções
1. Props: `authStatus: 'loading' | 'authenticated' | 'anonymous'`, `user: User | null`, `cartCount: number`, `onSignOut: () => void`, `onSearch: (query: string) => void`, `searchQuery?: string`, `className?`. O `AppShell` (04-030) liga tudo; o `Header` **não** lê `AuthContext` nem a query do carrinho.
2. Estrutura: `header` (`border-b border-border-strong`) → `div.container-page` com `grid h-17 grid-cols-[1fr_auto_1fr] items-center`. Aplicar `className` no `header` (o `AppShell` passa `max-lg:hidden`).
3. **Logo:** `Link to="/"` com texto "KURIO" e `aria-label="Kurio, página inicial"`.
4. **Menu:** `nav aria-label="Navegação principal"` → `ul` com os `NAV_ITEMS` (04-017). Itens com `to`: `Link` (com `hash` quando houver) e `aria-current="page"` quando `isActive(pathname)` (pathname por `useLocation`). Itens `disabled`: `ComingSoon` (04-016). Centralizado no container (no Figma ele está 24 px à esquerda do centro; decisão: centralizar).
5. **Busca aberta:** `searchOpen` (estado local, alimentado pelo `onOpenChange` do `SearchInput`). Enquanto aberta, o `nav` recebe `invisible` (sai da ordem de Tab e da árvore de acessibilidade) para o campo expandido não cobrir os links.
6. **Ações (à direita):** `SearchInput` (04-020); link do carrinho `Link to="/carrinho"` com `ShoppingCartIcon` (lucide, 22 px) e, se `cartCount > 0`, `Badge variant="count"` com o número (`99+` acima de 99) e `aria-hidden="true"`. O link tem `aria-label`: `Carrinho` (sem itens), `Carrinho, 1 item`, `Carrinho, N itens`.
7. **Sessão:** `loading` → um `Skeleton` de 100×36 px no lugar do botão (sem piscar "Entrar"); `anonymous` → `Button asChild` + `Link to="/entrar"` com `search={{ redirect: href atual }}` (omitir `redirect` quando o pathname já for `/entrar` ou `/cadastro`), `LogInIcon` e "Entrar"; `authenticated` → `UserMenu` (04-021).
8. Sem textos fixos em inglês; sem cor literal.
9. Fechamento: `npx prettier --write src/components/layout/Header.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/layout/Header.tsx` e `git commit -m "04-022: Header"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; export nomeado `Header`.
- [ ] Landmark `banner` com `nav` "Navegação principal"; Tab percorre logo → menu → busca → carrinho → Entrar/menu do usuário, na ordem visual.
- [ ] Criadores e Aprenda: `aria-disabled="true"`, tooltip "Em breve" no foco, sem navegação.
- [ ] Item ativo: cor + sublinhado + `aria-current="page"`; no Perfil nenhum item ativo.
- [ ] Contador some com `cartCount = 0`; com 6 mostra "6"; o nome acessível do link traz o total.
- [ ] Abrir a busca não desloca nada do cabeçalho.
- [ ] Sem cor hexadecimal, `oklch()` ou `rgb()`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Probe **não commitado** (anônimo, logado, carregando, contador 0/6/120; busca aberta). Capturas em 1440×900 sobrepostas a `desktop-inicio.png`, `desktop-carrinho.png` e `desktop-perfil.png` (tolerância de 2 px nas posições da tabela acima) e em 1024×768 (sem sobreposição nem rolagem horizontal).

# 04-021 — UserMenu

**Status:** concluído
**Fluxo / subitem:** Fase 04 › Header (menu do usuário logado)
**Depende de:** 04-003, 04-010

## Objetivo
Criar o menu do usuário logado do cabeçalho: avatar (ou inicial) + nome, com "Dados do perfil", "Carteiras" e "Sair".

## Arquivos
- criar: `src/components/layout/UserMenu.tsx`

## Referências
- docs/fluxos/login.md (subitem 8) e docs/design/componentes.md (`UserMenu`: não desenhado)
- docs/qualidade/acessibilidade.md (menu por teclado, foco volta ao gatilho)
- Capturas: desktop-perfil.png (o botão "Entrar" ocupa o lugar do menu: `x` 1220–1320, `y` 24–59, raio ≈ 4 px)
- `src/components/ui/dropdown-menu.tsx`, `avatar.tsx`, `button.tsx`

## Instruções
1. Props: `user: Pick<User, 'displayName' | 'avatarUrl'>` (`User` de `@/types/user`), `onSignOut: () => void`, `className?`.
2. Gatilho: `DropdownMenuTrigger asChild` + `Button variant="outline"` com altura de 36 px (`h-9`), `gap-2 px-2`, largura máxima de 200 px:
   - `Avatar` (`size="sm"`, 24 px) com `AvatarImage` (`alt=""`: decorativo, o nome está ao lado) e `AvatarFallback` com a **inicial** do `displayName` em maiúscula (primeira letra, `Array.from` para não quebrar acento);
   - nome com `truncate text-sm`;
   - `SvgIcon name="arrow-down"` (`text-foreground`).
   - `aria-label={`Menu de ${displayName}`}` (o nome visível pode estar truncado).
3. Conteúdo (`DropdownMenuContent align="end"`), cada item com ícone lucide de 16 px e `Link` do TanStack Router via `asChild`:
   - **Dados do perfil** → `/perfil/dados` (`UserIcon`);
   - **Carteiras** → `/perfil/carteiras` (`MapPinIcon`);
   - separador;
   - **Sair** → chama `onSignOut` (`LogOutIcon`), **não** é link.
4. Sem lógica de sessão aqui: tudo por props. Esc fecha e devolve o foco ao gatilho (Radix).
5. Fechamento: `npx prettier --write src/components/layout/UserMenu.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/layout/UserMenu.tsx` e `git commit -m "04-021: UserMenu"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; export nomeado `UserMenu`.
- [ ] Abre por Enter/Espaço/seta para baixo; setas navegam; Esc fecha e o foco volta ao botão.
- [ ] Nome com 40 caracteres não passa de 200 px nem quebra o cabeçalho; o `aria-label` tem o nome completo.
- [ ] Sem `avatarUrl` aparece a inicial; imagem quebrada cai na inicial.
- [ ] Sem cor hexadecimal, `oklch()` ou `rgb()`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Probe **não commitado**: menu fechado e aberto, com e sem avatar, nome longo; captura em 1440×900 ao lado de `desktop-perfil.png` (altura e posição do gatilho = as do botão "Entrar").

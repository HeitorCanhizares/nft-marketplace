# 06-036 — `NftCardActions` (ações do card)

**Status:** concluído
**Fluxo / subitem:** Início › 8 (ações no hover **e no foco** no desktop; coração fixo no mobile; "Esgotado")
**Depende de:** 06-034
**Depende de decisão:** perguntas 14 e 15 do relatório da fase 06 (ícones; mobile só com o coração)

## Objetivo
Criar a camada de ações que fica sobre a imagem do card: barra de 3 botões (carrinho, favoritar, ver) no desktop e o coração no canto no mobile.

## Arquivos
- criar: `src/components/shared/NftCardActions.tsx`

## Referências
- docs/fluxos/inicio.md (subitem 8) e docs/qualidade/acessibilidade.md ("as ações do hover também aparecem no foco (`:focus-within`), não só no mouse")
- Capturas 1:1: `desktop-login.png` (fundo, card em hover: 3 botões **35×35 px**, gap **10 px**, centralizados na borda inferior da imagem, a barra começa 17 px acima do fim da imagem e termina 18 px abaixo; ícones carrinho, coração e lupa) e `mobile-inicio.png` (coração no canto)
- `src/components/shared/FavoriteButton.tsx`; o card pai (06-037) é `group` e `relative`

## Instruções
1. Props: `nftId: string`, `name: string`, `isFavorite: boolean`, `soldOut: boolean`, `onAddToCart: () => void`, `onToggleFavorite: () => void`, `favoriteBusy?: boolean`, `cartBusy?: boolean`, `className?`. O link "ver" usa o `Link` do roteador com `to="/nft/$nftId"` e `params={{ nftId }}`.
2. **Desktop (`max-lg:hidden`):** `div` `absolute inset-x-0 bottom-1.75 z-10 flex justify-center gap-2.5` (a barra termina 7 px acima do fim do bloco do card, ou seja, fica centrada na borda inferior da imagem), **invisível** (`opacity-0`) e **visível** em `group-hover:opacity-100 group-focus-within:opacity-100`, com `transition-opacity motion-reduce:transition-none`. Botões `size-8.75 rounded-lg border border-border bg-card text-foreground` (`ShoppingCartIcon`, `FavoriteButton variant="square"`, `SearchIcon` de 20 px dentro de um `Link` com a mesma aparência):
   - carrinho: `button type="button"` `aria-label={'Adicionar ' + name + ' ao carrinho'}`, `aria-busy={cartBusy || undefined}`; **esgotado:** vira um botão **de texto** "Esgotado" (`w-auto px-3 text-caption`, `aria-disabled="true"`, sem `onClick`);
   - ver: `Link` `aria-label={'Ver ' + name}`.
3. **Mobile (`lg:hidden`):** só `FavoriteButton variant="circle"` em `absolute top-3 right-2.5 z-10`, **sempre visível**.
4. Os botões ficam acima do link esticado do card (`z-10` + `relative`); o clique neles **não** navega (o link esticado do 06-037 usa `::after` abaixo). Não duplicar o `aria-label` do coração entre desktop e mobile na árvore de acessibilidade: o que está em `display: none` não entra (já é o caso).
5. Fechamento: `npx prettier --write src/components/shared/NftCardActions.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/shared/NftCardActions.tsx` e `git commit -m "06-036: NftCardActions"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; sem cor hexadecimal.
- [ ] Desktop: tabulando até um botão da barra, ela fica visível (foco); sem mouse nem foco ela não aparece.
- [ ] Esgotado: o texto "Esgotado" aparece e o botão não dispara nada.
- [ ] Mobile: só o coração, no canto, sempre visível.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Probe **não commitado** (hover, foco, esgotado, mobile) comparado com as capturas.

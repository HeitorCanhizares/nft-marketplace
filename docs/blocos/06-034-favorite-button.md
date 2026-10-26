# 06-034 — `FavoriteButton`

**Status:** pendente
**Fluxo / subitem:** Início › 8 (favoritar no card)
**Depende de:** 01-004
**Depende de decisão:** pergunta 14 do relatório da fase 06 (variante com texto fica para o Detalhes)

## Objetivo
Criar o botão de coração (alternável), nas duas formas que a Início usa: círculo no canto da imagem (mobile) e quadrado na barra de ações do hover (desktop).

## Arquivos
- criar: `src/components/shared/FavoriteButton.tsx`

## Referências
- docs/design/componentes.md (`FavoriteButton`: coração; "desktop com texto 'Favoritar', mobile só ícone"; a variante com texto é do Detalhes, fase 07) e docs/qualidade/acessibilidade.md ("Coração com `aria-pressed`"; botões só de ícone com `aria-label` em PT-BR)
- Capturas 1:1: `mobile-inicio.png` (círculo de **28×28 px**, fundo `secondary`, coração de linha de 16 px em `primary`, a 10 px da direita e 12 px do topo da imagem) e `desktop-login.png` (fundo: botões **35×35 px**, `bg-card`, borda `border`, raio pequeno, ícones de 20 px)

## Instruções
1. Props: `pressed: boolean`, `onToggle: () => void`, `label: string` (nome do NFT), `variant?: 'circle' | 'square'` (padrão `circle`), `busy?: boolean`, `className?`.
2. `Button` (`type="button"`, variante `icon` do 01-004 com as classes de tamanho: `circle` → `size-7 rounded-full bg-secondary text-primary`; `square` → `size-8.75 rounded-lg border border-border bg-card text-foreground`), `HeartIcon` do lucide (16 px no `circle`, 20 px no `square`), **preenchido** (`fill-current`) quando `pressed`.
3. Acessibilidade: `aria-label={'Favoritar ' + label}` **fixo** (o estado vai em `aria-pressed={pressed}`), `aria-busy={busy || undefined}`; clique com `busy` não chama `onToggle`. Alvo de toque ≥ 24 px (o `circle` de 28 px cumpre).
4. Foco visível pelo anel padrão; sem `outline: none`.
5. Fechamento: `npx prettier --write src/components/shared/FavoriteButton.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/shared/FavoriteButton.tsx` e `git commit -m "06-034: FavoriteButton"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; sem cor hexadecimal, `oklch()` ou `rgb()`.
- [ ] `aria-pressed` coerente; o coração vira cheio quando favoritado (cor + forma, não só cor).
- [ ] `circle` mede 28×28 px e `square` 35×35 px.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Probe **não commitado** nas duas variantes; medidas conferidas com as capturas; axe sem violações.

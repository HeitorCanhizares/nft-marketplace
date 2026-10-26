# 06-032 — Selos do card: `RarityBadge` e `PriceChangedNotice`

**Status:** concluído
**Fluxo / subitem:** Início › 8 (selo "RARO"; "Esgotado") e 11 (selo "Atualizado")
**Depende de:** 01-017, 06-001

## Objetivo
Criar os selos do card: "RARO", "Atualizado" (preço mudou em tempo real) e "Esgotado".

## Arquivos
- criar: `src/components/shared/RarityBadge.tsx`
- criar: `src/components/shared/PriceChangedNotice.tsx`

## Referências
- docs/design/componentes.md (`RarityBadge`, `PriceChangedNotice`) e docs/qualidade/acessibilidade.md ("Esgotado / indisponível: texto, não só cinza"; tempo real destacado "com texto, não só cor")
- Capturas 1:1: `mobile-inicio.png` (RARO: x 24–92, y 628–659 → **68×31 px**, `primary` liso, texto escuro em negrito, sem raio, colado na borda esquerda do card, 17 px abaixo do topo) e `desktop-login.png` (fundo: RARO 80×29 px, mesmo estilo)
- `src/components/ui/badge.tsx` (variante `default`: `h-5 px-2`, borda `primary`, sem raio)

## Instruções
1. `RarityBadge({ className })`: `Badge` (variante `default`) com o texto **"RARO"**, `h-7.5 min-w-17 px-3 text-caption-md lg:min-w-20`, sem raio. O posicionamento (`absolute`, `left-0`, `top-4`) vem do chamador.
2. `PriceChangedNotice({ kind, className })`, `kind: 'updated' | 'sold-out'`:
   - `updated`: `Badge` `outline` com o ícone `RefreshCwIcon` (12 px, `aria-hidden`) e o texto **"Atualizado"**, `text-caption`;
   - `sold-out`: `Badge` `outline` com a cor `text-destructive` e a borda `border-destructive`, texto **"Esgotado"** (sem ícone).
   - `role` nenhum e **sem** `aria-live` (o anúncio é do `LiveAnnouncerContext`).
3. Só `className` e tokens (`text-primary`, `text-destructive`, `bg-primary`). Exports nomeados.
4. Fechamento: `npx prettier --write` nos 2 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/shared/RarityBadge.tsx src/components/shared/PriceChangedNotice.tsx` e `git commit -m "06-032: selos do card"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; sem cor hexadecimal, `oklch()` ou `rgb()`.
- [ ] Contraste do texto ≥ 4,5:1 (RARO escuro sobre `primary`; "Esgotado" em `destructive` sobre `card`).
- [ ] O estado "Esgotado" é texto, não só cor.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Probe **não commitado** em 1440×900 e 414×896; RARO conferido com a captura (68×31 no mobile).

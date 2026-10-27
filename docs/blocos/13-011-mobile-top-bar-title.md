# 13-011 — Título do `MobileTopBar` alinhado ao Figma

**Status:** concluído
**Responsável:** Haiku (medição e validação por Claude Sonnet 5.5, effort: low)
**Depende de:** —
**Toca:** `src/components/layout/MobileTopBar.tsx`
**Paralelo:** sim com 13-010 e 13-012.
**Lote:** B

## Objetivo
O título fica ~12 px à esquerda do Figma nas telas mobile que usam a barra (Carrinho, Pagamento, Perfil, Carteiras, Confirmação e outras).

## Medição
- Figma (`mobile-carrinho.png`): `minX = 125`, `maxX = 314`, `centro = 219,5 px`.
- Figma (`mobile-pagamento.png`): `minX = 89`, `maxX = 349`, `centro = 219,0 px`.
- App antes da correção: `minX = 112`/`77`, `maxX = 301`/`337`, `centro = 206,5`/`207,0 px` (exatamente 12 px à esquerda).
- Solução: `translate-x-3` (desloca o título `+12 px`, centro em `219 px`, sem estreitar a coluna `1fr`; com `pl-6` o título "Pagamento com carteira" quebrava em duas linhas).

## Instruções
1. Aplicar a correção medida em `MobileTopBar.tsx` usando só utilitários com tokens de espaçamento (nada de `px` solto fora da escala já usada no arquivo).
2. Não mudar a API do componente (`title`, `backTo`, `fallbackTo`, `action`, `className`).
3. `npx prettier --write`; `npm run format:check && npm run lint && npm run typecheck && npm run build`.

## Critérios de aceite
- [ ] O `x` do título coincide com o Figma (± 1 px) em 414 px, com e sem `action`, e títulos longos (`break-words`) continuam quebrando sem sobrepor os botões.
- [ ] Sem overflow horizontal em 320 px.

## Verificação (Sonnet)
- `npm run test:e2e -- layout cart profile wallets --project=mobile`; baselines mobile afetadas regeneradas e levadas ao usuário.

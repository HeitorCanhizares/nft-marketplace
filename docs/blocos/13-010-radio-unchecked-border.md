# 13-010 — Rádio desmarcado com contorno laranja

**Status:** pendente
**Responsável:** Haiku (o Sonnet mede antes e confirma depois)
**Depende de:** —
**Toca:** `src/components/ui/radio-group.tsx`
**Paralelo:** sim com 13-011 e 13-012 (arquivos distintos).
**Lote:** B

## Objetivo
No Figma o rádio desmarcado tem contorno **laranja**; hoje ele usa `border-border` (escuro). Componente compartilhado: Pagamento, Carteiras, Detalhes (`EditionSelector`), `SavedWalletOption` e `WalletProviderOption`.

## Medição (Sonnet, antes do Haiku)
- Ler `docs/design/telas/desktop-pagamento.png`, `mobile-pagamento.png` e `desktop-detalhes.png`: confirmar a cor do contorno do rádio desmarcado, a espessura e o tamanho (hoje `size-4`, `border`). Escrever aqui o token (`border-primary`? `border-tan`?) e conferir se o contraste do contorno contra `background`/`card` é ≥ 3:1 (`acessibilidade.md`). Se o laranja do Figma não passar de 3:1, **parar e perguntar** (acessibilidade acima do Figma é decisão do usuário).

## Instruções
1. Em `RadioGroupItem`, trocar o contorno desmarcado pelo token medido (só tokens, nada de hex). Manter `aria-checked:border-primary`, o anel de foco e o estado inválido.
2. Conferir se algum uso passa `className` que sobrescreva a borda (`grep -rn "RadioGroupItem" src`); se sim, remover a sobrescrita **só nesses usos** (cada arquivo extra conta para o limite de 3 arquivos: se passar, devolver ao Sonnet).
3. `npx prettier --write` no arquivo; `npm run format:check && npm run lint && npm run typecheck && npm run build`.

## Critérios de aceite
- [ ] Rádio desmarcado com o contorno do Figma em todos os usos; marcado continua com marcador preenchido + borda.
- [ ] Sem hex, sem `eslint-disable`, sem casts.

## Verificação (Sonnet)
- `npm run test:e2e -- checkout wallets nft-details cart --project=desktop --project=mobile`.
- **As baselines visuais de Pagamento, Carteiras e Detalhes mudam**: regenerar (`--update-snapshots`) e levar ao usuário para aprovar, lado a lado com o Figma.

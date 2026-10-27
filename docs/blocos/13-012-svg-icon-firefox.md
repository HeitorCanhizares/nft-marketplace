# 13-012 — `SvgIcon` visível no Firefox

**Status:** concluído
**Responsável:** Haiku
**Depende de:** 13-003 (diagnóstico)
**Toca:** `src/assets/icons/SvgIcon.tsx`
**Paralelo:** sim com 13-010 e 13-011.
**Lote:** B

## Objetivo
Os ícones feitos com máscara CSS (`maskImage` + `bg-current`) devem aparecer no Firefox como no Chromium e no WebKit (pendência registrada na fase 04).

## Causa
- Adicionado `maskMode: 'alpha'` em `SvgIcon.tsx` para garantir que tanto ícones com `fill="#F5F1EB"` quanto ícones com `fill` padrão (`#000`, luminância zero nos SVGs do Font Awesome) usem sempre o canal alfa da imagem em todos os motores.

## Instruções (a confirmar)
1. Corrigir na raiz (no componente ou no arquivo `.svg` afetado), **sem dependência nova** e sem trocar a técnica aprovada na fase 04 (máscara CSS pintada com `currentColor`). Se a única saída for trocar a técnica (ex.: `<svg>` inline ou `<img>`), **parar e perguntar**.
2. Manter a API (`name`, `size`, `title`) e o `aria-hidden`/`role="img"`.
3. `npx prettier --write`; `npm run format:check && npm run lint && npm run typecheck && npm run build`.

## Critérios de aceite
- [ ] Rodapé (redes sociais), `MobileTabBar` e primitivos mostram o ícone no Firefox, no Chromium e no WebKit.
- [ ] Sem regressão nas baselines do Chromium (nenhuma muda).

## Verificação (Sonnet)
- Captura do rodapé e da barra mobile no Firefox antes e depois; `npm run test:e2e -- layout --project=firefox --project=desktop --project=mobile`.

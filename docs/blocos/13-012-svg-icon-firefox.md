# 13-012 — `SvgIcon` visível no Firefox (esboço)

**Status:** pendente. **Esboço:** o Sonnet completa a causa e a mudança depois do 13-003; só então o Haiku implementa.
**Responsável:** Haiku
**Depende de:** 13-003 (diagnóstico)
**Toca:** `src/assets/icons/SvgIcon.tsx` (e, se a causa estiver nos arquivos, os `.svg` de `src/assets/icons/`)
**Paralelo:** sim com 13-010 e 13-011.
**Lote:** B

## Objetivo
Os ícones feitos com máscara CSS (`maskImage` + `bg-current`) devem aparecer no Firefox como no Chromium e no WebKit (pendência registrada na fase 04).

## Causa (preencher no 13-003)
- _A preencher._ Candidatas: SVG sem `width`/`height`/`viewBox` consistente (o Firefox não dimensiona a máscara), `mask-size: contain` com `mask-position`, valor da `url()` com espaços ou aspas, ausência de `mask-mode: alpha`.

## Instruções (a confirmar)
1. Corrigir na raiz (no componente ou no arquivo `.svg` afetado), **sem dependência nova** e sem trocar a técnica aprovada na fase 04 (máscara CSS pintada com `currentColor`). Se a única saída for trocar a técnica (ex.: `<svg>` inline ou `<img>`), **parar e perguntar**.
2. Manter a API (`name`, `size`, `title`) e o `aria-hidden`/`role="img"`.
3. `npx prettier --write`; `npm run format:check && npm run lint && npm run typecheck && npm run build`.

## Critérios de aceite
- [ ] Rodapé (redes sociais), `MobileTabBar` e primitivos mostram o ícone no Firefox, no Chromium e no WebKit.
- [ ] Sem regressão nas baselines do Chromium (nenhuma muda).

## Verificação (Sonnet)
- Captura do rodapé e da barra mobile no Firefox antes e depois; `npm run test:e2e -- layout --project=firefox --project=desktop --project=mobile`.

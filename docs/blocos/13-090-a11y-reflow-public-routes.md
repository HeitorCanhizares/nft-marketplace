# 13-090 — Reflow, zoom 200 % e diálogos nas rotas públicas e de compra

**Status:** concluído
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001, 13-010, 13-011, 13-014, 13-015
**Toca:** `tests/e2e/a11y-reflow-public.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T8
**Origem:** `acessibilidade.md` (sem overflow e sem perda com zoom), 06-066, 07-018, 08-015

Regras: 13-001.

## Instruções
1. Rotas: `/`, `/nft/emerald-ape-042`, `/carrinho` (com `seedFigmaCart`), `/entrar`, `/cadastro` e página 404.
2. Para cada rota, viewports: **320 × 640** (WCAG 1.4.10 / 400 %), **720 × 450** (zoom 200 % de 1440), **360 × 640**: `document.documentElement.scrollWidth <= window.innerWidth` e nenhum elemento focável fora da tela na horizontal.
3. Com `AuthDialog` aberto (desktop) e zoom de imagem aberto em `/nft/emerald-ape-042`: mesmo teste de overflow e rolagem interna do diálogo.

## Critérios de aceite
- [ ] Spec verde nos 4 projetos; cada rota/viewport é um `test` com nome próprio.
- [ ] Qualquer overflow vira bloco `13-1NN` (Haiku).

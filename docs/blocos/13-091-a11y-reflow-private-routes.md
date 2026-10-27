# 13-091 — Reflow, zoom 200 %, textos longos e movimento reduzido nas rotas autenticadas

**Status:** concluído
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001, 13-010, 13-011, 13-014, 13-015
**Toca:** `tests/e2e/a11y-reflow-private.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T8
**Origem:** `acessibilidade.md`, 09-016, 10-012, 11-020, 12-020

Regras: 13-001.

## Instruções
1. Rotas (logado como `users.primary`, carrinho do Figma e pedidos semeados): `/perfil` (mobile), `/perfil/dados`, `/perfil/carteiras`, `/pagamento`, `/pedido/<id confirmado>`, `/pedido/<id recusado>`.
2. Para cada rota, viewports: **320 × 640**, **720 × 450**, **360 × 640**: `document.documentElement.scrollWidth <= window.innerWidth` e nenhum elemento focável fora da tela na horizontal.
3. Com diálogos abertos (revisão do Pagamento, `OrderDialog`, diálogo de e-mail do Perfil): mesmo teste de overflow e rolagem interna.
4. Endereços `0x…` e nomes longos (`displayName` de 40 caracteres e apelido de 30) quebram ou truncam sem estourar; `prefers-reduced-motion: reduce`: hero sem autoplay, Sonner/skeleton/spinner sem animação infinita, sem rolagem suave.

## Critérios de aceite
- [ ] Spec verde nos 4 projetos; qualquer overflow vira bloco `13-1NN` (Haiku).

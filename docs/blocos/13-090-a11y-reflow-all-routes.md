# 13-090 — Reflow, zoom e movimento reduzido em todas as rotas

**Status:** pendente
**Responsável:** Sonnet
**Depende de:** 13-010, 13-011, 13-014, 13-015 (UI final), 13-001
**Toca:** `tests/e2e/a11y-reflow.spec.ts` (novo)
**Paralelo:** sim.
**Lote:** T8
**Origem:** `acessibilidade.md` (sem overflow e sem perda com zoom), 06-066, 07-018, 08-015, 09-016, 10-012, 11-020, 12-020

Regras: 13-001. Em vez de repetir "320 px e zoom 200 %" em cada fluxo, **um spec percorre todas as rotas**.

## Instruções
1. Rotas (logado como `users.primary`, carrinho do Figma e um pedido semeado): `/`, `/nft/emerald-ape-042`, `/carrinho`, `/entrar`, `/cadastro`, `/perfil` (mobile), `/perfil/dados`, `/perfil/carteiras`, `/pagamento`, `/pedido/<id confirmado>`, `/pedido/<id recusado>`, página 404.
2. Para cada rota, viewports: **320 × 640** (WCAG 1.4.10 / 400 %), **720 × 450** (zoom 200 % de 1440), **360 × 640**: `document.documentElement.scrollWidth <= window.innerWidth` e nenhum elemento focável fora da tela na horizontal. Zoom por viewport, não por CDP (funciona nos 4 projetos).
3. Com diálogos abertos nas rotas que os têm (revisão do Pagamento, `OrderDialog`, `AuthDialog`, diálogo de e-mail do Perfil): o mesmo teste de overflow e o conteúdo do diálogo rola dentro dele.
4. `prefers-reduced-motion: reduce`: hero sem autoplay, Sonner/skeleton/spinner sem animação infinita (computed `animation-name` ou `animation-iteration-count`), sem rolagem suave.
5. Endereços `0x…` e nomes longos (perfil com `displayName` de 40 caracteres e carteira com apelido de 30) quebram ou truncam sem estourar.

## Critérios de aceite
- [ ] Spec verde nos 4 projetos; cada rota/viewport é um `test` com nome próprio (falha localizável).
- [ ] Qualquer overflow vira bloco `13-1NN` (Haiku).

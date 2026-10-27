# 13-081 — Confirmação: queda do socket (`realtime-drop`), polling de 2 s e aviso de 60 s

**Status:** concluído
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001
**Toca:** `tests/e2e/order-realtime-polling-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T7
**Origem:** 12-020 (Tempo real, polling e reconexão)

Regras: 13-001.

## Casos
1. `realtime-drop`: o socket cai com o pedido pendente, o polling de 2 s assume (`GET /orders/:id` repetido até sair de `pending`, contado com `recordApi` e `page.clock`), ao reconectar há uma releitura; com o socket conectado **não** há polling.
2. `order:updated` de outro pedido é ignorado; evento perdido (socket reconectou depois do desfecho) é recuperado pela releitura.
3. `payment-slow` com `createdAt` antigo (`seedOrder`): depois de 60 s **desde a criação** aparece "Está demorando mais que o normal. Você pode sair; o pedido continua sendo processado."; some quando sai de `pending`; botão "Voltar ao início".

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.

# 13-083 — Confirmação: controle de acesso (`403`, `404`, erros, sem login e troca de usuário)

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low)
**Depende de:** 13-001
**Toca:** `tests/e2e/order-access-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T7
**Origem:** 12-020 (Acesso)

Regras: 13-001.

## Casos
1. `403` (pedido de outro usuário e `forbidden-order`): "Você não tem acesso a este pedido" + link para a Início; nenhum dado do pedido vaza (título, itens, valores).
2. `404` (id inexistente): "Pedido não encontrado" + link para a Início; `server-error:GET /orders/:id` → `ErrorState` com "Tentar novamente"; `offline`.
3. Sem login → `/entrar?redirect=/pedido/<id>` e volta ao pedido depois do login; `session-expired` na página → fluxo padrão; troca de usuário não mostra o pedido do anterior (`clearPrivateSession`).

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.

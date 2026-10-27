# 13-093 — Baselines visuais de estados não desenhados: Conta, Pagamento, Confirmação e Auth

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low) (baselines aprovadas pelo usuário)
**Depende de:** 13-010, 13-011, 13-014, 13-015, 13-016 e dos specs de borda T4–T7
**Toca:** `tests/visual/states-account-checkout.spec.ts` (novo) e a pasta de snapshots dele
**Paralelo:** sim com 13-092 (arquivos distintos).
**Lote:** T8
**Origem:** 11-020, 12-020 (baselines por estado)

Regras: 13-001; padrão de `tests/visual/*.spec.ts`. Só Chromium (`desktop` e `mobile`).

## Estados (uma captura por estado e por projeto)
1. Perfil e Carteiras: erro de validação visível, diálogo de troca de e-mail, diálogo de remover secundária.
2. Pagamento: revisão aberta, revisão com mudanças, revisão com erro, conectando, recusa de conexão.
3. Confirmação: pendente, pendente com aviso de demora, recusado, 403, 404 (o recibo confirmado já tem baseline da fase 12).
4. Login/Cadastro com erro de servidor.

## Critérios de aceite
- [ ] `npx playwright test tests/visual/states-account-checkout.spec.ts --update-snapshots` gera as baselines; segunda execução sem diferença.
- [ ] **O usuário aprova as baselines**.

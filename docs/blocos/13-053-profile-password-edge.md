# 13-053 — Perfil: troca de senha, validações e revogação de outras sessões

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low)
**Depende de:** 13-001
**Toca:** `tests/e2e/profile-password-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T4
**Origem:** 09-016 (Senha)

Regras: 13-001.

## Casos
1. Só um dos campos de senha preenchido: os outros acusam "obrigatório"; confirmação diferente; nova igual à atual (front e `422` do mock); requisitos (8+, letra, número) sem anúncio por tecla.
2. `INVALID_CURRENT_PASSWORD`: erro em "Senha atual" com foco.
3. Sucesso: encerra as **outras** sessões do usuário (a atual continua) e o login com a senha nova funciona (segundo contexto do Playwright com o token antigo recebe 401); anúncio "Senha alterada" (`polite`).

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.

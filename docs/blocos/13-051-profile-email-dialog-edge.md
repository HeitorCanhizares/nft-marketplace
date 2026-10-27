# 13-051 — Perfil: confirmação de senha na troca de e-mail

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001
**Toca:** `tests/e2e/profile-email-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T4
**Origem:** 09-016 (Troca de e-mail)

Regras: 13-001.

## Casos
1. `INVALID_CURRENT_PASSWORD`: o diálogo permanece com o erro e o formulário intacto; Esc/Cancelar fecha e limpa; campo vazio só acusa ao enviar; clique repetido em "Confirmar": uma requisição (`recordApi`).
2. `409 EMAIL_TAKEN` depois da senha certa: fecha o diálogo e mostra o erro no campo e-mail; foco no campo.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.

# 13-050 — Perfil: validação de dados, disponibilidade e conflitos 409

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001
**Toca:** `tests/e2e/profile-data-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T4
**Origem:** 09-016 (Dados e disponibilidade)

Regras: 13-001.

## Casos
1. Campo obrigatório vazio só acusa no envio; formato inválido ao sair do campo: usuário 3–20 (letras, números, `_`, `.`), e-mail, nome de exibição até 40, apelido até 30, ENS 3–63 (minúsculas, números e hífen, sufixo `.eth` único).
2. `POST /auth/availability` com falha (`server-error`): não bloqueia; `409 EMAIL_TAKEN` e `USERNAME_TAKEN` no envio (**ambos juntos**), com foco no primeiro campo; o conflito ignora o próprio valor e a caixa.
3. Limpar ENS e apelido (opcionais) grava vazio e persiste a refresh.
4. Perfil sem ENS, apelido e avatar renderiza sem lacunas.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.

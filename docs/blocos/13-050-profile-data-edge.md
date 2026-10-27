# 13-050 — Perfil: dados, disponibilidade e troca de e-mail

**Status:** pendente
**Responsável:** Sonnet
**Depende de:** 13-001
**Toca:** `tests/e2e/profile-data-edge.spec.ts` (novo)
**Paralelo:** sim.
**Lote:** T4
**Origem:** 09-016 (Dados e disponibilidade, Troca de e-mail)

Regras: 13-001.

## Dados e disponibilidade
1. Campo obrigatório vazio só acusa no envio; formato inválido ao sair do campo: usuário 3–20 (letras, números, `_`, `.`), e-mail, nome de exibição até 40, apelido até 30, ENS 3–63 (minúsculas, números e hífen, sufixo `.eth` único).
2. `POST /auth/availability` com falha (`server-error`): não bloqueia; `409 EMAIL_TAKEN` e `USERNAME_TAKEN` no envio (**ambos juntos**), com foco no primeiro campo; o conflito ignora o próprio valor e a caixa.
3. Limpar ENS e apelido (opcionais) grava vazio e persiste a refresh.
4. Perfil sem ENS, apelido e avatar renderiza sem lacunas.

## Troca de e-mail
5. `INVALID_CURRENT_PASSWORD`: o diálogo permanece com o erro e o formulário intacto; Esc/Cancelar fecha e limpa; campo vazio só acusa ao enviar; clique repetido em "Confirmar": uma requisição.
6. `409 EMAIL_TAKEN` depois da senha certa: fecha o diálogo e mostra o erro no campo e-mail; foco no campo.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`.

# 13-051 — Perfil: avatar e senha

**Status:** pendente
**Responsável:** Sonnet
**Depende de:** 13-001
**Toca:** `tests/e2e/profile-avatar-password-edge.spec.ts` (novo)
**Paralelo:** sim.
**Lote:** T4
**Origem:** 09-016 (Avatar, Senha)

Regras: 13-001. Arquivos de imagem de teste são gerados no próprio spec (`Buffer`), nada novo em `tests/`.

## Avatar
1. Arquivo fora de png/jpg/webp e acima de 2 MB: rejeitado no front (mensagem anunciada) e, por chamada direta, no mock (`422` com `fields.file`).
2. Prévia cancelada devolve o foco ao gatilho e revoga a URL (`URL.revokeObjectURL` espiado); clique repetido em "Usar esta foto" e "Remover": uma requisição.
3. 5xx/rede no envio mantém a prévia; erro ao remover mantém a foto; "Remover" desabilitado sem foto; o avatar do `UserMenu` atualiza junto.

## Senha
4. Só um dos campos de senha preenchido: os outros acusam "obrigatório"; confirmação diferente; nova igual à atual (front e `422` do mock); requisitos (8+, letra, número) sem anúncio por tecla.
5. `INVALID_CURRENT_PASSWORD`: erro em "Senha atual" com foco.
6. Sucesso: encerra as **outras** sessões do usuário (a atual continua) e o login com a senha nova funciona (segundo contexto do Playwright com o token antigo recebe 401); anúncio "Senha alterada" (`polite`).

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`.

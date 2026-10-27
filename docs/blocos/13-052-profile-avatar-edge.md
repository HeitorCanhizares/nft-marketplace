# 13-052 — Perfil: upload, prévia, remoção e erros de avatar

**Status:** concluído
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001
**Toca:** `tests/e2e/profile-avatar-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T4
**Origem:** 09-016 (Avatar)

Regras: 13-001. Arquivos de imagem de teste são gerados no próprio spec (`Buffer`), nada novo em `tests/`.

## Casos
1. Arquivo fora de png/jpg/webp e acima de 2 MB: rejeitado no front (mensagem anunciada) e, por chamada direta, no mock (`422` com `fields.file`).
2. Prévia cancelada devolve o foco ao gatilho e revoga a URL (`URL.revokeObjectURL` espiado); clique repetido em "Usar esta foto" e "Remover": uma requisição.
3. 5xx/rede no envio mantém a prévia; erro ao remover mantém a foto; "Remover" desabilitado sem foto; o avatar do `UserMenu` atualiza junto.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.

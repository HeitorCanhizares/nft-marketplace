# 13-060 — Carteiras: validação e erros da API

**Status:** pendente
**Responsável:** Sonnet
**Depende de:** 13-001
**Toca:** `tests/e2e/wallets-validation-edge.spec.ts` (novo)
**Paralelo:** sim.
**Lote:** T5
**Origem:** 10-012 (Validação, Erros da API)

Regras: 13-001.

## Validação
1. Endereço com 39 e 41 caracteres, sem `0x`, com caractere não hexadecimal; maiúsculas e minúsculas aceitas.
2. "ENS ou carteira secundária": `0x…` válido, `nome.eth` válido e valor inválido; e-mail inválido.
3. Limites: nome de exibição (40), apelido (30), nome do perfil (40), código de indicação (3–20; letras, números, `_`, `-`) e ENS (3–63).
4. Campo obrigatório vazio só acusa no envio; Rede e Tipo de carteira sem seleção; foco no primeiro campo com erro.

## Erros da API
5. `validation-error:PUT /wallets/primary` (`422` com `fields`: `address`, `ensName`, `email`): erros nos campos certos, formulário preservado, o erro some ao editar.
6. Rede/timeout/5xx: mensagem no topo do bloco com formulário preservado; `PUT` de uma carteira com erro na outra: independentes.
7. `DELETE /wallets/secondary` e `POST /wallets/swap` com `404` (secundária removida em outra página): o diálogo permanece com erro e a tela volta a refletir o servidor.
8. Clique repetido em "Salvar carteira", "Remover" e "Tornar principal": uma requisição (`recordApi`).

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`.

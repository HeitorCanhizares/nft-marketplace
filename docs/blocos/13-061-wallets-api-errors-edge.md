# 13-061 — Carteiras: erros da API (`422`, `500`, `404` em swap/delete) e clique único

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low)
**Depende de:** 13-001
**Toca:** `tests/e2e/wallets-api-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T5
**Origem:** 10-012 (Erros da API)

Regras: 13-001.

## Casos
1. `validation-error:PUT /wallets/primary` (`422` com `fields`: `address`, `ensName`, `email`): erros nos campos certos, formulário preservado, o erro some ao editar.
2. Rede/timeout/5xx: mensagem no topo do bloco com formulário preservado; `PUT` de uma carteira com erro na outra: independentes.
3. `DELETE /wallets/secondary` e `POST /wallets/swap` com `404` (secundária removida em outra página): o diálogo permanece com erro e a tela volta a refletir o servidor.
4. Clique repetido em "Salvar carteira", "Remover" e "Tornar principal": uma requisição (`recordApi`).

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.

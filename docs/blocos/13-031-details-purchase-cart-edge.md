# 13-031 — Detalhes: comprar, erros de estoque/rede e mescla

**Status:** concluído
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001
**Toca:** `tests/e2e/nft-details-purchase-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T2
**Origem:** 07-018 (Comprar e carrinho)

Regras: 13-001.

## Casos
1. `SOLD_OUT` e `QUANTITY_EXCEEDS_STOCK` (estoque alterado no mock depois de abrir a página): mensagem junto ao stepper, dados atualizados, botões liberados.
2. 5xx e erro de rede ao adicionar: toast e botões liberados; clique repetido em COMPRAR, no carrinho `[m]` e em favoritar: **uma** requisição (`recordApi`).
3. Visitante adiciona (`X-Cart-Id`) e o carrinho é mesclado no login; soma ao mesmo NFT/edição já no carrinho (quantidade acumulada, limitada ao estoque).
4. `[m]` o botão de carrinho confirma com o ícone de check por 2 s e o anúncio "Adicionado ao carrinho", sem toast.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.

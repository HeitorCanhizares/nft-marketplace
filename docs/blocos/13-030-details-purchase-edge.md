# 13-030 — Detalhes: edições, quantidade, compra e favorito

**Status:** pendente
**Responsável:** Sonnet
**Depende de:** 13-001
**Toca:** `tests/e2e/nft-details-edge.spec.ts` (novo)
**Paralelo:** sim.
**Lote:** T2
**Origem:** 07-018 (Quantidade e edição, Comprar e carrinho, Favoritar), `testes.md` (Detalhes)

Regras: 13-001. NFT principal: `emerald-ape-042` (1/1 `1.49` estoque 1; 1/10 `1.39` estoque 6; 1/50 `1.19` estoque 20; ABERTA `1.29`).

## Quantidade e edição
1. O stepper respeita estoque menos o que já está no carrinho; textos "N já no seu carrinho" e "Máximo disponível: N"; "+" desabilitado no limite; "−" em 1.
2. ABERTA: teto de 99. Edição 1/1: estoque 1.
3. Edição esgotada (`stockStore` a 0): pílula desabilitada com texto "Esgotado"; NFT todo esgotado: "COMPRAR" desabilitado.
4. Trocar de edição volta a quantidade para 1 e muda o preço; edição via teclado (setas no grupo).
5. Tudo já no carrinho: "COMPRAR" só navega a `/carrinho` (sem `POST`); botão de carrinho `[m]` desabilitado e a mensagem "Você já tem todas as unidades disponíveis no carrinho".

## Comprar e carrinho
6. `SOLD_OUT` e `QUANTITY_EXCEEDS_STOCK` (estoque alterado no mock depois de abrir a página): mensagem junto ao stepper, dados atualizados, botões liberados.
7. 5xx e erro de rede ao adicionar: toast e botões liberados; clique repetido em COMPRAR, no carrinho `[m]` e em favoritar: **uma** requisição (`recordApi`).
8. Visitante adiciona (`X-Cart-Id`) e o carrinho é mesclado no login; soma ao mesmo NFT/edição já no carrinho (quantidade acumulada, limitada ao estoque).
9. `[m]` o botão de carrinho confirma com o ícone de check por 2 s e o anúncio "Adicionado ao carrinho", sem toast.

## Favoritar
10. Deslogado: `/entrar?redirect=/nft/emerald-ape-042`; depois de **login** e de **cadastro**, volta com o NFT favoritado.
11. Erro ao favoritar desfaz e avisa; o favorito persiste a novo login e a refresh; o coração do detalhe e o da Início ficam coerentes (cache).

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`.

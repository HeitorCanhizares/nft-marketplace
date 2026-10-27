# 13-028 — Início: card (foco, esgotado, favoritar e adicionar ao carrinho)

**Status:** concluído
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001
**Toca:** `tests/e2e/home-card-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T1
**Origem:** 06-063

Regras: 13-001.

## Casos
1. Ações do hover `[d]` aparecem também com foco do teclado (`:focus-within`); o card inteiro é link (`Enter` abre `/nft/$id`); coração e carrinho são botões separados com `aria-label`. Selos: "Esgotado" (NFT sem estoque) e raridade; esgotado sem botão de carrinho ativo (texto, não só cor).
2. Favoritar logado é otimista: `aria-pressed` muda na hora; com `server-error:POST /favorites...` desfaz, avisa (`assertive`) e mantém o foco; clique repetido envia uma só requisição.
3. Favoritar deslogado: vai a `/entrar?redirect=...`; depois do **login** e do **cadastro** volta à Início já com o NFT favoritado (ação pendente).
4. `[d]` carrinho pelo card: adiciona 1 unidade da edição exibida; cliques repetidos viram uma requisição por clique ativo (botão em `aria-busy`); erro 5xx/rede mostra toast e libera o botão; `SOLD_OUT`/`QUANTITY_EXCEEDS_STOCK` mostram a mensagem; contador do cabeçalho em unidades e anúncio `polite`. Visitante adiciona ao carrinho (`X-Cart-Id`), faz login e o contador mostra o carrinho mesclado.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.

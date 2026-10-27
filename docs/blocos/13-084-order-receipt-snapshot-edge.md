# 13-084 — Confirmação: recibo imutável (snapshot), explorador, copiar txHash e NFT removido

**Status:** concluído
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001
**Toca:** `tests/e2e/order-receipt-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T7
**Origem:** 12-020 (Recibo e snapshot), decisão "NFT ou edição removidos durante a liquidação são ignorados"

Regras: 13-001.

## Casos
1. **O recibo não muda** quando o preço do NFT muda no mock (`triggerPriceChange`), a edição esgota ou o NFT é removido do `nftsStore`: itens, nomes, imagens, edições, subtotais, taxa e total ficam os do snapshot, e a página **não faz** `GET /nfts` (`recordApi`). Com cupom: "Subtotal" e "Desconto do lançamento"; sem cupom: só taxa e total.
2. Edição aberta não baixa estoque; edição limitada baixa só o comprado e emite `nft:stock_changed` (card da Início e detalhe atualizam).
3. Explorador por rede (Etherscan, Polygonscan, Solscan) — **inclui Solana**; `explorerUrl` de domínio desconhecido não mostra o botão; "Copiar ID da transação": sucesso e falha do clipboard (`context.grantPermissions` / negar), anúncio `polite`, check por 2 s; ID abreviado com o valor completo acessível; data em pt-BR no fuso do navegador (`timezoneId` fixo no teste); textos longos quebram sem sobrepor "(x N)" e o subtotal.
4. Pedido pendente cujo NFT (ou edição) deixa de existir no `nftsStore` antes do desfecho: o pedido **confirma**, o item removido é ignorado na baixa de estoque, nenhum erro aparece e o recibo usa o snapshot.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.

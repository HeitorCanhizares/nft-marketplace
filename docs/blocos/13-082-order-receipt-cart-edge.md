# 13-082 — Confirmação: recibo, snapshot, carrinho, mock e acessibilidade

**Status:** pendente
**Responsável:** Sonnet
**Depende de:** 13-001, 13-080
**Toca:** `tests/e2e/order-receipt-edge.spec.ts` (novo); `tests/e2e/order-confirmation-a11y.spec.ts` (acrescentar; arquivo só deste bloco)
**Paralelo:** sim.
**Lote:** T7
**Origem:** 12-020 (Recibo e snapshot, Carrinho, Mock, Estados e acessibilidade), decisão "NFT ou edição removidos durante a liquidação são ignorados"

Regras: 13-001.

## Recibo e snapshot
1. **O recibo não muda** quando o preço do NFT muda no mock (`triggerPriceChange`), a edição esgota ou o NFT é removido do `nftsStore`: itens, nomes, imagens, edições, subtotais, taxa e total ficam os do snapshot, e a página **não faz** `GET /nfts` (`recordApi`).
2. Com cupom: "Subtotal" e "Desconto do lançamento"; sem cupom: só taxa e total.
3. Edição aberta não baixa estoque; edição limitada baixa só o comprado e emite `nft:stock_changed` (card da Início e detalhe atualizam).
4. Explorador por rede (Etherscan, Polygonscan, Solscan) — **inclui Solana**; `explorerUrl` de domínio desconhecido não mostra o botão; "Copiar ID da transação": sucesso e falha do clipboard (`context.grantPermissions` / negar), anúncio `polite`, check por 2 s; ID abreviado com o valor completo acessível.
5. Data em pt-BR no fuso do navegador (`timezoneId` fixo no teste); textos longos (nome do NFT, rótulo da carteira) quebram sem sobrepor "(x N)" e o subtotal.

## NFT ou edição removidos durante a liquidação (decisão do usuário: ignorar)
6. Pedido pendente cujo NFT (ou edição) deixa de existir no `nftsStore` antes do desfecho: o pedido **confirma**, o item removido é ignorado na baixa de estoque, nenhum erro aparece e o recibo usa o snapshot. (Comportamento não estava documentado: o Opus registra em `fluxos/confirmacao.md`.)

## Carrinho
7. **Só os itens e quantidades comprados saem do carrinho:** item adicionado depois da cotação continua; quantidade a mais do mesmo item continua com a diferença; linha comprada por inteiro some; carrinho que sobra mantém o cupom e o esvaziado perde o cupom; `version` incrementada; contador do cabeçalho confere. Recusa e pendente não mexem no carrinho nem no estoque.

## Mock
8. `GET /orders/:id` só do dono; `GET /orders?status=pending` só do usuário e sem pedido vencido; duas liquidações simultâneas (timer + `GET`) baixam o estoque **uma vez** e emitem um evento; `txHash` = `0x` + 64 hexadecimais; snapshot imutável depois do desfecho.

## Estados e acessibilidade
9. Esqueleto com `slow`; `[d]`↔`[m]` no meio do acompanhamento mantém o estado; 1024 a 1439 px; `prefers-reduced-motion` (spinner parado); teclado (Esc e X fecham, foco preso, foco inicial no título, retorno do foco); leitor (anúncios, ID completo); contraste de `muted-foreground` e `tan` sobre `card`; axe nos estados pendente, recusado, 403 e 404.

## Critérios de aceite
- [ ] Specs verdes em `desktop` e `mobile`.

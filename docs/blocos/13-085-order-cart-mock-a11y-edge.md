# 13-085 — Confirmação: baixa parcial do carrinho, mock concorrente e acessibilidade

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low)
**Depende de:** 13-001, 13-080 a 13-084
**Toca:** `tests/e2e/order-cart-mock-edge.spec.ts` (novo); `tests/e2e/order-confirmation-a11y.spec.ts` (acrescentar; arquivo só deste bloco)
**Paralelo:** sim (arquivos próprios).
**Lote:** T7
**Origem:** 12-020 (Carrinho, Mock, Estados e acessibilidade)

Regras: 13-001.

## Casos (`order-cart-mock-edge.spec.ts`)
1. **Só os itens e quantidades comprados saem do carrinho:** item adicionado depois da cotação continua; quantidade a mais do mesmo item continua com a diferença; linha comprada por inteiro some; carrinho que sobra mantém o cupom e o esvaziado perde o cupom; `version` incrementada; contador do cabeçalho confere. Recusa e pendente não mexem no carrinho nem no estoque.
2. `GET /orders/:id` só do dono; `GET /orders?status=pending` só do usuário e sem pedido vencido; duas liquidações simultâneas (timer + `GET`) baixam o estoque **uma vez** e emitem um evento; `txHash` = `0x` + 64 hexadecimais; snapshot imutável depois do desfecho.

## Acessibilidade (`order-confirmation-a11y.spec.ts`)
3. Esqueleto com `slow`; `[d]` ↔ `[m]` no meio do acompanhamento mantém o estado; 1024 a 1439 px; `prefers-reduced-motion` (spinner parado); teclado (Esc e X fecham, foco preso, foco inicial no título, retorno do foco); leitor (anúncios, ID completo); contraste de `muted-foreground` e `tan` sobre `card`; axe nos estados pendente, recusado, 403 e 404.

## Critérios de aceite
- [ ] Specs verdes em `desktop` e `mobile`; axe sem `serious`/`critical`.

# 11-019 — Fechamento da fase 11

**Status:** pendente
**Responsável:** Sonnet
**Depende de:** 11-018
**Toca:** — (só verificação e status dos blocos)
**Paralelo:** não.

> **Modo enxuto** (docs/decisoes.md): só o caminho principal.

## Escopo
1. `format:check`, `lint`, `typecheck`, `build`, `build:test` e `test:e2e` completo, uma vez (inclui o spec do carrinho, por causa do 11-011 e do 11-009).
2. Capturas finais de `/pagamento` (desktop 1440 e mobile 414, inteiras) lado a lado com `desktop-pagamento.png` e `mobile-pagamento.png`, conferindo: **desktop**: colunas de 763 e 405 px (espaço de 32 px), grade do formulário em duas colunas de 369/370 px com campos de 40 px e passo de 81 px, observação de 350 × 152 px, linhas "Seus NFTs" de 70 px (miniatura 70 × 70, espaço de 12 px), opções de provedor de 405 × 45 px (passo 61 px) e botão "Confirmar compra" de 405 × 45 px; **mobile**: margem de 28 px, cartões de carteira de 358 × 93 px (espaço de 20 px), provedores de 358 × 65 px (espaço de 16 px), "Total:" à direita e botão de 358 × 60 px na base.
3. Registrar as diferenças conhecidas (formulário preenchido, linha de conexão) e a comparação da revisão (`CheckoutReview`, não desenhada) para o usuário.
4. Status de 11-001 a 11-018 como concluído. **Tag `fase-11-pagamento` só com o OK do usuário.**
5. Avisar o usuário de que, **até a fase 12**, o pedido criado fica `pending` (a tela `/pedido/$id` é provisória) e `/pagamento` passa a redirecionar para ele.

## Adiado para a fase 13
- Clone limpo (`npm ci`), Lighthouse e o resto do 11-020.

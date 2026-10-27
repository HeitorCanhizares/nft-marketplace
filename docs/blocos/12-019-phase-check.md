# 12-019 — Fechamento da fase 12

**Status:** concluído
**Responsável:** Sonnet
**Depende de:** 12-018
**Toca:** — (só verificação e status dos blocos)
**Paralelo:** não.

> **Modo enxuto** (docs/decisoes.md): só o caminho principal.

## Escopo
1. `format:check`, `lint`, `typecheck`, `build`, `build:test` e `test:e2e` completo, **uma vez** (inclui os specs do carrinho e do Pagamento, por causa de 12-006, 12-007 e 12-016, e os da Início, por causa do 12-004).
2. Capturas finais de `/pedido/<id>` confirmado (pedido semeado como o do Figma): **desktop 1440 × 1657** e **mobile 414** (inteira), lado a lado com `desktop-confirmacao.png`, conferindo no desktop: modal de **578 px** (x 431–1009) com topo a **166 px** e faixa inferior de **10 px**; fundo `background` opaco; ícone de 66 × 80 px; cabeçalho de 156 px; faixa de dados de **67 px** entre as bordas (65 internos) com 4 células e separadores de 1 px; tabela de 490 px com linhas de **70 px** (miniatura 70 × 70, espaço de 12 px); totais com passo de 30 px; mensagem de 3 linhas (entrelinha 22 px); botão de **186 × 48 px**. No mobile: margem de 28 px, faixa 2 × 2, itens em cartões, botão de 358 × 60 px.
3. Passada manual no navegador, desktop e mobile: pagar → "Confirmando pagamento..." → recibo sem recarregar; `payment-declined` → recusado com motivo e "Tentar novamente" voltando ao Pagamento com o formulário preenchido; refresh no pedido pendente (`payment-slow`) retoma; pedido de outro usuário → "Você não tem acesso a este pedido".
4. Registrar as diferenças conhecidas para o Figma (data em pt-BR, rótulos da faixa em negrito, legenda "Transação simulada", botão de copiar, edição no recibo, fundo sem o Pagamento por trás) e levar ao usuário, **como não desenhados**, os estados pendente e recusado e o mobile inteiro, para aprovação visual.
5. Status de 12-001 a 12-018 como concluído. **Tag `fase-12-confirmacao` só com o OK do usuário.**
6. Avisar o usuário de que o fluxo agora vai de ponta a ponta (carrinho → pagamento → confirmação) e de que `docs/design/componentes.md` precisa registrar `OrderDialog` (se aprovado), `OrderReceipt` e `OrderStatus` como implementados.

## Adiado para a fase 13
- Clone limpo (`npm ci`), Lighthouse e o 12-020.

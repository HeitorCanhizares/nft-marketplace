# 06-063 — Testes do card

**Status:** concluído
**Responsável:** Sonnet

> **Modo enxuto** (docs/decisoes.md): só o caminho principal. 

## Adiado para a fase 13
- Ações no hover e no foco do teclado, selos (Esgotado, raridade), favoritar otimista com erro e reversão, favoritar deslogado (ida ao login e volta), cliques repetidos no carrinho, erro de carrinho, estoque, `/?favoritos=1` e favoritos vazio.

## Escopo enxuto (`tests/e2e/home.spec.ts`)
- Logado: favoritar (`aria-pressed`), e no desktop adicionar ao carrinho pelo card e ver o contador do cabeçalho ("Carrinho, 1 item"). No mobile o card não tem ação de carrinho.
- Clicar no card leva a `/nft/$id`.

# 06-062 — Testes da busca

**Status:** concluído
**Responsável:** Sonnet

> **Modo enxuto** (docs/decisoes.md): só o caminho principal. 

## Adiado para a fase 13
- Estado sem resultados, debounce de 300 ms e Enter/Limpar, busca com espaços/caracteres especiais, sincronia ao voltar no histórico, busca combinada com filtros, cancelamento de requisições antigas.

## Escopo enxuto (`tests/e2e/home.spec.ts`)
- Desktop: busca pelo ícone do cabeçalho (`/?q=cosmic`).
- Mobile: barra de busca com debounce (`q=cosmic` na URL).

# 13-095 — Fechamento: suíte completa nos 3 navegadores

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** todos os blocos de teste e de correção da fase (13-001 a 13-094)
**Toca:** — (só execução)
**Paralelo:** não.
**Lote:** —

## Instruções
1. `npm run format:check && npm run lint && npm run typecheck && npm run build && npm run build:test`.
2. `npm run test:e2e` completo **uma vez**: projetos `desktop`, `mobile` (inclui `tests/visual/`), `firefox` e `webkit` (sem visual). Esperado: 0 falhas.
3. Falha: reexecutar só o arquivo afetado; se passar na segunda vez, tratar como instável (13-004) e **não** liberar o fechamento até estabilizar; se for bug, bloco `13-1NN`.
4. Registrar contagens (passaram, puladas por projeto, tempo) para o Opus.

## Critérios de aceite
- [ ] 0 falhas nos 4 projetos; nenhuma baseline atualizada sem aprovação do usuário.

# 00-017 — Pastas vazias de `src/`

**Status:** pendente
**Fluxo / subitem:** Fase 00 › Estrutura de pastas aprovada (app)
**Depende de:** 00-016

## Objetivo
Criar, com `.gitkeep`, as pastas da árvore aprovada que ainda não têm arquivo, exceto `mocks/`.

## Arquivos
- criar (somente `.gitkeep`, não contam como código):
  - `src/pages/`, `src/components/ui/`, `src/components/layout/`, `src/components/shared/`
  - `src/contexts/`, `src/hooks/`, `src/schemas/`, `src/types/`, `src/assets/`
  - `src/services/http/`, `src/services/api/`, `src/services/realtime/`, `src/services/wallet/`

## Referências
- docs/arquitetura/pastas.md

## Instruções
1. Criar cada pasta acima com um arquivo `.gitkeep` vazio dentro.
2. **Não** criar `src/app/`, `src/routes/`, `src/lib/` e `src/styles/` (já existem com arquivos), nem subpastas de `pages/` (cada tela nasce na sua fase).
3. Não criar nenhuma pasta fora do mapa. Qualquer dúvida de nome: perguntar.
4. Commit: `git add src` e `git commit -m "00-017: pastas vazias de src"`.

## Critérios de aceite
- [ ] As 13 pastas existem, cada uma com `.gitkeep`.
- [ ] Nada além de `.gitkeep` no commit.

## Verificação (Sonnet)
- `git diff --stat HEAD~1` → 13 arquivos `.gitkeep`.
- Comparar `find src -type d` com a árvore de `pastas.md` (as pastas de `mocks/` vêm no 00-018).
- `npm run lint && npm run format:check && npm run typecheck && npm run build` → exit 0.

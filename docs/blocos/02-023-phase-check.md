# 02-023 — Validação final e checkpoint da fase 02

**Status:** pendente
**Responsável:** Sonnet
**Fluxo / subitem:** Fase 02 › Checkpoint
**Depende de:** 02-001 a 02-022

## Objetivo
Validar a base do mock num clone limpo e entregar o resumo ao usuário.

## Arquivos
- nenhum arquivo

## Referências
- docs/blocos/README.md (checkpoint e tag por fase)

## Instruções
1. Clone limpo: `npm ci`; `format:check`, `lint`, `typecheck`, `build`, `build:test`, `test:e2e` e `lhci`.
2. Conferir: `src/mocks/` com as pastas e arquivos previstos; só `src/main.tsx` importa de `mocks/`; nenhuma senha em claro no repositório (`grep` pelas senhas informadas); `.gitkeep` removido das pastas que ganharam arquivos.
3. Entregar ao usuário: resumo, resultados, as contagens do seed, as notas do LHCI (o worker agora entra no custo) e como ver (`npm run dev` com o painel Application aberto).
4. Perguntar ao usuário: (a) tipos propostos `Review`/`Promo`/`Post`; (b) handler de saúde; (c) credenciais dos testes só em `tests/e2e/fixtures.ts`; (d) regra "sem oscilação aleatória em `MODE === 'test'`" no lugar de uma variável nova.
5. **Só com o OK do usuário:** `git tag fase-02-mock-base`. Sem push.


## Critérios de aceite
- [ ] Todos os comandos com exit 0 no clone limpo.
- [ ] Usuário aprovou o checkpoint e a tag foi criada.

## Verificação (Sonnet)
- É o próprio bloco de verificação.

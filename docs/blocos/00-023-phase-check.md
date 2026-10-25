# 00-023 — Validação final e checkpoint da fase 00

**Status:** pendente
**Responsável:** Sonnet
**Fluxo / subitem:** Fase 00 › Checkpoint
**Depende de:** 00-001 a 00-022

## Objetivo
Validar o setup inteiro a partir de um clone limpo e entregar o resumo ao usuário.

## Arquivos
- nenhum

## Referências
- docs/blocos/README.md (checkpoint e tag por fase)
- docs/arquitetura/pastas.md

## Instruções (Sonnet)
1. Clone limpo em pasta temporária: `git clone` do repositório local, depois `npm ci`.
2. Rodar, nesta ordem: `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run build`, `npm run build:test`, `npm run test:e2e`, `npm run lhci`.
3. Comparar a árvore com `pastas.md` e as dependências instaladas com a stack + A7 + `lucide-react` (nada a mais, nada a menos).
4. Conferir `git log --oneline`: 1 commit por bloco (00-001 a 00-022) e `git status` limpo.
5. Entregar ao usuário: resumo, resultado dos comandos, como ver no navegador (`npm run dev` em `http://localhost:5173`) e as notas do LHCI.
6. **Só com o OK do usuário:** `git tag fase-00-setup`. Sem push.

## Critérios de aceite
- [ ] Todos os comandos do item 2 com exit 0 no clone limpo.
- [ ] Árvore e dependências conforme o aprovado.
- [ ] Usuário aprovou o checkpoint e a tag foi criada.

## Verificação
- É o próprio bloco de verificação; se algo falhar, o Sonnet devolve o bloco correspondente ao Haiku com a lista do que falta.

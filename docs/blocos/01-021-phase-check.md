# 01-021 — Validação final e checkpoint da fase 01

**Status:** pendente
**Responsável:** Sonnet
**Fluxo / subitem:** Fase 01 › Checkpoint
**Depende de:** 01-001 a 01-020

## Objetivo
Validar os tokens e os 20 primitivos juntos e entregar ao usuário uma página de conferência visual.

## Arquivos
- nenhum arquivo commitado além de `tests/e2e/tokens.spec.ts` (contraste dos tokens), escrito pelo Sonnet

## Referências
- docs/design/telas/, docs/design/tokens.md, docs/design/componentes.md, docs/qualidade/acessibilidade.md

## Instruções
1. Rodar, num clone limpo: `npm ci`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e`.
2. Probe **não commitado** (`src/routes/_probe.tsx`) com todos os primitivos e todas as variantes; capturas desktop e mobile.
3. Conferir: nenhuma cor literal fora de `globals.css` (`grep` por `#`, `oklch(`, `rgb(` em `src/components`), sem `next-themes`, sem Geist, `src/components/ui/` com exatamente os 20 primitivos aprovados.
4. Entregar ao usuário: resumo, resultados, as capturas do probe e como ver. Perguntar: os valores propostos (`destructive`, `success`, gradiente) estão aprovados?
5. Só com o OK do usuário: `git tag fase-01-design-base`. Apagar o probe antes. Sem push.


## Critérios de aceite
- [ ] Todos os comandos do item 1 com exit 0.
- [ ] Contraste dos tokens dentro dos limites.
- [ ] Usuário aprovou o visual e a tag foi criada.

## Verificação (Sonnet)
- É o próprio bloco de verificação; se algo falhar, o Sonnet devolve o bloco correspondente ao Haiku.

# 03-020 — Validação final e checkpoint da fase 03

**Status:** pendente
**Responsável:** Sonnet
**Fluxo / subitem:** Fase 03 › Checkpoint
**Depende de:** 03-001 a 03-019

## Objetivo
Validar a base do app num clone limpo e entregar o resumo ao usuário.

## Arquivos
- nenhum arquivo

## Referências
- docs/blocos/README.md (checkpoint e tag por fase)

## Instruções
1. Clone limpo: `npm ci`; `format:check`, `lint`, `typecheck`, `build`, `build:test`, `test:e2e` e `lhci`.
2. Conferir: `src/services/api/` só com `auth.ts`; só `main.tsx` importa de `mocks/`; `grep __kurio dist/` do build de produção vazio; notas do LHCI (o custo da fase 02 era 86; ver se piorou).
3. Entregar ao usuário: resumo, resultados e como ver. Perguntar: (a) a ponte de teste `window.__kurio`; (b) o redirecionamento de sessão expirada ficar na fase 05; (c) os nomes de arquivo propostos; (d) o tratamento de erro de rede na inicialização do `AuthContext` (mantém o token e segue como visitante).
4. **Só com o OK do usuário:** `git tag fase-03-app-base`. Sem push.


## Critérios de aceite
- [ ] Todos os comandos com exit 0 no clone limpo.
- [ ] Usuário aprovou o checkpoint e a tag foi criada.

## Verificação (Sonnet)
- É o próprio bloco de verificação.

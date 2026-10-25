# 00-009 — Instalar TanStack Query e Axios

**Status:** pendente
**Fluxo / subitem:** Fase 00 › TanStack Query e Axios (instalados)
**Depende de:** 00-008

## Objetivo
Instalar as bibliotecas de estado remoto e HTTP, sem usá-las (a camada HTTP e o `QueryClient` são da fase 03).

## Arquivos
- nenhum arquivo de código; só `package.json` e `package-lock.json`

## Referências
- docs/arquitetura/estado.md
- Fase 03 em docs/blocos/README.md

## Instruções
1. `npm install @tanstack/react-query axios`.
2. **Não** instalar `@tanstack/react-query-devtools` (dependência não aprovada) e **não** criar `QueryClient`, `services/http` nem importar os pacotes em nenhum arquivo.
3. Commit: `git add package.json package-lock.json` e `git commit -m "00-009: instala TanStack Query e Axios"`.

## Critérios de aceite
- [ ] Os dois pacotes em `dependencies`.
- [ ] Nenhum arquivo em `src/` alterado.

## Verificação (Sonnet)
- `npm ls @tanstack/react-query axios` sem `UNMET`/`invalid`.
- `npm run typecheck && npm run build` → exit 0.
- `git diff --stat HEAD~1` mostra só `package.json` e `package-lock.json`.

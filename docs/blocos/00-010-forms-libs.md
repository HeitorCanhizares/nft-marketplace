# 00-010 — Instalar react-hook-form e zod

**Status:** pendente
**Fluxo / subitem:** Fase 00 › Dependências da stack (formulários)
**Depende de:** 00-009

## Objetivo
Instalar as bibliotecas de formulário e validação aprovadas.

## Arquivos
- nenhum arquivo de código; só `package.json` e `package-lock.json`

## Referências
- docs/decisoes.md (Formulários: react-hook-form + zod)
- docs/arquitetura/estado.md#formulários

## Instruções
1. `npm install react-hook-form zod @hookform/resolvers@5.2.2 --save-exact` **só para o resolvers** (ou, em dois comandos: `npm install react-hook-form zod` e `npm install --save-exact @hookform/resolvers@5.2.2`). Versão exata 5.2.2 decidida pelo usuário em 2026-10-25: as versões 5.9.x e 6.0 dão ERESOLVE (cadeia opcional `@typeschema/*`).
2. Se o npm acusar conflito de peer dependency (`ERESOLVE`) entre `zod` e `@hookform/resolvers`, **não** usar `--force` nem `--legacy-peer-deps`: parar e avisar o Sonnet.
3. Não criar schemas nem importar os pacotes.
4. Commit: `git add package.json package-lock.json` e `git commit -m "00-010: instala react-hook-form e zod"`.

## Critérios de aceite
- [ ] Três pacotes em `dependencies`, sem aviso de peer.
- [ ] Nenhum arquivo em `src/` alterado.

## Verificação (Sonnet)
- `npm ls react-hook-form zod @hookform/resolvers` limpo.
- `npm run typecheck && npm run build` → exit 0.

# 00-022 — Configuração do Lighthouse CI

**Status:** pendente
**Fluxo / subitem:** Fase 00 › Configuração do LHCI
**Depende de:** 00-015, 00-008

## Objetivo
Instalar o `@lhci/cli` e configurar a auditoria sobre o build de preview em modo `test`, com as metas de `lighthouse.md` registradas como **aviso** (viram erro na fase 13).

## Arquivos
- criar: `lighthouserc.json`
- alterar: `package.json` (script `lhci`)

## Referências
- docs/qualidade/lighthouse.md (metas e cuidados)
- docs/decisoes.md (A7: `@lhci/cli`)
- Fase 13 em docs/blocos/README.md

## Instruções
1. `npm install -D @lhci/cli`.
2. `lighthouserc.json`, em `ci`:
   - `collect`: `startServerCommand: "npm run build:test && npm run preview -- --port 4174 --strictPort"`, `startServerReadyPattern: "Local"`, `startServerReadyTimeout: 180000`, `url: ["http://localhost:4174/"]`, `numberOfRuns: 3`. Perfil mobile (padrão do Lighthouse); não definir `preset: desktop`.
   - `assert`: `categories:performance` ≥ 0.9, `categories:accessibility` ≥ 1, `categories:best-practices` ≥ 0.95, `categories:seo` ≥ 0.9, `largest-contentful-paint` ≤ 2500, `cumulative-layout-shift` ≤ 0.1. Todas com nível `warn`. (INP não é medido em laboratório; fica para a fase 13.)
   - `upload`: `target: "filesystem"`, `outputDir: ".lighthouseci"`.
3. Script `lhci` → `lhci autorun`. A porta 4174 evita conflito com o servidor do Playwright (4173).
4. Só a rota `/` por enquanto; as outras páginas entram junto de cada fluxo e as logadas na fase 13.
5. Se o LHCI não achar o Chrome, **parar e avisar** (não instalar nada).
6. Commit: `git add lighthouserc.json package.json package-lock.json` e `git commit -m "00-022: configuração do Lighthouse CI"`.

## Critérios de aceite
- [ ] `npm run lhci` termina, gera `.lighthouseci/` (ignorada pelo Git) e imprime as notas.
- [ ] Os limites do arquivo coincidem com a tabela de metas.
- [ ] Nenhuma asserção com nível `error` nesta fase.

## Verificação (Sonnet)
- `npm run lhci` → exit 0 e relatório em `.lighthouseci/`.
- Conferir que `git status --short` não mostra `.lighthouseci`.
- `npm run lint && npm run format:check && npm run typecheck` → exit 0.
- Registrar as notas obtidas (a página é um placeholder; servem só como referência inicial).

# 00-001 — Git local e .gitignore

**Status:** pendente
**Fluxo / subitem:** Fase 00 › Git
**Depende de:** —

## Objetivo
Iniciar o repositório local, versionando `docs/` e um `.gitignore` adequado ao projeto.

## Arquivos
- criar: `.gitignore`

## Referências
- Git: docs/blocos/README.md#git, docs/decisoes.md (Fases de implementação)

## Instruções
1. Na raiz do projeto: `git init -b main`.
2. Conferir `git config user.name` e `git config user.email`. Se algum estiver vazio, **parar e perguntar ao usuário** (não inventar identidade).
3. Criar `.gitignore` com, no mínimo: `node_modules`, `dist`, `dist-ssr`, `*.local`, `.env.local`, `.env.*.local`, `*.log`, `*.tsbuildinfo`, `coverage`, `playwright-report`, `test-results`, `blob-report`, `playwright/.cache`, `.lighthouseci`, `.DS_Store`, `Thumbs.db`, `.idea`.
4. **Não** ignorar: `.env`, `.env.development`, `.env.test` (só têm variáveis `VITE_` públicas e sem segredo), `package-lock.json`, `src/routeTree.gen.ts`.
5. Rodar `git status`. Deve listar só `docs/` e `.gitignore`. Se aparecer qualquer outra coisa (ex.: `.claude/`), **parar e perguntar**.
6. Commit: `git add .gitignore docs` e `git commit -m "00-001: git init, .gitignore e docs de planejamento"`.

## Critérios de aceite
- [ ] Branch `main`, com 1 commit.
- [ ] `git status` limpo.
- [ ] Nenhum arquivo fora de `docs/` e `.gitignore` no commit.
- [ ] Nenhum remoto configurado (`git remote -v` vazio).

## Verificação (Sonnet)
- `git log --oneline` → 1 commit.
- `git status --short` → vazio.
- `git check-ignore -v node_modules .env.local` → ambos ignorados.
- `git check-ignore .env.test src/routeTree.gen.ts` → sem saída (não ignorados).
- `git remote -v` → vazio.

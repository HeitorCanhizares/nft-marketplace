# 00-003 — Configuração do TypeScript

**Status:** pendente
**Fluxo / subitem:** Fase 00 › Vite + React + TypeScript
**Depende de:** 00-002

## Objetivo
Configurar o TypeScript em modo estrito, com o alias `@/*` → `src/*`, no formato de projetos referenciados do Vite.

## Arquivos
- criar: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`

## Referências
- Alias: decisão do usuário de 2026-10-25 (exigido pelo shadcn)
- Pastas: docs/arquitetura/pastas.md

## Instruções
Usar como base os valores do template `react-ts` atual do Vite (a pasta temporária do 00-002). Ajustes obrigatórios:
1. `tsconfig.json`: `files: []`, `references` para `tsconfig.app.json` e `tsconfig.node.json`, e `compilerOptions.paths` com `"@/*": ["./src/*"]` (o init do shadcn lê o alias daqui). Sem `baseUrl`, a menos que o TypeScript instalado exija; se exigir, usar `"."` e avisar.
2. `tsconfig.app.json`: `strict: true`, `noEmit: true`, `jsx: "react-jsx"`, `moduleResolution: "bundler"`, `types: ["vite/client"]`, `include: ["src"]` e o mesmo `paths` do item 1. Manter `noUnusedLocals`, `noUnusedParameters` e `noFallthroughCasesInSwitch` do template.
3. `tsconfig.node.json`: `include: ["vite.config.ts"]` e `types: ["node"]`. (Os blocos 00-020 e seguintes acrescentam outros arquivos.)
4. Não adicionar opções além das do template e do item 1 (ex.: `noUncheckedIndexedAccess`). Se achar necessário, perguntar.
5. Commit: `git add tsconfig.json tsconfig.app.json tsconfig.node.json` e `git commit -m "00-003: configuração do TypeScript"`.

## Critérios de aceite
- [ ] `strict: true` ativo.
- [ ] Alias `@/*` presente em `tsconfig.json` **e** em `tsconfig.app.json`.
- [ ] `tsconfig.node.json` cobre `vite.config.ts`.

## Verificação (Sonnet)
- `npx tsc -p tsconfig.app.json --showConfig` sem erro, mostrando `strict: true` e `paths` com `@/*`.
- O `npm run typecheck` completo só roda após o 00-004 (ainda não há `src/`).

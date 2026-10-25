# 00-002 — Vite + React: package.json, config e HTML

**Status:** pendente
**Fluxo / subitem:** Fase 00 › Vite + React + TypeScript com npm
**Depende de:** 00-001

## Objetivo
Criar a base do projeto (manifesto npm, configuração do Vite com alias `@/` e `index.html`) e instalar React, Vite e TypeScript.

## Arquivos
- criar: `package.json`, `vite.config.ts`, `index.html`
- gerado pelo npm (não conta no limite): `package-lock.json`

## Referências
- Stack: docs/decisoes.md#stack-e-ferramentas-2026-10-25
- Alias `@/` e Tailwind v4: aprovados pelo usuário em 2026-10-25 (registrar em decisoes.md — pendência do Opus)

## Instruções
1. Conferir `node -v` e `npm -v`. Se o Node não atender o mínimo exigido pela versão atual do Vite, **parar e avisar**.
2. Como a pasta não está vazia, **não** rodar `npm create vite` nela. Para consultar os valores atuais do template, gerar o `react-ts` do Vite numa pasta temporária **fora do projeto** (a pasta do scratchpad) e usá-lo só como referência; nada dele é copiado além do que este bloco e o 00-003 pedem.
3. Criar `package.json`: `name: "kurio"`, `private: true`, `version: "0.0.0"`, `type: "module"` e os scripts:
   - `dev`: `vite`
   - `build`: `tsc -b && vite build`
   - `build:test`: `tsc -b && vite build --mode test`
   - `preview`: `vite preview`
   - `typecheck`: `tsc -b`
4. Instalar (versões estáveis mais recentes, com `^`):
   - `npm install react react-dom`
   - `npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom @types/node`
5. Criar `vite.config.ts` com `defineConfig`, o plugin `@vitejs/plugin-react` e `resolve.alias` `'@'` → `src`, resolvido com `fileURLToPath(new URL('./src', import.meta.url))` (projeto é ESM; não usar `__dirname`).
6. Criar `index.html`: `<html lang="pt-BR">`, `<meta charset>`, `<meta name="viewport" content="width=device-width, initial-scale=1.0">`, `<title>Kurio</title>`, `<meta name="description" content="Kurio, marketplace de NFTs.">`, `<link rel="icon" href="data:,">` (evita 404 de favicon até o ícone real da fase 01), `<div id="root"></div>` e `<script type="module" src="/src/main.tsx">`.
7. Commit: `git add package.json package-lock.json vite.config.ts index.html` e `git commit -m "00-002: Vite + React base"`.

## Critérios de aceite
- [ ] `package.json` com os 5 scripts e `type: module`.
- [ ] `package-lock.json` gerado e versionado.
- [ ] Sem `tsconfig`, `src/` ou qualquer outro arquivo criado neste bloco.
- [ ] `lang="pt-BR"`, `title` e `meta description` presentes.

## Verificação (Sonnet)
Ainda não há `src/` nem tsconfig, então build e typecheck só passam a funcionar no 00-004.
- `npm ls --depth=0` → react, react-dom, vite, @vitejs/plugin-react, typescript, @types/*.
- `npx vite --version` e `npx tsc --version` respondem.
- `npm install` sem avisos `ERESOLVE`.

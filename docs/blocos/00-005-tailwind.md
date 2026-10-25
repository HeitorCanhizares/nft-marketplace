# 00-005 — Tailwind CSS v4

**Status:** pendente
**Fluxo / subitem:** Fase 00 › Tailwind
**Depende de:** 00-004

## Objetivo
Instalar o Tailwind v4 com o plugin do Vite e criar o `globals.css` apenas com o import do Tailwind (os tokens do Figma são da fase 01).

## Arquivos
- criar: `src/styles/globals.css`
- alterar: `vite.config.ts`, `src/main.tsx`

## Referências
- Tailwind v4 aprovado em 2026-10-25
- docs/arquitetura/pastas.md (`styles/globals.css`)
- docs/design/tokens.md (só a fase 01 usa)

## Instruções
1. `npm install tailwindcss @tailwindcss/vite`.
2. `vite.config.ts`: importar `tailwindcss from '@tailwindcss/vite'` e adicionar `tailwindcss()` em `plugins`, junto do plugin do React.
3. Criar `src/styles/globals.css` contendo somente `@import "tailwindcss";`.
4. `src/main.tsx`: adicionar `import '@/styles/globals.css'`.
5. **Sem** `tailwind.config.*`, `postcss.config.*`, tokens, cores, fonte ou estilos no `<h1>`.
6. Commit: `git add package.json package-lock.json vite.config.ts src/styles/globals.css src/main.tsx` e `git commit -m "00-005: Tailwind v4"`.

## Critérios de aceite
- [ ] `globals.css` tem uma única linha de import.
- [ ] Não existe `tailwind.config.*` nem `postcss.config.*`.
- [ ] `npm run build` gera CSS em `dist/assets/`.

## Verificação (Sonnet)
- `npm run typecheck && npm run build` → exit 0.
- `dist/assets/*.css` existe e começa com o banner `/*! tailwindcss v4`.
- Sanidade (não commitada): trocar temporariamente o `<h1>` por `className="text-red-500"`, rodar `npm run build` e ver `text-red-500` no CSS; reverter com `git checkout src/main.tsx`.

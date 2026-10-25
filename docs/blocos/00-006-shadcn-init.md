# 00-006 — shadcn/ui: init e lucide-react

**Status:** pendente
**Fluxo / subitem:** Fase 00 › shadcn (init)
**Depende de:** 00-005

## Objetivo
Inicializar o shadcn/ui (configuração e utilitário `cn`) e instalar as dependências que ele pede, **sem gerar nenhum componente** nem estilizar nada.

## Arquivos
- criar: `components.json`, `src/lib/utils.ts`
- alterar: `src/styles/globals.css` (o init acrescenta as variáveis padrão do shadcn; a fase 01 substitui pelos tokens do Figma)

## Referências
- `lucide-react` confirmado pelo usuário em 2026-10-25
- docs/design/tokens.md#ícones
- docs/arquitetura/pastas.md (`components/ui`, `lib/utils`)

## Instruções
1. Rodar `npx shadcn@latest init -t vite -b radix -p nova -y` (preset **Nova**, decidido pelo usuário em 2026-10-25; se a CLI não aceitar `nova` com `-b radix`, tentar `radix-nova`; CLI 4.x; `--defaults` força o template `next`, não usar). Biblioteca base **Radix UI**, decidida pelo usuário em 2026-10-25. Respostas esperadas: framework Vite, base color `neutral`, variáveis CSS ligadas, `tailwind.config` vazio (Tailwind v4), CSS em `src/styles/globals.css`.
2. Conferir os aliases gerados em `components.json`: `components` → `@/components`, `ui` → `@/components/ui`, `utils` → `@/lib/utils`, `lib` → `@/lib`, `hooks` → `@/hooks`.
3. Garantir que as dependências estão no `package.json`: `class-variance-authority`, `tw-animate-css`, `lucide-react`. O init atual (preset Nova) também traz `radix-ui`, `cn` (pacote do próprio shadcn, usado em `src/lib/utils.ts` no lugar de clsx + tailwind-merge) e `shadcn` (CSS `shadcn/tailwind.css`): **aceitos pelo usuário em 2026-10-25**. Remover `@fontsource-variable/geist` (pacote e `@import` no `globals.css`): a fonte do projeto é definida na fase 01.
3a. Apagar qualquer componente gerado pela CLI (ex.: `src/components/ui/button.tsx`).
4. **Não** rodar `npx shadcn add`. Os componentes entram na fase 01.
5. Se a CLI criar qualquer arquivo além dos listados (ex.: `components/ui/*`, `hooks/*`), apagar e avisar o Sonnet. Se precisar tocar em tsconfig ou vite.config, **parar e perguntar**.
6. Commit: `git add components.json src/lib/utils.ts src/styles/globals.css package.json package-lock.json` e `git commit -m "00-006: shadcn init e lucide-react"`.

## Critérios de aceite
- [ ] `components.json` com os aliases do item 2 e `css` apontando para `src/styles/globals.css`.
- [ ] `src/lib/utils.ts` exporta `cn`.
- [ ] `src/components/ui/` não existe ainda (ou vazia).
- [ ] As 5 dependências do item 3 aparecem em `npm ls --depth=0`.
- [ ] `globals.css` continua começando por `@import "tailwindcss";`.

## Verificação (Sonnet)
- `npm run typecheck && npm run build` → exit 0.
- `git diff --stat HEAD~1` mostra só os arquivos do item 6.
- Conferir que nenhum componente foi gerado e que a tela continua só com o `<h1>`.

# 04-003 — Componente SvgIcon (sem dependência nova)

**Status:** pendente (**depende da resposta do usuário à pergunta 1 do relatório da fase 04**)
**Fluxo / subitem:** Fase 04 › Ícones
**Depende de:** 04-002

## Objetivo
Importar os 6 SVGs do Figma como componente React **sem instalar plugin**: um único `SvgIcon` que usa o arquivo `.svg` como máscara CSS e pinta com `currentColor`.

> Alternativa que exige dependência nova (`vite-plugin-svgr`, `import SearchIcon from '@/assets/icons/search.svg?react'`) **não é decidida aqui**. Se o usuário escolher o svgr, este bloco é reescrito.

## Arquivos
- criar: `src/assets/icons/SvgIcon.tsx`

## Referências
- docs/design/tokens.md#ícones
- `src/vite-env.d.ts` (já referencia `vite/client`, que tipa `*.svg` como `string`)

## Instruções
1. Importar os 6 arquivos: `import xUrl from './x.svg'` etc. (o Vite devolve a URL, ou um data URI para arquivos pequenos).
2. Tabela interna `ICONS: Record<SvgIconName, { src: string; size: number }>` com os tamanhos nativos: `message` 18, `x` 18, `arrow-down` 20, `search` 22, `user` 20, `shop` 20. Exportar `type SvgIconName = keyof typeof ICONS`.
3. `SvgIcon({ name, size, className, style, title, ...props })`, com `props` = `React.ComponentProps<'span'>` sem `children`:
   - Renderiza `<span>` com `className={cn('inline-block shrink-0 bg-current', className)}` e `style` mesclando: `width` e `height` = `size ?? ICONS[name].size` (px), `maskImage: url("${src}")`, `WebkitMaskImage` igual, `maskRepeat`/`WebkitMaskRepeat: 'no-repeat'`, `maskPosition`/`WebkitMaskPosition: 'center'`, `maskSize`/`WebkitMaskSize: 'contain'`.
   - **Decorativo por padrão:** `aria-hidden="true"`. Com a prop `title`, vira `role="img"` + `aria-label={title}` e sem `aria-hidden`.
   - `{...props}` repassado (isso inclui `ref`, que no React 19 chega como prop; o `SelectPrimitive.Icon asChild` do 04-004 depende disso).
4. A cor vem do contexto: `text-primary`, `text-foreground`, `text-tan` etc. Nunca usar a cor que está dentro do arquivo `.svg`.
5. Fechamento: `npx prettier --write src/assets/icons/SvgIcon.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/assets/icons/SvgIcon.tsx` e `git commit -m "04-003: SvgIcon"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; nenhuma dependência nova no `package.json`.
- [ ] Os 6 ícones renderizam no `npm run dev` **e** no `npm run preview` (data URI e URL de arquivo).
- [ ] A cor muda com `text-*` e com `hover:text-*` do pai.
- [ ] Decorativo: `aria-hidden="true"`; com `title`: `role="img"` e nome acessível.
- [ ] Sem cor hexadecimal no componente.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Probe **não commitado** com os 6 ícones em `text-primary`, `text-foreground` e `text-tan`, nos tamanhos nativos e em 2×; captura comparada com os SVGs de origem (mesma forma).
- Conferir no Chromium **e** no Firefox (a máscara com `url()` quebra com aspas mal escapadas).

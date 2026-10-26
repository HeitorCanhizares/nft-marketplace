# 04-015 — Skeletons base (página e formulário)

**Status:** pendente
**Fluxo / subitem:** Fase 04 › Estados
**Depende de:** 03-020

## Objetivo
Criar os dois skeletons genéricos: o de página (usado como `pendingComponent` padrão do router) e o de formulário (Perfil, Carteiras, Pagamento).

## Arquivos
- criar: `src/components/shared/PageSkeleton.tsx`, `src/components/shared/FormSkeleton.tsx`

## Referências
- docs/design/componentes.md (Estados: `*Skeleton`)
- docs/arquitetura/rotas.md (`pendingComponent`: skeleton da página)
- docs/fluxos/perfil.md (subitem 9: skeleton do formulário)
- `src/components/ui/skeleton.tsx` (primitivo: `aria-hidden`, `animate-pulse`, respeita `prefers-reduced-motion`)

## Instruções
Os skeletons **de dados** (`NftCardSkeleton`, `LineItemSkeleton`, etc.) **não** entram aqui: nascem com seus componentes nos fluxos.
1. `PageSkeleton.tsx`: container `div` `className="container-page py-8"` com `role="status"` e `aria-busy="true"`, e um `<span className="sr-only">Carregando…</span>` como primeiro filho. Conteúdo: barra de título (`Skeleton h-8 w-64 max-w-full`), uma linha de texto (`h-4 w-96 max-w-full`) e uma grade `grid gap-6 pt-6 sm:grid-cols-2 lg:grid-cols-3` com 3 blocos `Skeleton h-48`.
2. `FormSkeleton.tsx`: props `fields?: number` (padrão 4), `columns?: 1 | 2` (padrão 1; 2 colunas só a partir de `lg`), `className?`. Mesmo `role="status"`, `aria-busy="true"` e texto sr-only "Carregando formulário…". Cada campo: barra de label (`h-4 w-32`) + barra de campo (`h-12.5 lg:h-10 w-full`, mesma altura do `Input`/`Select` no mobile e no desktop). No fim, um `Skeleton h-10 w-32` (botão).
3. Usar `Skeleton` de `@/components/ui/skeleton` e `cn` de `@/lib/utils`. Nenhuma animação própria.
4. Fechamento: `npx prettier --write` nos 2 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/shared/PageSkeleton.tsx src/components/shared/FormSkeleton.tsx` e `git commit -m "04-015: skeletons base"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; exports nomeados.
- [ ] Um único `role="status"` por skeleton; as barras são `aria-hidden` (já vem do primitivo).
- [ ] Sem cor hexadecimal, `oklch()` ou `rgb()`.
- [ ] Sem rolagem horizontal em 320 px.
- [ ] Com `prefers-reduced-motion: reduce` nada pulsa.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Probe **não commitado**; capturas 1440×900 e 414×896; axe sem violações graves; emular `prefers-reduced-motion`.

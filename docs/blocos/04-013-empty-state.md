# 04-013 — EmptyState

**Status:** pendente
**Fluxo / subitem:** Fase 04 › Estados
**Depende de:** 03-020

## Objetivo
Criar o componente de estado vazio reutilizável (catálogo sem resultados, carrinho vazio, nenhuma carteira secundária, página 404).

## Arquivos
- criar: `src/components/shared/EmptyState.tsx`

## Referências
- docs/design/componentes.md (Estados: `EmptyState`) e docs/decisoes.md (estados não desenhados: criar no padrão visual existente)
- docs/design/tokens.md (cores, tipografia)
- Capturas: **sem captura** (estado não desenhado). Padrão proposto: coluna centralizada, ícone em círculo `card`, título bold, texto `muted-foreground`, ação opcional.

## Instruções
1. Props: `title: string`, `description?: string`, `icon?: ReactNode`, `action?: ReactNode` (normalmente um `Button`), `as?: 'h1' | 'h2' | 'h3'` (padrão `'h2'`; a página 404 usa `'h1'`), `className?`.
2. Estrutura: `div` com `flex flex-col items-center gap-4 px-6 py-16 text-center`, largura máxima `max-w-md` e `mx-auto`.
   - Ícone (se houver): `div` `aria-hidden="true"`, `size-16 rounded-full bg-card text-primary`, centralizado, com `[&_svg]:size-8`.
   - Título: elemento do `as`, `text-lg font-bold text-foreground`.
   - Descrição: `p` `text-body text-muted-foreground`.
   - Ação: renderizada abaixo, sem wrapper extra além de um `div` com `mt-2`.
3. Sem `role="alert"` e sem `aria-live` (é conteúdo estático; o anúncio de "nenhum resultado" é feito pelo `LiveAnnouncerContext` da página).
4. Sem textos fixos em PT-BR dentro do componente: todo texto vem por prop.
5. Fechamento: `npx prettier --write src/components/shared/EmptyState.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/shared/EmptyState.tsx` e `git commit -m "04-013: EmptyState"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; export nomeado `EmptyState`.
- [ ] Sem cor hexadecimal, `oklch()` ou `rgb()`: só tokens.
- [ ] O título é um heading do nível pedido; o ícone é ignorado por leitores de tela.
- [ ] Contraste do texto `muted-foreground` sobre `background` ≥ 4.5:1 (já medido no 01-021).
- [ ] Sem rolagem horizontal em 320 px com título longo (quebra de linha).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Probe **não commitado** com e sem ícone/ação/descrição; capturas 1440×900 e 414×896; axe sem violações graves. A 404 do 04-031 exercita o componente numa rota real.

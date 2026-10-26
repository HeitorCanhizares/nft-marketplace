# 06-049 — `BlogCard`

**Status:** pendente
**Fluxo / subitem:** Início › 10 (blog "Diário da Cunhagem": cards visíveis; "Ler mais" desabilitado)
**Depende de:** 04-016, 01-015

## Objetivo
Criar o card de post do blog (data, tempo de leitura, título, resumo e "Ler mais" desabilitado) e o esqueleto dele.

## Arquivos
- criar: `src/components/shared/BlogCard.tsx`
- criar: `src/components/shared/BlogCardSkeleton.tsx`

## Referências
- docs/fluxos/inicio.md (subitem 10: "'Ler mais' desabilitado ('Em breve'), pois não existe tela de post") e docs/decisoes.md (itens "Em breve": **cor cheia**, sem opacidade; estado no cursor, tooltip e `aria-disabled`)
- `src/components/shared/ComingSoon.tsx`
- Captura 1:1 `desktop-inicio.png`: card `bg-card` com raio 12 (`rounded-media`) em cima e embaixo, **368 px** de altura, imagem **195 px** (topo, 268 px de largura no Figma; aqui a largura da coluna), corpo com 16 px de recuo: linha "12 de setembro | Leitura de 6 min" **12 px** `muted-foreground` (quebra em 2 linhas no Figma), título **16 px negrito** `foreground` (2 linhas, passo 22), resumo **12 px** `muted-foreground` (2 linhas), "Ler mais →" **12 px negrito** `primary`

## Instruções
1. Props: `post: Post`, `className?`. `<article className="flex flex-col overflow-hidden rounded-media bg-card">`: `<img>` (`alt` = `post.image.alt`, `h-48.75 w-full object-cover`, `loading="lazy"`); corpo `flex flex-1 flex-col gap-2.5 p-4`.
2. Meta: `<p className="text-caption text-muted-foreground">{post.date} <span aria-hidden="true">|</span> Leitura de {post.readingMinutes} min</p>` (o separador só visual; para leitor de tela: "12 de setembro, leitura de 6 min" com um `sr-only`). Título: `<h3 className="text-base font-bold">`; resumo: `<p className="text-caption text-muted-foreground">`.
3. "Ler mais →": `ComingSoon` (cor cheia, `text-caption font-bold text-primary`, `mt-auto self-start`, `ArrowRightIcon` 12 px `aria-hidden`), com `aria-label={'Ler mais sobre ' + post.title}`; o tooltip "Em breve" vem do componente.
4. `BlogCardSkeleton`: mesma caixa com `Skeleton`s; `role="status"` + sr-only "Carregando post…".
5. Fechamento: `npx prettier --write` nos 2 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/shared/BlogCard.tsx src/components/shared/BlogCardSkeleton.tsx` e `git commit -m "06-049: BlogCard"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; sem cor hexadecimal, `oklch()` ou `rgb()`.
- [ ] "Ler mais" tem `aria-disabled="true"`, cor cheia (sem opacidade), tooltip "Em breve" no foco e no hover; clicar não faz nada.
- [ ] Proporções: imagem de 195 px e corpo com 16 px de recuo; contraste do texto ≥ 4,5:1.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Probe **não commitado** com os 4 posts do seed; comparado com a captura; axe.

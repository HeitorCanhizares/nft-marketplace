# 06-035 — `NftCardSkeleton`

**Status:** concluído
**Fluxo / subitem:** Início › 12 (carregando: skeleton na grade)
**Depende de:** 01-015, 06-001

## Objetivo
Criar o esqueleto do card do NFT, com a mesma geometria do card real (sem deslocamento ao carregar).

## Arquivos
- criar: `src/components/shared/NftCardSkeleton.tsx`

## Referências
- docs/design/componentes.md (Estados: "Um `*Skeleton` por componente de dados") e `src/components/shared/PageSkeleton.tsx` (padrão)
- Geometria do card (medida nas capturas 1:1): **desktop** 258×300 px (`bg-card`, imagem 250×250 centralizada), nome (16 px) 11 px abaixo e preço (18 px) 29 px abaixo do nome; **mobile** 175×200 px (raio 20 px, imagem 168×168), nome 15 px e preço 16 px

## Instruções
1. Props: `className?`. Estrutura: `div` com o bloco do card `aspect-[43/50] bg-card max-lg:aspect-[7/8] max-lg:rounded-card` (um `Skeleton` de imagem quadrado, `w-[calc(100%-0.5rem)]`, centralizado, `rounded-media`), seguido de duas linhas de `Skeleton` (`h-4 w-3/4`, `h-5 w-1/3`) com `mt-3` e `mt-2`. Texto no mobile com `px-2`.
2. Sem `role` próprio: o `role="status"` e o texto "Carregando NFTs…" ficam no `NftGrid` (06-038); os blocos são `aria-hidden` (já vem do primitivo).
3. Usar `Skeleton` de `@/components/ui/skeleton` e `cn`. Export nomeado.
4. Fechamento: `npx prettier --write src/components/shared/NftCardSkeleton.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/shared/NftCardSkeleton.tsx` e `git commit -m "06-035: NftCardSkeleton"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; sem cor hexadecimal.
- [ ] Mesma altura do card real nos dois tamanhos (conferida no 06-038).
- [ ] Com `prefers-reduced-motion: reduce` nada pulsa (já vem do primitivo).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.

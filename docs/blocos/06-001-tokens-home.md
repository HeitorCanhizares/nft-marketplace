# 06-001 — Tokens novos da Início (raios e tamanhos de texto)

**Status:** pendente
**Fluxo / subitem:** Início › Layout (hero, destaque, promos, blog, card mobile)
**Depende de:** 01-001, 01-003
**Depende de decisão:** pergunta 8 do relatório da fase 06 (tokens novos medidos nas capturas)

## Objetivo
Registrar os 4 tokens que a Início usa e a escala atual não tem, e ensiná-los ao `cn`, para as classes não serem descartadas.

## Arquivos
- alterar: `src/styles/globals.css`
- alterar: `src/lib/utils.ts`

## Referências
- docs/design/componentes.md ("Tokens customizados e `cn`": ao criar token novo de fonte ou raio, registrar também em `utils.ts`; nunca usar `!`)
- Capturas 1:1 (`desktop-inicio.png`, `mobile-inicio.png`), medidas abaixo

## Medidas lidas nas capturas
| Token | Valor | Onde aparece |
|---|---|---|
| `--radius-panel` | `1.5rem` (24 px) | imagem do hero desktop (450×450), card do hero mobile (365×190), imagem do `FeaturedNftCard`, imagem do `PromoCard` |
| `--radius-card` | `1.25rem` (20 px) | card do NFT no mobile (175×200) |
| `--text-section` | `28px` | "Diário da Cunhagem" (18 caracteres em 302 px → 28 px) |
| `--text-featured` | `22px` | "OFERTA LIMITADA" do destaque (15 caracteres em 197 px → 22 px) |

## Instruções
1. `globals.css`: em `@theme`, acrescentar `--text-section: 28px;` e `--text-featured: 22px;` (depois de `--text-logo`); em `@theme inline`, acrescentar `--radius-panel: 1.5rem;` e `--radius-card: 1.25rem;` ao lado de `--radius-mobile` e `--radius-media`.
2. `utils.ts`: acrescentar `'section'` e `'featured'` à lista de `font-size` e `'panel'` e `'card'` à lista de `rounded`. Não mudar mais nada.
3. Fechamento: `npx prettier --write src/styles/globals.css src/lib/utils.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/styles/globals.css src/lib/utils.ts` e `git commit -m "06-001: tokens da Início"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; os tokens antigos continuam como estavam.
- [ ] `cn('rounded-panel text-section text-foreground', 'p-4')` mantém as três classes (os tokens novos têm grupo próprio e não se confundem com cor nem com espaçamento); duas classes do **mesmo** grupo (`rounded-panel rounded-card`, `text-section text-featured`) ficam só com a última, como o `twMerge` faz (testar num probe **não commitado**).
- [ ] Sem cor hexadecimal nova.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0; `tests/e2e/tokens.spec.ts` continua verde.

# 06-053 — Hook `useCatalogFocus` (rolagem, foco e anúncios do catálogo)

**Status:** concluído
**Fluxo / subitem:** Início › 1 e 3 ("EXPLORAR" rola até `#catalogo` e foca o título; trocar de página rola ao topo do catálogo e foca o título; "Carregar mais" foca o primeiro card novo e anuncia o total)
**Depende de:** 03-010, 04-012

## Objetivo
Concentrar a rolagem, o foco e os anúncios do catálogo: um lugar só decide para onde vai o foco depois de cada ação.

## Arquivos
- criar: `src/hooks/useCatalogFocus.ts`

## Referências
- docs/fluxos/inicio.md (subitens 1 e 3) e docs/qualidade/acessibilidade.md (foco controlado; `aria-live` `polite`; `prefers-reduced-motion`)
- `src/hooks/useRouteFocus.ts` (a cada troca de **caminho** o foco vai ao `h1` dentro de um `requestAnimationFrame`: **este hook precisa vencer essa corrida**), `src/contexts/liveAnnouncer.ts` (`useLiveAnnouncer`), `src/hooks/useMediaQuery.ts`

## Instruções
1. `useCatalogFocus(state: { ready: boolean; items?: readonly NftSummary[]; total?: number; page: number; totalPages?: number })` devolve `{ titleRef, gridRef, focusCatalog, markPageChange, markLoadMore }`. `titleRef: RefObject<HTMLHeadingElement | null>` (do título do catálogo, com `tabIndex={-1}`) e `gridRef: RefObject<HTMLUListElement | null>`.
2. `focusCatalog()`: `titleRef.current?.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' })` e `focus({ preventScroll: true })` (`reduced` = `prefers-reduced-motion: reduce`).
3. **Hash `#catalogo`:** `router.subscribe('onResolved', ({ toLocation }) => { if (toLocation.hash === 'catalogo') <dois requestAnimationFrame em sequência> focusCatalog() })` (o segundo quadro vem **depois** do foco no `h1` do `useRouteFocus`); e, na montagem, se `window.location.hash === '#catalogo'`, o mesmo. Desinscrever no cleanup.
4. **Troca de página (desktop):** `markPageChange()` guarda um sinal `{ kind: 'page' }` e já chama `focusCatalog()`. Quando `state.ready` for verdadeiro e o sinal existir: `announce('Página ' + page + ' de ' + totalPages)` (polite) e limpar o sinal.
5. **"Carregar mais" (mobile):** `markLoadMore(previousCount: number)` guarda `{ kind: 'more', previousCount }`. Quando `ready` e `items.length > previousCount`: `gridRef.current.querySelectorAll('[data-nft-card-link]')[previousCount]` recebe `focus()` (o primeiro card **novo**), `announce('Mostrando ' + items.length + ' de ' + total + ' NFTs')` e o sinal é limpo. Se não existir o elemento, não faz nada.
6. Nada de `setTimeout` solto sem cleanup. Export nomeado. **Regra `react-hooks/refs`:** o sinal (`{ kind: 'page' }` / `{ kind: 'more', previousCount }`) fica numa `ref` escrita **só** em `markPageChange`/`markLoadMore` (handlers) e lida **só** dentro de um `useEffect` (deps `state.ready`, `state.items`, etc.); `titleRef.current`/`gridRef.current` também só em handlers e efeitos. Nenhum `setState` nesse efeito. Quem consome o hook **desestrutura** (`const { titleRef } = useCatalogFocus(...)`) ou passa `titleRef`/`gridRef` como prop: `ref={page.titleRef}` direto num elemento, por membro do objeto devolvido pelo hook, é bloqueado pelo lint.
7. Fechamento: `npx prettier --write src/hooks/useCatalogFocus.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/hooks/useCatalogFocus.ts` e `git commit -m "06-053: hook useCatalogFocus"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; chegar por `/?q=ape#catalogo` (de outra página) deixa o foco no título do catálogo, não no `h1`.
- [ ] Trocar de página: a tela sobe ao topo do catálogo, o foco vai ao título e o leitor ouve "Página 2 de 32".
- [ ] "Carregar mais": o foco vai ao primeiro card novo e o leitor ouve "Mostrando 18 de 283 NFTs".
- [ ] Com `prefers-reduced-motion`, a rolagem é instantânea.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Coberto no 06-061 e 06-066.

# 06-045 — `SearchInput`: variante barra (mobile, com debounce)

**Status:** pendente
**Fluxo / subitem:** Início › 7 (mobile: barra "Explorar coleções" com debounce de 300 ms, atualizando `?q=`)
**Depende de:** 04-020, 06-021
**Depende de decisão:** pergunta 14 do relatório da fase 06 (ícone da barra)

## Objetivo
Acrescentar ao `SearchInput` a variante `bar`: a barra de busca sempre aberta do topo da Início no mobile.

## Arquivos
- alterar: `src/components/shared/SearchInput.tsx`

## Referências
- docs/design/componentes.md (`SearchInput`: "IN m (barra 'Explorar coleções'), Header d (campo que expande a partir da lupa) — com debounce no mobile; Enter no desktop") e docs/fluxos/inicio.md (subitem 7)
- Captura 1:1 `mobile-inicio.png`: barra **313×45 px** (x 24–336, y 40–84), `bg-card`, raio 12 (`rounded-mobile`), ícone de lupa (SVG `search`, 22 px, cor `tan`) com 16 px de recuo, placeholder "Explorar coleções" 14 px **negrito** em `tan`; o botão de filtros (06-044) fica ao lado, 9 px de distância
- `src/components/shared/SearchInput.tsx` (variante atual, **não mudar** o comportamento dela), `src/hooks/useDebounce.ts`, `src/components/shared/authStyles.ts` (campo mobile sem borda, como referência de classes)

## Instruções
1. Acrescentar a prop `variant?: 'expandable' | 'bar'` (padrão `expandable`; **o Header continua igual**). Quando `bar`, retornar cedo (antes de qualquer estado da variante expansível) um `form role="search"` próprio, num componente interno `SearchBar` no mesmo arquivo, sem mexer nos hooks do componente atual (os hooks da variante expansível ficam num componente interno também, para não chamar hooks condicionalmente).
2. `SearchBar`: `form` `flex h-11.25 min-w-0 flex-1 items-center gap-3 rounded-mobile bg-card px-4`; `Label` sr-only "Buscar NFTs e coleções"; `SvgIcon name="search"` (22 px, `text-tan`, `aria-hidden`); `Input` (primitivo) sem borda nem fundo (`border-0 bg-transparent px-0 text-sm font-bold placeholder:text-tan focus-visible:ring-0`, o anel de foco fica no `form` com `focus-within:ring-2 ring-ring`), `type="search"`, `enterKeyHint="search"`, `placeholder="Explorar coleções"`; botão de limpar (`SvgIcon name="x"`, `aria-label="Limpar busca"`) só com texto.
3. **Debounce:** estado local `value` (inicial `initialQuery`); `const debounced = useDebounce(value.trim(), 300)`; `const sent = useRef(initialQuery)` (**só lida e escrita em efeitos e handlers, nunca no render**). Dois efeitos, nesta ordem: (a) `useEffect(() => { sent.current = initialQuery }, [initialQuery])`; (b) `useEffect(() => { if (debounced !== sent.current) { sent.current = debounced; onSearch(debounced) } }, [debounced, onSearch])` (o primeiro render e valores iguais **não** disparam). Enter (submit) chama `onSearch(value.trim())` **na hora** e faz `sent.current = value.trim()`. "Limpar" zera o campo e chama `onSearch('')` na hora (`sent.current = ''`), mantendo o foco no campo.
4. **Sincronia com a URL** (Voltar do navegador, "Limpar filtros"), **sem `useEffect` que chama `setState`** (`react-hooks/set-state-in-effect`) e sem ler `ref` no render: padrão "ajustar state quando a prop muda" (react.dev). `const [seen, setSeen] = useState(initialQuery)` e, **no corpo do componente**: `if (initialQuery !== seen) { setSeen(initialQuery); if (value.trim() === debounced) setValue(initialQuery) }` (sem mudança pendente = o que está no campo já foi enviado; com mudança pendente o texto digitado vence). Não usar `key={initialQuery}` no chamador (remontaria o campo e perderia o foco a cada tecla).
5. Fechamento: `npx prettier --write src/components/shared/SearchInput.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/shared/SearchInput.tsx` e `git commit -m "06-045: SearchInput variante barra"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`, sem `eslint-disable`; sem cor hexadecimal, `oklch()` ou `rgb()`.
- [ ] O Header (variante expansível) **não mudou**: `layout.spec.ts` item 4 continua verde.
- [ ] Digitar "ap", "ape" rápido gera **uma** chamada `onSearch('ape')` depois de 300 ms; Enter dispara na hora; limpar chama `onSearch('')`.
- [ ] A barra mede 45 px de altura e se estica até o botão de filtros (como na captura); em 320 px não estoura.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0; `npm run test:e2e -- layout` (item 4) verde. Probe **não commitado** em 414×896; comparado com a captura. Coberto no 06-062.

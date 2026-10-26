# 04-020 — SearchInput (campo que expande a partir da lupa)

**Status:** pendente (**comportamento aberto aguarda a pergunta 7 do relatório da fase 04**)
**Fluxo / subitem:** Fase 04 › Header (busca)
**Depende de:** 04-003, 04-010

## Objetivo
Criar a variante desktop do `SearchInput`: um botão de lupa que expande um campo de busca no cabeçalho; Enter leva a `/?q=`. A variante mobile (barra "Explorar coleções" com debounce) é da fase 06.

## Arquivos
- criar: `src/components/shared/SearchInput.tsx`

## Referências
- docs/design/componentes.md (`SearchInput`: Header d, campo que expande) e docs/decisoes.md (Fluxo Início: campo que expande no cabeçalho, levando a `/?q=`)
- docs/qualidade/acessibilidade.md (botão só de ícone com `aria-label`, foco, Esc)
- Capturas: desktop-perfil.png (lupa de 22 px em `foreground`, `x` ≈ 1113–1135). **O campo aberto não foi desenhado**: segue o padrão do campo de cupom do Carrinho (fundo `background`, borda `border` de 1 px, borda `primary` em foco).

## Instruções
1. Props: `onSearch: (query: string) => void`, `initialQuery?: string` (valor ao abrir; o `AppShell` passa o `q` da URL), `onOpenChange?: (open: boolean) => void` (o `Header` esconde o menu enquanto o campo está aberto), `className?`. Neste bloco só existe a variante expansível; **não** criar prop `variant` ainda.
2. **Fechado:** `button type="button"` de 32 px (`size-8`) com `SearchIcon` do lucide (22 px, `text-foreground`), `aria-label="Abrir busca"`, `aria-expanded="false"`, `aria-controls` apontando para o formulário (`useId`).
3. **Aberto:** o mesmo botão passa a ser o de enviar (`type="submit"`, `aria-label="Buscar"`, `aria-expanded="true"`), e ao lado dele, à esquerda, aparece o `form role="search"` com:
   - `label` só para leitor de tela: "Buscar NFTs e coleções";
   - `Input` (primitivo) de 280 px de largura, altura 36 px (`h-9`), `type="text"` e `enterKeyHint="search"`, com placeholder "Buscar NFTs e coleções" e foco automático ao abrir;
   - botão de limpar/fechar com o ícone `x` (`SvgIcon name="x"`, `text-primary`) dentro do campo, à direita, `aria-label="Fechar busca"`.
   O campo é posicionado de forma **absoluta** à esquerda da lupa (`absolute right-full mr-2`) e **não empurra** os outros itens do cabeçalho; a largura anima de 0 a 280 px em 200 ms, sem animação com `prefers-reduced-motion`.
4. **Comportamento:** Enter ou clique em "Buscar" com texto (após `trim`) chama `onSearch(texto)` e fecha; com campo vazio só mantém o foco no campo. Esc fecha e devolve o foco à lupa. Perder o foco para fora do conjunto com o campo vazio também fecha. Reabrir mostra `initialQuery`.
5. Chamar `onOpenChange` a cada abrir/fechar.
6. Fechamento: `npx prettier --write src/components/shared/SearchInput.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/shared/SearchInput.tsx` e `git commit -m "04-020: SearchInput expansível"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; export nomeado `SearchInput`.
- [ ] Tudo por teclado: Tab chega à lupa, Enter/Espaço abre, o foco vai ao campo, Esc fecha e o foco volta à lupa.
- [ ] `aria-expanded` sempre coerente; `form role="search"` com label.
- [ ] Abrir o campo não desloca nenhum item do cabeçalho.
- [ ] Sem cor hexadecimal, `oklch()` ou `rgb()`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Probe **não commitado** em 1440×900: fechado, aberto, com texto; captura da lupa comparada a `desktop-perfil.png`; Esc, Enter e perda de foco; com `prefers-reduced-motion` a largura muda sem transição. Teste automatizado no 04-033.

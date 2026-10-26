# 06-004 — `formatEth` e opções do catálogo

**Status:** pendente
**Fluxo / subitem:** Início › 4, 5 (rótulos de aba e ordenação) e preços
**Depende de:** 06-003
**Depende de decisão:** pergunta 9 do relatório da fase 06 (ponto decimal como no Figma)

## Objetivo
Criar o formatador de ETH (só troca separador e acrescenta "ETH"), as listas de abas e ordenações com os rótulos em PT-BR e a conversão do `query` do `Promo` (valores da API) para a busca da Início.

## Arquivos
- criar: `src/lib/formatEth.ts`
- criar: `src/lib/catalogOptions.ts`

## Referências
- docs/arquitetura/estado.md (Valores: "`formatEth` só troca separadores e adiciona 'ETH', sem converter para `number`") e docs/qualidade/acessibilidade.md (valores em ETH lidos corretamente)
- docs/fluxos/inicio.md (subitens 4, 5 e 10) e docs/api-mock/contratos.md (`Promo.query`, valores de `tab` e `sort`)

## Instruções
1. `formatEth.ts`: `formatEth(value: string, separator: '.' | ',' = '.'): string` → `"1.19 ETH"` (ponto, como nos cards do Figma) ou `"1,19 ETH"`. Valida com `^\d+(\.\d+)?$`; valor inválido → devolve o texto recebido + " ETH" sem lançar. `formatEthSpoken(value: string): string` → `"1,19 ETH"` (vírgula, para `aria-label` e anúncios). **Sem `parseFloat`, `Number` nem conta**: só `replace`.
2. `catalogOptions.ts` (constantes e funções puras):
   - `CATALOG_TABS: { value: CatalogTab; label: string }[]` = `todos` "Todos os NFTs", `novos` "Novos lançamentos", `em-alta` "Em alta";
   - `CATALOG_SORTS: { value: CatalogSort; label: string }[]` = `recentes` "Listados recentemente", `menor-preco` "Menor preço", `maior-preco` "Maior preço", `mais-avaliados` "Mais bem avaliados", `mais-favoritados` "Mais favoritados";
   - `DEFAULT_TAB = 'todos'`, `DEFAULT_SORT = 'recentes'`, `DESKTOP_PAGE_SIZE = 9`;
   - `promoToSearch(query: Promo['query']): HomeSearch`: `tab` `new` → `aba: 'novos'`, `trending` → `'em-alta'`, `all` → `undefined`; `sort` `recent|price_asc|price_desc|top_rated|most_favorited` → o valor PT-BR correspondente; `collection` → `colecao`; `network` → `rede`; o resto `undefined`.
3. Fechamento: `npx prettier --write` nos 2 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/lib/formatEth.ts src/lib/catalogOptions.ts` e `git commit -m "06-004: formatEth e opções do catálogo"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; nenhum `number` em `formatEth`.
- [ ] `formatEth('1.19')` → `1.19 ETH`; `formatEth('1.19', ',')` → `1,19 ETH`; `promoToSearch({ tab: 'new' })` → `{ aba: 'novos', … }` com as demais chaves `undefined`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Coberto indiretamente nos testes dos cards (06-063) e dos promos (06-061).

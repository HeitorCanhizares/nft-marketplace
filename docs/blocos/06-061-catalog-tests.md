# 06-061 — Testes do catálogo: URL, API, filtros, páginas e histórico

**Status:** pendente
**Responsável:** Sonnet (o Haiku não escreve testes)
**Fluxo / subitem:** Início › 3 a 6 e 10 (catálogo, abas, ordenação, filtros, promos)
**Depende de:** 06-057, 06-059

## Objetivo
Provar que o estado da Início vive na URL e chega certo à API: filtros, filtros combinados, abas, ordenação, páginas, volta à página 1, "Carregar mais", refresh e histórico.

## Arquivos
- criar: `tests/e2e/home-catalog.spec.ts`

## Referências
- docs/qualidade/testes.md (Início: "filtrar, buscar, ordenar, paginar e conferir a URL **e os parâmetros enviados à API**; filtros combinados; mudar filtro volta à página 1; refresh e voltar/avançar do navegador restauram o estado") e docs/arquitetura/rotas.md (tabela de parâmetros)
- `tests/e2e/helpers.ts` (`recordApi(page, '/api/nfts')`, `ready`, `collectAnnouncements`, `announcements`); `window.__kurio.queryClient` (ler as listas do cache) e `window.__kurioMock.stores.nftsStore` (calcular o esperado a partir do banco); `window.__kurio.catalog.validateHomeSearch` (item 13)

## Instruções
O Sonnet escreve. **[d]** só no `desktop`, **[m]** só no `mobile`. Conferir a URL por `new URL(page.url()).searchParams` (a **ordem** dos parâmetros não importa).
1. **[d] Estado inicial:** `/` faz `GET /api/nfts` com **exatamente** `page=1&pageSize=9` (sem `tab`, `sort`); 9 cards na ordem "Emerald Ape #042", "Sage Nomad #009", "Neon Vessel #552"…; aba "Todos os NFTs" selecionada (`aria-selected`); ordenação "Listados recentemente"; "Coleções" com as 9 coleções **na ordem do Figma** e contagens 39, 14, 77, 46, 27, 20, 23, 16, 21; "Rede" 119, 78, 86; "Preço: x,xx - y,yy ETH" com os limites do `facets.priceRange` (vírgula).
2. **[d] Coleção e rede:** clicar "Música" → URL `?colecao=musica`, requisição `collection=musica&page=1`, `aria-pressed` verdadeiro, a paginação vai até 9; clicar "Música" de novo remove o filtro (URL volta a `/`, requisição sem `collection`). "Solana" → `?rede=solana` / `network=solana`. **Uma opção por grupo:** escolher "Fotografia" com "Música" ativa **troca** (só uma ativa). As contagens do **outro** grupo mudam (com Solana, as coleções somam 86; as redes não mudam).
3. **[d] Preço só no "Aplicar":** com as setas nos cursores "Preço mínimo"/"Preço máximo" o texto muda e **nenhuma** requisição nem mudança de URL acontece; "Aplicar" → URL `?precoMin=…&precoMax=…` (2 casas) e requisição `minPrice`/`maxPrice` com 2 casas; todos os preços dos cards ficam dentro da faixa (lidos do banco).
4. **[d] Filtros combinados:** aba "Novos lançamentos" + coleção + rede + faixa + ordem "Menor preço" → URL com **todos** (`aba=novos`, `colecao`, `rede`, `precoMin`, `precoMax`, `ordem=menor-preco`) e requisição com `tab=new`, `collection`, `network`, `minPrice`, `maxPrice`, `sort=price_asc`; os cards mostrados = a interseção calculada sobre o banco (mesmos nomes e ordem).
5. **[d] Volta à página 1:** ir à página 3 (`?pagina=3`); trocar **coleção**, **rede**, **aba**, **ordem**, aplicar **preço** e fazer **busca** — em cada caso a URL perde `pagina` e a requisição leva `page=1`. Trocar de página mantém os filtros.
6. **[d] Paginação:** "2" → URL `?pagina=2`, requisição `page=2&pageSize=9`; a janela rola ao topo do catálogo e o foco vai ao título; o anúncio "Página 2 de 32" aparece em `getByRole('status')`; só a atual tem `aria-current="page"`; "Anterior" só existe a partir da página 2 e "Próxima" some na última; os links têm `href` real (`/?pagina=3`); Ctrl+clique abre em outra aba sem trocar a página atual.
7. **[d] Abas:** "Novos lançamentos" → `?aba=novos`, `tab=new`; "Em alta" → `?aba=em-alta`, `tab=trending`; "Todos os NFTs" → URL sem `aba`. A ordem escolhida **continua** ao trocar de aba. Teclado: setas movem o foco entre as abas **sem** ativar; Enter ativa.
8. **[d] Ordenação:** cada uma das 5 opções → `?ordem=<valor>` e `sort=<valor da API>` (`menor-preco`/`price_asc`, `maior-preco`/`price_desc`, `mais-avaliados`/`top_rated`, `mais-favoritados`/`most_favorited`); "Listados recentemente" **não** aparece na URL nem na API; "Menor preço" mostra os preços em ordem crescente (lidos do texto dos cards).
9. **[d] Refresh e histórico:** com coleção + rede + ordem + página 2 aplicadas, recarregar mantém a URL, a seleção dos filtros, a aba, a ordem e os mesmos 9 cards; Voltar desfaz uma mudança por vez (a sequência de URLs é a inversa da aplicada) e Avançar refaz; abrir a URL pronta (`/?colecao=musica&rede=solana&pagina=2`) mostra o mesmo estado.
10. **[d] URL inválida:** `/?pagina=abc&aba=x&rede=bitcoin&precoMin=9&precoMax=1&ordem=y` abre a Início padrão e a requisição não leva nenhum desses parâmetros; `/?pagina=999` termina em `?pagina=32` (com `replace`: Voltar não volta a 999).
11. **[d] "Limpar filtros":** só aparece com filtro ativo (coleção, rede, preço ou busca); ao clicar, remove-os e **mantém** `aba` e `ordem`.
12. **[d] Promos:** "Explorar" do 1º promo → `/?aba=novos#catalogo` (`tab=new`); do 2º → `/?colecao=arte-digital#catalogo` ("Arte digital" ativa); o foco vai ao título do catálogo. O blog tem 4 posts; "Ler mais" é `aria-disabled`, mostra "Em breve" no foco e clicar não navega.
13. **Validação (via `window.__kurio.catalog.validateHomeSearch`):** as 9 chaves sempre presentes; `{ pagina: '2', aba: 'novos', q: 123 }` → `pagina: 2`, `aba: 'novos'`, `q: '123'`; `{ aba: 'todos', ordem: 'recentes', pagina: 1 }` → as três `undefined`; `{ precoMin: 5, precoMax: 1 }` → as duas `undefined`; `{ q: 'x'.repeat(101) }` → `undefined`; `{ favoritos: '1' }` → `1`.
14. **[m] "Carregar mais":** `/` mostra 9 cards e "Carregar mais"; clicar → URL `?pagina=2` **sem criar entrada no histórico** (`history.length` igual), requisição `page=1&pageSize=18`, 18 cards, o foco no 10º card, anúncio "Mostrando 18 de 283 NFTs"; recarregar mantém 18 cards; `/?pagina=32` mostra os 283 e **sem** o botão. Trocar um filtro volta para 9 cards (`pagina` some).
15. **[m] Drawer de filtros:** "Filtros" abre o drawer com "Ordenar por", Coleções, Faixa de preço e Rede; escolher uma coleção **atualiza a URL e a grade atrás na hora**; o texto "Ver N resultados" mostra o total (77 com Música); a ordenação do drawer muda `?ordem=`; "Aplicar" do preço funciona como no desktop; "Limpar filtros" remove os filtros e não fecha; "Ver N resultados" e Esc fecham, e o foco volta ao botão "Filtros".
16. **[m] O que o mobile não tem:** sem barra lateral de filtros, sem destaque, sem promos, sem blog; a barra inferior está presente e "Início" tem `aria-current`.
17. **Troca de largura:** com `?pagina=2`, o desktop (1440) mostra os itens 10 a 18; reduzir para 1023 px mostra os itens 1 a 18 (mobile, acumulado) e voltar a 1024 px mostra de novo só a página 2.
Fechamento: `npm run lint && npm run format:check && npm run typecheck` → exit 0. Commit: `git add tests/e2e/home-catalog.spec.ts` e `git commit -m "06-061: testes do catálogo"`.

## Critérios de aceite
- [ ] Passa nos projetos `desktop` e `mobile` (itens [d]/[m] no projeto certo), duas execuções seguidas.
- [ ] O esperado vem do banco (`nftsStore`) ou do que o teste aplicou; só os números do seed (283, 39, 77, 119/78/86, 32 páginas) são fixos.
- [ ] Nenhum `data-testid` nem seletor CSS (exceção justificada em comentário).

## Verificação (Sonnet)
- `npm run test:e2e -- home-catalog` verde; `npm run lint && npm run format:check && npm run typecheck && npm run build` → exit 0.

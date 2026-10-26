# 06-064 — Testes dos estados: carregando, vazio, falha de rede e respostas fora de ordem

**Status:** pendente
**Responsável:** Sonnet (o Haiku não escreve testes)
**Fluxo / subitem:** Início › 12 (estados) e 7 (requisições antigas canceladas)
**Depende de:** 06-057, 06-059

## Objetivo
Provar os cenários de `docs/api-mock/cenarios.md` na Início: `empty-catalog`, `slow`, `jitter`, `offline`, `server-error`/`unavailable`, e que o resultado final corresponde sempre ao **último** filtro escolhido.

## Arquivos
- criar: `tests/e2e/home-states.spec.ts`

## Referências
- docs/api-mock/cenarios.md (Resultado vazio; Latência variável e fora de ordem; Falha de conexão; 4xx/5xx) e docs/qualidade/testes.md ("catálogo vazio; erro de rede com 'Tentar novamente'; respostas fora de ordem mostram o último filtro")
- `tests/e2e/helpers.ts` (`openApp(page, scenarios)`, `delayRoute`, `recordApi`, `useHandler`); o cenário também pode ser trocado com a página aberta (`localStorage['kurio:mock:scenarios']`)

## Instruções
O Sonnet escreve. Testes sem marca rodam nos dois projetos.
1. **Carregando (`slow`):** a Início mostra o esqueleto: `status` "Carregando NFTs…" com 9 cards de esqueleto (**6** no mobile), "Carregando filtros…" e "Carregando destaques…" **[d]**; depois da resposta somem e os dados aparecem; nenhum `h1` duplicado; sem texto "undefined".
2. **Grade anterior esmaecida:** com `delayRoute` de 1500 ms em `collection=musica`, clicar "Música" **[d]** (ou escolher no drawer **[m]**): a grade **antiga** continua visível com `aria-busy="true"` até a nova chegar; depois a nova substitui; a URL já mudou no clique.
3. **Catálogo vazio por cenário (`empty-catalog`):** `EmptyState` "Nenhum NFT encontrado"; **sem** "Limpar filtros" (não há filtro); hero, promos, blog e destaque continuam; as opções de filtro mostram contagem `(0)` e `aria-disabled`; faixa de preço desabilitada. Abrindo `/?colecao=musica` com o mesmo cenário: aparece "Limpar filtros" e, ao clicar, a URL vira `/`.
4. **Vazio por busca:** `/?q=zzzz` → o mesmo `EmptyState` com "Limpar filtros"; o `axe` não acusa violação grave.
5. **Falha de rede (`offline`):** `ErrorState` do catálogo "Não foi possível carregar os NFTs" com "Tentar novamente" (as abas continuam visíveis) **e**, ao mesmo tempo, o `ErrorState` do hero; "Tentar novamente" com o cenário ainda ativo mostra "Tentando novamente…" (`aria-busy`) e volta ao erro; depois de remover o cenário (`localStorage`), clicar traz a grade (e o hero). (O Query tenta 2 vezes antes de falhar: dar `timeout` de 15 s.)
6. **Erro por rota:** `server-error:GET /nfts` → só o catálogo em erro (hero, promos e blog visíveis); `server-error:GET /home` → só o hero/destaque/promos/blog em erro e o catálogo normal; `unavailable:GET /nfts` (503) → o mesmo `ErrorState`; erros **4xx não** são tentados de novo (uma só requisição).
7. **Resposta fora do contrato:** com `useHandler` devolvendo `{ items: 'x' }` em `GET /api/nfts`, a área do catálogo mostra o `ErrorState` (não fica em branco nem lança para a tela de erro da página).
8. **Respostas fora de ordem (determinístico):** com `delayRoute` atrasando 2000 ms só `collection=musica` e 0 ms `collection=fotografia`: clicar "Música" e logo "Fotografia" **[d]** (ou nos dois pelo drawer **[m]**) → depois de 3 s a URL é `?colecao=fotografia`, o filtro ativo é "Fotografia" e os cards são os de Fotografia (conferir com o banco); a resposta de "Música" que chegou depois **nunca** aparece. Repetir para **aba** (`novos` atrasada, depois `em-alta`), **ordem**, **página** (`pagina=2` atrasada, depois `pagina=3`) e **busca** (06-062 item 9).
9. **Fora de ordem aleatório (`jitter`):** com o cenário `jitter` (0–3 s), repetir 6 vezes: clicar duas coleções diferentes em sequência rápida; ao fim de cada rodada a grade é a da **última** escolhida.
10. **Cancelamento:** a requisição antiga é abortada (o teste confirma com `AbortController`: em `delayRoute`, o `request.signal.aborted` do 1º pedido vira `true` quando o 2º começa; se o MSW não expuser isso, **registrar no relatório** em vez de enfraquecer).
11. **Recuperação:** depois de um erro, trocar o filtro e/ou remover o cenário e voltar a uma lista saudável não deixa estado de erro preso.
Fechamento: `npm run lint && npm run format:check && npm run typecheck` → exit 0. Commit: `git add tests/e2e/home-states.spec.ts` e `git commit -m "06-064: testes dos estados"`.

## Critérios de aceite
- [ ] Passa nos projetos `desktop` e `mobile`, duas execuções seguidas (o item 9 não pode ser instável: a asserção é sobre o resultado final).
- [ ] Nenhum `data-testid` nem seletor CSS (exceção justificada em comentário).

## Verificação (Sonnet)
- `npm run test:e2e -- home-states` verde; `npm run lint && npm run format:check && npm run typecheck && npm run build` → exit 0.

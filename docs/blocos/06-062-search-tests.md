# 06-062 — Testes da busca (desktop e mobile)

**Status:** pendente
**Responsável:** Sonnet (o Haiku não escreve testes)
**Fluxo / subitem:** Início › 7 (busca)
**Depende de:** 06-057, 06-059, 06-045

## Objetivo
Provar a busca do cabeçalho (desktop, leva a `/?q=…#catalogo`) e a barra com debounce (mobile), o estado sem resultados e a sincronia com a URL.

## Arquivos
- criar: `tests/e2e/home-search.spec.ts`

## Referências
- docs/fluxos/inicio.md (subitem 7) e docs/blocos/04-020 (busca expansível do cabeçalho)
- `tests/e2e/helpers.ts` (`recordApi`, `delayRoute`), `tests/e2e/layout.spec.ts` item 4 (a busca do cabeçalho já tem teste de teclado; **aqui** só o efeito na Início)

## Instruções
O Sonnet escreve. **[d]** só no `desktop`, **[m]** só no `mobile`.
1. **[d] Do cabeçalho:** em `/`, "Abrir busca" → digitar "ape" + Enter → URL `/?q=ape#catalogo`, requisição `q=ape&page=1`; todos os cards mostrados têm "ape" no nome, na coleção ou nos atributos (conferir pelo banco); o foco vai ao título "Catálogo de NFTs". Reabrir a busca mostra "ape". O mesmo, partindo de `/carrinho` e de `/nft/emerald-ape-042`: termina em `/?q=ape#catalogo`.
2. **[d] Texto livre:** "musica" (sem acento) acha a coleção "Música"; "#0042" e "0042" acham o NFT `#0042`; `q` com maiúsculas/minúsculas iguais; espaços nas pontas são ignorados (`?q=ape` e não `?q=%20ape%20`); `/?q=123` mostra "123" no campo ao reabrir.
3. **[d] Sem resultados:** "zzzz" → `EmptyState` "Nenhum NFT encontrado" ("Tente mudar os filtros ou a busca.") com "Limpar filtros"; o hero, os promos e o blog continuam; clicar em "Limpar filtros" tira o `q` da URL e traz os 9 cards.
4. **[d] Combina com filtros:** com coleção "Música" ativa, buscar "ape" mantém `colecao` e volta `pagina` a 1; "Limpar filtros" remove os dois.
5. **[m] Debounce:** digitar "ape" letra a letra (`pressSequentially` com 50 ms entre as teclas) gera **uma** requisição com `q=ape` e **nenhuma** com `q=a` nem `q=ap`; a requisição sai entre 300 ms e 900 ms depois da última tecla; a URL vira `?q=ape` **sem criar entrada no histórico** (`history.length` igual).
6. **[m] Enter e limpar:** Enter envia **na hora** (a requisição sai em menos de 250 ms, sem esperar o debounce); o botão "Limpar busca" apaga o texto, remove `q` e mantém o foco no campo; apagar à mão também remove `q` depois do debounce.
7. **[m] Sincronia com a URL:** abrir `/?q=ape` mostra "ape" na barra; "Limpar filtros" do estado vazio limpa a barra; Voltar/Avançar do navegador atualizam o texto da barra; digitar depois de uma página 3 (`?pagina=3`) volta a `pagina` 1.
8. **[m] Estado vazio:** "zzzz" → `EmptyState` com "Limpar filtros"; a barra continua com o texto.
9. **Respostas fora de ordem (busca):** com `delayRoute` atrasando 2000 ms a requisição de `q=ap` e nenhum atraso para `q=ape`, digitar "ap", esperar o debounce e logo "e": depois de 3 s a grade corresponde a "ape" (e o campo mostra "ape"); a resposta antiga nunca troca a grade.
10. **Acessibilidade:** a barra tem rótulo "Buscar NFTs e coleções" (`getByRole('search')`), o campo é alcançável por Tab; o axe não acusa violação grave com a barra e com a busca do cabeçalho abertas.
Fechamento: `npm run lint && npm run format:check && npm run typecheck` → exit 0. Commit: `git add tests/e2e/home-search.spec.ts` e `git commit -m "06-062: testes da busca"`.

## Critérios de aceite
- [ ] Passa nos projetos `desktop` e `mobile` (itens [d]/[m] no projeto certo), duas execuções seguidas.
- [ ] Nenhum `data-testid` nem seletor CSS (exceção justificada em comentário).

## Verificação (Sonnet)
- `npm run test:e2e -- home-search` verde; `npm run lint && npm run format:check && npm run typecheck && npm run build` → exit 0.

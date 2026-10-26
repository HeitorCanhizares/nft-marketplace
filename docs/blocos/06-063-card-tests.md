# 06-063 — Testes do card: abrir, carrinho, favoritar e favoritos

**Status:** pendente
**Responsável:** Sonnet (o Haiku não escreve testes)
**Fluxo / subitem:** Início › 8 (card) e 9 (filtro de favoritos)
**Depende de:** 06-057, 06-059, 06-026, 06-069, 06-070, 06-071

## Objetivo
Provar o card (abrir o detalhe, ações no hover e no foco, selos), adicionar ao carrinho, favoritar (otimista, com login e volta, com erro) e a Início filtrada pelos favoritos.

## Arquivos
- criar: `tests/e2e/home-cards.spec.ts`

## Referências
- docs/fluxos/inicio.md (subitens 8 e 9), docs/api-mock/contratos.md (Favoritos; Carrinho) e docs/blocos/05-045 (ação pendente)
- `tests/e2e/fixtures.ts` (`users.primary` = "teste", **já tem 12 favoritos**; `users.other` = "outro", **0 favoritos**), `tests/e2e/helpers.ts` (`recordApi`, `delayRoute`, `openApp`), `window.__kurioMock.stores` (`nftsStore`, `cartsStore`, `favoritesStore`)

## Instruções
O Sonnet escreve. **[d]** só no `desktop`, **[m]** só no `mobile`. Login por `window.__kurio.auth.signIn` ou pela tela, como nos testes da fase 05.
1. **Abrir o detalhe:** clicar no nome, na imagem e na área do preço de "Sage Nomad #009" leva a `/nft/sage-nomad-009`; clicar numa ação (carrinho, coração) **não** navega. Cada card tem **um** link principal (o nome).
2. **[d] Ações no hover e no foco:** sem mouse nem foco, a barra de ações tem `opacity` 0; `hover` no card → 1; com Tab: o foco no nome mostra o anel no card inteiro, o Tab seguinte vai ao botão "Adicionar … ao carrinho" e a barra fica visível (`opacity` 1); a ordem é carrinho, "Favoritar …", "Ver …"; "Ver" abre o detalhe.
3. **[m] Só o coração:** o card tem o botão "Favoritar …" sempre visível no canto e **não** tem botão de carrinho nem barra de ações.
4. **Selos e preço:** "Neon Vessel #552" mostra "RARO" e "1.99 ETH" com "2.29 ETH" riscado (`<s>`); os outros mostram só o preço; todos têm `alt` da API.
5. **[d] Carrinho (visitante):** clicar "Adicionar Emerald Ape #042 ao carrinho" → `POST /api/cart/items` com corpo `{ nftId: 'emerald-ape-042', editionId: <id da edição mais barata disponível lida do banco>, quantity: 1 }`, cabeçalho `X-Cart-Id` igual ao `localStorage['kurio:guest-cart-id']` e **sem** `Authorization`; o toast "Emerald Ape #042 adicionado ao carrinho" aparece; o carrinho no banco tem 1 linha; clicar de novo soma (`quantity: 2`).
6. **[d] Carrinho (logado):** com `users.primary`, a requisição leva `Authorization` e **não** `X-Cart-Id`; a linha vai para `cart-user-teste`.
7. **[d] Erros do carrinho:** `server-error:POST /cart/items` → toast "Não foi possível adicionar … ao carrinho. Tente de novo." e nenhuma linha criada; edição com 1 em estoque (ajustada no banco): a 2ª adição mostra "Você já tem o máximo disponível de … no carrinho."; botão não fica preso (volta ao normal).
8. **[d] Esgotado:** NFT sem edição `ABERTA` com todas as edições em 0 (ajustar no banco **antes** de abrir a página): o card mostra o texto "Esgotado", o botão de carrinho vira "Esgotado" com `aria-disabled="true"` e clicar **não** envia requisição.
9. **Favoritar sem login (visitante):** clicar "Favoritar …" num NFT que o usuário "outro" ainda não favoritou → nenhuma chamada à API; URL `/entrar?redirect=<URL atual codificada>` (testar partindo de `/` e de `/?colecao=musica`); `sessionStorage['kurio:pending-action']` guarda `{ type: 'favorite', nftId }`; entrar como `users.other` → volta à URL de origem (com `colecao=musica`), o coração desse NFT está `aria-pressed="true"`, saiu `PUT /api/favorites/<id>` **uma vez**, o toast "Adicionado aos favoritos." aparece e a ação pendente some; recarregar mantém o coração (vem de `isFavorite` da API).
10. **Favoritar logado (otimista):** com `delayRoute` atrasando 1500 ms o `PUT`, o coração fica `aria-pressed="true"` **antes** da resposta; clicar de novo enquanto pendente não envia segunda requisição; toast "… adicionado aos favoritos"; desfavoritar envia `DELETE` e o toast "… removido dos favoritos". **Erro:** `server-error:PUT /favorites/:nftId` → o coração **volta** a `false` e o toast "Não foi possível favoritar …. Tente de novo." aparece; a lista não é reordenada nem refeita (nenhuma nova `GET /api/nfts`).
11. **Favoritos (`/?favoritos=1`), `users.primary`:** título visível "Seus favoritos" (`h2`); 12 cards (9 + página 2 com 3 no desktop; 9 + "Carregar mais" no mobile), todos com coração marcado; a requisição leva `favorites=1` e `Authorization`; **[m]** a aba "Favoritos" da barra tem `aria-current`; desfavoritar um card **mantém** o card na tela (coração desmarcado) e **não** refaz a lista; recarregar mostra 11. Busca e filtros combinam com os favoritos.
12. **Favoritos vazio:** com `users.other` (0 favoritos): `EmptyState` "Você ainda não favoritou nenhum NFT" e o link "Explorar NFTs" leva a `/` (sem `favoritos`).
13. **Anúncios:** os avisos do carrinho e do favorito aparecem no toast (região `aria-live` do Sonner); **sem** frase repetida em `getByRole('status')` do `LiveAnnouncer`.
14. **Contador do carrinho e `GET /cart`:** [d] o cabeçalho **não** tem badge sem itens; adicionar "Emerald Ape #042" duas vezes mostra o badge "2" e o link "Carrinho, 2 itens"; adicionar outro NFT soma 1 unidade (badge "3", **unidades**, não linhas); recarregar mantém o "3" (vem de `GET /api/cart`, com `X-Cart-Id`); entrar como `users.primary` mescla o carrinho do visitante e o badge passa a refletir `cart-user-teste`; sair zera. **[m]** sem badge visual, mas o link da barra inferior tem `aria-label` "Carrinho, N itens". Por `fetch`: `GET /api/cart` com `X-Cart-Id` devolve o que o `POST` gravou (valida em `cartSchema`, sem `ownerId`); logado devolve `cart-user-teste`; sem sessão e sem `X-Cart-Id` → `200` vazio (`guest-empty`); token vencido → `401 SESSION_EXPIRED`; `empty-cart` → vazio; `server-error:GET /cart` → `500` e o cabeçalho continua sem badge e sem quebrar; zerar o estoque de uma edição no banco faz a linha vir `sold_out`.
Fechamento: `npm run lint && npm run format:check && npm run typecheck` → exit 0. Commit: `git add tests/e2e/home-cards.spec.ts` e `git commit -m "06-063: testes dos cards"`.

## Critérios de aceite
- [ ] Passa nos projetos `desktop` e `mobile` (itens [d]/[m] no projeto certo), duas execuções seguidas.
- [ ] Nenhum `data-testid` nem seletor CSS (exceção justificada em comentário).

## Verificação (Sonnet)
- `npm run test:e2e -- home-cards` verde; `npm run lint && npm run format:check && npm run typecheck && npm run build` → exit 0.

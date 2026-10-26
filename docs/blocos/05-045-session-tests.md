# 05-045 — Testes de sessão, expiração, logout, troca de usuário, mescla e ação pendente

**Status:** pendente
**Responsável:** Sonnet (o Haiku não escreve testes)
**Fluxo / subitem:** Login › 4, 5, 6 e 7
**Depende de:** 05-012, 05-036, 05-039, 05-040, 05-041, 05-042

## Objetivo
Provar a sessão (recuperação, renovação, expiração), o logout, a troca de usuário sem vazamento de dados, a mescla do carrinho do visitante com o aviso de ajustes e a ação pendente.

## Arquivos
- criar: `tests/e2e/session.spec.ts`

## Referências
- docs/qualidade/testes.md (Login/Cadastro: sessão recuperada após refresh; logout limpa cache privado; troca de usuário não mostra dados do anterior) e docs/api-mock/cenarios.md (`session-expired`; mescla A1)
- docs/arquitetura/estado.md (`clearPrivateSession`: 5 passos)
- `tests/e2e/app-base.spec.ts` (padrão do relógio controlado com `page.clock`)

## Instruções
O Sonnet escreve; login pela tela ou pela ponte (`window.__kurio.auth.signIn`), conforme o objetivo do teste.
1. **Sessão recuperada:** logar, recarregar → continua logado, sem piscar "Entrar" (observar o cabeçalho durante o `loading`); token inválido/vencido em `kurio:session` → anônimo e o item some do `localStorage`; erro de rede no `GET /auth/session` → anônimo **mantendo** o token.
2. **Aviso 2 min antes:** com `page.clock` e a sessão de 1800 s, avançar até faltar 120 s → aparece `alertdialog` "Sua sessão expira em breve" com "Continuar conectado"; anúncio assertive **uma vez**; o foco **não** muda (digitando num campo, o foco e o texto ficam); antes disso não existe.
3. **Continuar conectado:** clicar → `POST /auth/refresh`, token e `expiresAt` novos em `kurio:session`, o aviso some, o toast "Sessão renovada.", o foco vai ao `main`; com `network-error:POST /auth/refresh` o aviso fica com "Não foi possível renovar agora. Tente novamente." e dá para tentar de novo; com o cenário `session-expired` a renovação cai no fluxo de expiração.
4. **Expiração por tempo:** sem clicar, passar do `expiresAt` → anúncio "Sua sessão expirou.", toast, URL `/entrar?redirect=<página de origem>` (testar em `/carrinho`, `/perfil/dados` e `/`), cabeçalho volta a "Entrar"; entrar de novo leva de volta à página de origem.
5. **`401 SESSION_EXPIRED` por cenário:** logar, gravar o cenário `session-expired` e disparar uma requisição 🔒 (`window.__kurio.auth.refreshSession()`) → mesmo resultado do item 4.
6. **Logout:** "Sair" (menu do cabeçalho, [d]) → URL `/`, anúncio "Você saiu da sua conta" **uma vez**, `kurio:session` removido, `kurio:guest-cart-id` removido (carrinho novo), `kurio:checkout` e `kurio:checkout-draft` removidos, cache privado do Query vazio (`queryClient.getQueryData` de `favorites`, `cart`, `wallets`, `orders`), inscrições do socket encerradas, carteira simulada desconectada.
7. **Troca de usuário:** logar como `users.primary`, plantar no cache e no `sessionStorage` dados do usuário A (chaves `favorites`, `cart`, `kurio:checkout`, `kurio:checkout-draft`), deixar expirar, logar como `users.other` → **nenhum** dado de A (cache e storage vazios) e os dados novos de B; **mesmo** usuário depois de expirar → `kurio:checkout-draft` e `kurio:checkout` **preservados**.
8. **Mescla do carrinho e ajustes:** plantar com `window.__kurioMock.stores.cartsStore` um carrinho de visitante (`kurio:guest-cart-id` no `localStorage`) com um item acima do estoque e outro dentro; logar → toast "Ajustamos o seu carrinho" com a frase "Ajustamos <NFT> (<edição>) de N para M unidades, o estoque disponível." por ajuste (sem ajustes, nenhum toast); o carrinho do usuário (`cart-<id>`) tem as quantidades certas e o do visitante some. O mesmo no **cadastro**.
9. **Ação pendente:** registrar um executor de teste (`pendingAction.registerPendingExecutor('favorite', …)` pela ponte), `savePendingAction({ type: 'favorite', nftId: 'x' })`, ir a `/entrar?redirect=/carrinho`, logar → o executor roda **uma vez**, aparece o toast com a mensagem devolvida, URL `/carrinho`; executor que rejeita → toast de erro e o login **continua válido**; ação com mais de 10 minutos (relógio) é ignorada; sem executor registrado, a ação é descartada sem erro.
10. **Boas-vindas:** coberto no 05-044 (cadastro).
Fechamento: `npm run lint && npm run format:check && npm run typecheck` → exit 0. Commit: `git add tests/e2e/session.spec.ts` e `git commit -m "05-045: testes de sessão e expiração"`.

## Critérios de aceite
- [ ] Todos passam nos projetos `desktop` e `mobile` (itens de cabeçalho só no `desktop`), duas execuções seguidas.
- [ ] Os testes com tempo usam `page.clock`; nenhum `waitForTimeout` fixo.
- [ ] Nenhum `data-testid` nem seletor CSS (exceção justificada em comentário).

## Verificação (Sonnet)
- `npm run test:e2e` → tudo verde; `npm run lint && npm run format:check && npm run typecheck && npm run build` → exit 0.

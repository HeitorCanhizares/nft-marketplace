# 05-046 — Testes das rotas protegidas e do `redirect`

**Status:** concluído
**Responsável:** Sonnet (o Haiku não escreve testes)
**Fluxo / subitem:** Login › 8 e Rotas › Proteção de rotas
**Depende de:** 05-036, 05-037, 05-038, 05-041, 05-042

## Objetivo
Provar que as rotas protegidas mandam o visitante ao login e o devolvem ao ponto de origem, que as rotas só para deslogado respeitam a sessão e que a validação do `redirect` não abre redirecionamento externo.

## Arquivos
- criar: `tests/e2e/protected-routes.spec.ts`

## Referências
- docs/qualidade/testes.md (Rotas protegidas: pagamento, perfil, carteiras, favoritos e pedidos sem login → `/entrar?redirect=`) e docs/arquitetura/rotas.md (Proteção de rotas; armadilha do `validateSearch`)
- `src/lib/redirect.ts`, `src/app/routeGuards.ts`

## Instruções
O Sonnet escreve.
1. **Visitante → login:** para cada uma de `/pagamento`, `/pedido/abc`, `/perfil`, `/perfil/dados`, `/perfil/carteiras` e `/?favoritos=1`, o URL final é `/entrar?redirect=<caminho original codificado>` (conferir o parâmetro **decodificado**); o histórico não guarda a página que redireciona (Voltar não volta a ela).
2. **Volta ao ponto de origem:** logar a partir de cada um desses redirecionamentos leva **exatamente** ao caminho original (com busca e hash quando houver, ex.: `/perfil/dados?x=1`).
3. **Rotas públicas:** `/`, `/?q=a`, `/carrinho`, `/nft/x` e a 404 abrem sem login.
4. **[m] Barra inferior:** deslogado, "Perfil" e "Favoritos" levam ao login com o `redirect` certo (`/perfil` e `/?favoritos=1`); logado, abrem.
5. **Recuperação da sessão:** com `kurio:session` guardado e `GET /auth/session` retido por um handler, abrir `/perfil/dados` **não** redireciona enquanto o estado é `loading` (a tela mostra o esqueleto de carregamento) e abre a página depois da resposta; com a resposta `401`, vai para `/entrar?redirect=%2Fperfil%2Fdados`.
6. **Só deslogado:** logado, `/entrar` e `/cadastro` levam a `/` (ou ao `redirect` válido) **sem** mostrar o formulário.
7. **Validação do `redirect` (via `window.__kurio.redirect`):** aceitos `/carrinho`, `/perfil/dados?x=1#a`, `/?favoritos=1`; rejeitados `//evil.com`, `https://evil.com`, `/\evil.com`, `/a\b`, `javascript:alert(1)`, `/entrar`, `/cadastro?redirect=/x`, string vazia, 3000 caracteres e valores que não são texto. `isProtectedPath` e `closeTarget` conforme os critérios do 05-002. Em `/entrar?redirect=//evil.com`, `router.state.location.search` tem a chave `redirect` **indefinida** (a armadilha do `validateSearch`).
8. **Troca de rota mantém o contexto:** sair da sessão estando em `/perfil/dados` (menu do cabeçalho) vai para `/` (não para o login) — o `useSignOut` navega antes de encerrar.
Fechamento: `npm run lint && npm run format:check && npm run typecheck` → exit 0. Commit: `git add tests/e2e/protected-routes.spec.ts` e `git commit -m "05-046: testes das rotas protegidas"`.

## Critérios de aceite
- [ ] Todos passam nos projetos `desktop` e `mobile` (o item 4 só no `mobile`), duas execuções seguidas.
- [ ] Nenhum `data-testid` nem seletor CSS (exceção justificada em comentário).

## Verificação (Sonnet)
- `npm run test:e2e` → tudo verde; `npm run lint && npm run format:check && npm run typecheck && npm run build` → exit 0.

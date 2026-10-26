# 05-012 — Testes do mock de autenticação

**Status:** pendente
**Responsável:** Sonnet (o Haiku não escreve testes)
**Fluxo / subitem:** Fase 05 › Handlers de auth (Playwright, sem interface)
**Depende de:** 05-004 a 05-011

## Objetivo
Provar os handlers de auth do mock por `fetch` dentro da página, antes de existir qualquer tela: contratos, erros, bloqueio, sessão, renovação, logout, mescla do carrinho e senha só em hash.

## Arquivos
- criar: `tests/e2e/auth-mock.spec.ts`
- alterar (infraestrutura de teste, só o Sonnet): `src/mocks/browser.ts` (expor `money` e `cartMerge` em `window.__kurioMock`, só em `MODE === 'test'`) — **confirmar com o usuário** (mesma ponte já aprovada na fase 02; só amplia)

## Referências
- docs/qualidade/testes.md (Login/Cadastro; um teste por cenário obrigatório; seletores por papel) e docs/api-mock/cenarios.md (Conflito de cadastro, Validação, Sessão expirada, 4xx/5xx)
- `tests/e2e/helpers.ts` (`openApp`), `tests/e2e/fixtures.ts` (`users`), `tests/e2e/mock-base.spec.ts` (padrão `page.evaluate` + `fetch`)

## Instruções
O Sonnet escreve; `fetch('/api/…')` dentro de `page.evaluate`, sem tela. Rodam só no projeto `desktop` (o mock é o mesmo nos dois).
1. **Disponibilidade:** e-mail do seed (também em maiúsculas) → `false`; usuário `teste` e `TESTE` → `false`; livres → `true`; `{ email: 'x' }` e `{}` → `422` com `fields`; `server-error:POST /auth/availability` → `500`; `email-taken` **não** altera o resultado.
2. **Cadastro:** `201` com `user` sem campos de senha e `session` com `expiresAt` ≈ agora + TTL; o registro em `usersStore` tem `passwordHash` e `passwordSalt` e **nenhum** valor igual à senha enviada; e-mail/usuário repetidos (com outras maiúsculas) → `409` com a chave certa em `fields` (e as duas chaves quando ambos); cenários `email-taken` e `username-taken`; `422` por senha sem número, usuário com acento, e-mail inválido; `validation-error:POST /auth/register`; o usuário criado consegue fazer login.
3. **Login:** seed OK (também com e-mail em maiúsculas); senha errada e e-mail inexistente → mesma resposta `401 INVALID_CREDENTIALS`; corpo inválido → `422`; **bloqueio**: 4 × `401`, a 5ª `429` com `details.retryAfterSeconds === 30`, tentativa com senha certa durante o bloqueio também `429`, e com `page.clock` (instalado antes do `goto`) avançando 31 s volta a funcionar; login certo zera o contador.
4. **Sessão:** `GET /auth/session` sem token `401 UNAUTHORIZED`; com token do login `200`; token inventado `401`; sessão vencida (editar `expiresAt` no `sessionsStore`) `401 SESSION_EXPIRED` e o registro some; cenário `session-expired` → `401 SESSION_EXPIRED` em session, refresh e logout; `POST /auth/refresh` devolve token novo, o antigo passa a dar `401`; `POST /auth/logout` → `204`, repetido → `204`, depois `GET /auth/session` → `401`.
5. **Mescla do carrinho:** plantar com `cartsStore.put` um carrinho de visitante (`id` = valor enviado em `X-Cart-Id`) com um item de edição de estoque 3 e quantidade 5 e outro dentro do estoque; `login` e `register` com `X-Cart-Id` → `details.adjustments` com `{ requested, applied, reason: 'stock' }`; o carrinho do usuário (`cart-<id>`) tem as quantidades e `lineTotal` corretos (strings), o do visitante foi apagado; mesmo NFT/edição soma com o carrinho que o usuário já tinha; cupom do visitante só prevalece se o usuário não tinha; sem `X-Cart-Id` não aparece `details`. `money` e `cartMerge` (via `__kurioMock`): os casos dos critérios do 05-004 e 05-005.
6. **Falhas gerais:** `network-error:POST /auth/login` e `offline` fazem o `fetch` rejeitar; resposta sempre em PT-BR no campo `message`.
Fechamento: `npm run lint && npm run format:check && npm run typecheck` → exit 0. Commit: `git add tests/e2e/auth-mock.spec.ts src/mocks/browser.ts` e `git commit -m "05-012: testes do mock de autenticação"`.

## Critérios de aceite
- [ ] Todos passam no projeto `desktop`, duas execuções seguidas; o `mobile` os pula.
- [ ] Nenhum `data-testid` nem seletor CSS.
- [ ] Os testes das fases 00 a 04 continuam verdes.

## Verificação (Sonnet)
- `npm run test:e2e` → todos passando; `npm run lint && npm run format:check && npm run typecheck && npm run build` → exit 0.

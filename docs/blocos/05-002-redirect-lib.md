# 05-002 — Biblioteca do `redirect` (validação, rota protegida, destino ao fechar)

**Status:** concluído
**Fluxo / subitem:** Login › 1 (fechar o modal) e 4 (retorno ao fluxo); Rotas › `redirect`
**Depende de:** nenhum (função pura)
**Depende de decisão:** pergunta 17 do relatório da fase 05 (regras mais rígidas que as do 04-008)

## Objetivo
Centralizar numa única função pura a validação do parâmetro `redirect`, a lista de rotas protegidas e o destino ao fechar o modal de autenticação.

## Arquivos
- criar: `src/lib/redirect.ts`

## Referências
- docs/arquitetura/rotas.md (`redirect` só aceita caminhos internos; **armadilha do `validateSearch`**: devolver as chaves conhecidas sempre, `undefined` quando inválidas)
- docs/fluxos/login.md (subitem 1: Esc/X levam ao `redirect` se a origem for pública; se exigir login, à Início) e docs/blocos/04-008-routes-placeholder-2.md (regra inicial)
- `src/routes/entrar.tsx` e `src/routes/cadastro.tsx` (hoje com a validação duplicada)

## Instruções
1. `parseRedirect(value: unknown): string | undefined`. Devolve o valor **só** se: é `string`; começa com `/`; **não** começa com `//`; não contém `\`; não contém caractere de controle (`/[\u0000-\u001f\u007f]/`); tem no máximo 2048 caracteres; resolvido com `new URL(value, 'http://kurio.local')` mantém a origem `http://kurio.local`; e o `pathname` **não** é `/entrar` nem `/cadastro` (nem começa com `/entrar/` ou `/cadastro/`), para não criar laço. Senão `undefined`.
2. `type AuthSearch = { redirect: string | undefined }` e `validateAuthSearch(search: Record<string, unknown>): AuthSearch` que **sempre** devolve a chave: `({ redirect: parseRedirect(search.redirect) })`. Comentar em uma linha o porquê (o roteador mescla o retorno sobre a busca bruta). Será o `validateSearch` das duas rotas (05-036).
3. `isProtectedPath(path: string): boolean`: lê `pathname` e `search` do caminho (mesmo `URL` do item 1). Protegido quando: `pathname === '/pagamento'`; ou começa com `/pedido/`; ou é `/perfil` ou começa com `/perfil/`; ou `pathname === '/'` e `favoritos=1` na busca. `/carrinho` e o resto são públicos (A1).
4. `closeTarget(redirect: string | undefined): string`: `'/'` quando `redirect` é `undefined` ou `isProtectedPath(redirect)`; senão o próprio `redirect`.
5. Sem dependência de React nem de `src/mocks`. Exportar só estas funções e o tipo.
6. Fechamento: `npx prettier --write src/lib/redirect.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/lib/redirect.ts` e `git commit -m "05-002: biblioteca do redirect"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; funções puras.
- [ ] Aceitos: `/carrinho`, `/perfil/dados?x=1#a`, `/?favoritos=1`. Rejeitados: `//evil.com`, `https://evil.com`, `/\evil.com`, `/a\b`, `javascript:alert(1)`, string vazia, `/entrar`, `/cadastro?redirect=/x`, string de 3000 caracteres, valor que não é string.
- [ ] `isProtectedPath`: `/pagamento`, `/pedido/abc`, `/perfil`, `/perfil/carteiras`, `/?favoritos=1` → `true`; `/`, `/?q=a`, `/carrinho`, `/nft/x` → `false`.
- [ ] `closeTarget('/pagamento')` → `/`; `closeTarget('/carrinho')` → `/carrinho`; `closeTarget(undefined)` → `/`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Casos acima via `page.evaluate` na ponte de teste (ampliada no 05-042), dentro do 05-046.

# 04-010 — Rotas provisórias (4/4): carteiras e parâmetros da Início

**Status:** pendente
**Fluxo / subitem:** Fase 04 › Rotas provisórias
**Depende de:** 04-009

## Objetivo
Criar `/perfil/carteiras` e declarar na Início os parâmetros de busca que o cabeçalho, o rodapé e a barra mobile já usam (`q`, `colecao`, `favoritos`), mais o `staticData` da barra mobile.

## Arquivos
- criar: `src/routes/perfil.carteiras.tsx`
- alterar: `src/routes/index.tsx`
- gerado pelo plugin (versionado): `src/routeTree.gen.ts`

## Referências
- docs/arquitetura/rotas.md (parâmetros de `/`: `q`, `colecao`, `favoritos`)
- docs/decisoes.md (A4: `/?favoritos=1`)

## Instruções
1. `perfil.carteiras.tsx`: `/perfil/carteiras`, `<h1>Carteiras</h1>`, `staticData: { title: 'Carteiras' }`; comentário "fase 10 troca pelo Wallets". Mesmo padrão do 04-007.
2. `index.tsx` (mantém o `<h1>Kurio</h1>` e o comentário da fase 06): acrescentar `staticData: { mobileTabBar: true }` e um `validateSearch: (search: Record<string, unknown>): { q?: string; colecao?: string; favoritos?: 1 } => …` provisório:
   - `q`: `string` não vazia (após `trim`);
   - `colecao`: `string` não vazia;
   - `favoritos`: `1` quando o valor for `1` ou `'1'`; senão ausente.
   Comentário: "fase 06 troca pelo schema zod completo de rotas.md". Sem título (a Início é só "Kurio").
3. `npx vite build` para regenerar o `routeTree.gen.ts`.
4. Fechamento: `npx prettier --write` nos 2 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/routes src/routeTree.gen.ts` e `git commit -m "04-010: rota de carteiras e parâmetros da Início"`.

## Critérios de aceite
- [ ] `Link to="/" search={{ q: 'ape' }}`, `search={{ colecao: 'musica' }}` e `search={{ favoritos: 1 }}` compilam.
- [ ] `/?favoritos=1` e `/?favoritos=x`: o primeiro vira `favoritos: 1`, o segundo é descartado.
- [ ] `<h1>Kurio</h1>` e o título "Kurio" continuam (o teste de fumaça da fase 00 depende deles).
- [ ] `src/routes/` tem agora: `__root`, `index`, `nft.$nftId`, `carrinho`, `pagamento`, `pedido.$orderId`, `entrar`, `cadastro`, `perfil`, `perfil.index`, `perfil.dados`, `perfil.carteiras`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- `npm run test:e2e -- smoke` continua passando nos dois projetos.

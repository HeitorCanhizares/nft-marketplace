# 04-007 — Rotas provisórias (1/4): detalhe, carrinho, pagamento

**Status:** pendente (**depende da resposta do usuário à pergunta 5 do relatório da fase 04**)
**Fluxo / subitem:** Fase 04 › Rotas provisórias
**Depende de:** 04-006

## Objetivo
Criar as rotas da tabela de `rotas.md` como placeholders, para que o `Link` tipado do TanStack Router aceite `to="/carrinho"` etc. nos componentes de layout. As fases 07, 08 e 11 trocam o conteúdo.

## Arquivos
- criar: `src/routes/nft.$nftId.tsx`, `src/routes/carrinho.tsx`, `src/routes/pagamento.tsx`
- gerado pelo plugin (não conta no limite, **é versionado**): `src/routeTree.gen.ts`

## Referências
- docs/arquitetura/rotas.md (tabela de rotas)
- `src/routes/index.tsx` (padrão do placeholder da fase 00)

## Instruções
Cada arquivo segue o padrão do `index.tsx` atual: `createFileRoute('<caminho>')` com um componente que renderiza só `<h1 className="container-page py-8 text-heading font-bold">…</h1>`, com o comentário `// Placeholder: a fase NN troca pelo <Página>.`
1. `nft.$nftId.tsx`: caminho `/nft/$nftId`, `<h1>NFT</h1>`; comentário "fase 07 troca pelo NftDetails". Sem `staticData` (o título virá do NFT, fase 07).
2. `carrinho.tsx`: `/carrinho`, `<h1>Carrinho</h1>`, `staticData: { title: 'Carrinho' }`; comentário "fase 08 troca pelo Cart".
3. `pagamento.tsx`: `/pagamento`, `<h1>Pagamento</h1>`, `staticData: { title: 'Pagamento' }`; comentário "fase 11 troca pelo Checkout". **Sem** proteção de rota (fase 05).
4. Gerar o `routeTree.gen.ts` **antes** do typecheck: `npx vite build` (o `tsc -b` do `npm run build` roda primeiro e falharia com a árvore antiga). Conferir que o arquivo mudou.
5. Fechamento: `npx prettier --write` nos 3 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/routes src/routeTree.gen.ts` e `git commit -m "04-007: rotas provisórias de detalhe, carrinho e pagamento"`.

## Critérios de aceite
- [ ] `src/routeTree.gen.ts` atualizado e no commit.
- [ ] Os componentes são só o `<h1>`; sem layout, sem dados.
- [ ] `npm run dev`: `/carrinho`, `/pagamento` e `/nft/abc` mostram o `<h1>`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- `git status --short` limpo depois de `npm run dev` por alguns segundos (o arquivo gerado não muda).

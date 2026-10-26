# 08-013 — Testes do carrinho (caminho principal)

**Status:** pendente
**Fluxo / subitem:** Carrinho › todos (modo enxuto)
**Depende de:** 08-012

> **Modo enxuto** (docs/decisoes.md): só o caminho principal. Casos de borda estão listados no 08-015.

## Objetivo
Um spec do fluxo, um de axe e uma baseline visual por tela (desktop e mobile, conforme o projeto).

## Arquivos (testes)
- criar: `tests/e2e/cart.spec.ts`
- criar: `tests/e2e/cart-a11y.spec.ts`
- criar: `tests/visual/cart.spec.ts`
- alterar: `tests/e2e/helpers.ts` (helper `seedCart`)

## Referências
- `tests/e2e/nft-details.spec.ts`, `nft-details-a11y.spec.ts`, `tests/visual/nft-details.spec.ts` (estrutura, `ready`, `users`, `authState`, `only`, `settle`)
- `src/lib/session.ts` (chave do `cartId` do visitante), `src/mocks/seed/nfts.ts` (ids de NFT e de edição), docs/api-mock/contratos.md (valores da cotação)

## Instruções
1. Helper `seedCart(page, items: { nftId; editionId; quantity }[])` em `helpers.ts`: depois de `page.goto('/')` e `ready`, usa `page.evaluate` com `fetch('/api/cart/items', { method: 'POST', headers: { 'X-Cart-Id': <id do localStorage, criado se faltar> }, body })` (o MSW intercepta o `fetch` da página). Sem `waitForTimeout`.
2. `cart.spec.ts` (cada `test` roda uma vez; `only(testInfo, …)` para o que é só de um projeto). Com **Emerald Ape #042, edição 1/50 (`1.19`), quantidade 1** no carrinho do visitante:
   - lista e resumo: linha "Emerald Ape #042" com `1.19 ETH`, ID `#0042`; Subtotal `1.19 ETH`, Taxa de rede `0.016 ETH` com "Taxa estimada", Total `1.206 ETH`; título da seção "Resumo do pedido" (desktop); contador do cabeçalho com `aria-label` "Carrinho, 1 item";
   - quantidade: "Aumentar quantidade" → 2, Subtotal `2.38 ETH` e Total `2.396 ETH`; "Diminuir quantidade" volta a 1 e fica **desabilitado**; `reload` mantém a quantidade (persistência);
   - cupom: digitar `KURIO10` e "Aplicar" mostra "Cupom KURIO10 aplicado" e o Desconto `(-) 0.119 ETH`; "Remover cupom" volta ao campo e ao desconto `0.00`;
   - remover: lixeira "Remover Emerald Ape #042" → toast "Emerald Ape #042 removido" com "Desfazer"; "Desfazer" traz a linha de volta; remover de novo e aguardar mostra "Seu carrinho está vazio" com o foco no título e o link "Explorar NFTs";
   - finalizar: visitante clica "Conectar e finalizar" → URL com `/entrar` e `redirect` para `/pagamento`; com `signIn` (como em `nft-details.spec.ts`) → `/pagamento`;
   - desktop: seção "Colecionadores também viram" mostra cards e "Continuar explorando" leva à Início; mobile: não há carrossel e o painel inferior tem cupom, resumo e botão.
3. `cart-a11y.spec.ts`: axe (só `serious`/`critical`) em `/carrinho` com 2 itens, como em `nft-details-a11y.spec.ts`; e a lista de lixeiras tem nomes únicos.
4. `tests/visual/cart.spec.ts`: `toHaveScreenshot('carrinho.png', { fullPage: true })` com movimento reduzido e `settle`, com 3 NFTs no carrinho parecidos com o Figma (Emerald Ape ×2, Violet Nomad, Ivory Baron). **A baseline só é aprovada pelo usuário no checkpoint.**
5. Valores monetários vêm do mock (08-003); se a conta não bater, **parar e avisar**, não ajustar o teste.
6. `npm run test:e2e -- cart` e `npm run test:e2e -- cart-a11y` verdes nos dois projetos; gerar a baseline com `npx playwright test tests/visual/cart.spec.ts --update-snapshots`. Commit: `08-013: testes do carrinho`.

## Critérios de aceite
- [ ] Sem `waitForTimeout`; seletores por papel e nome.
- [ ] Nenhum teste de falha, tempo real, clique repetido, estoque no limite, cupom inválido/expirado ou sessão expirada.

## Verificação (Sonnet)
- Specs acima verdes; uma captura lado a lado com o Figma por tela (desktop e mobile), nos elementos principais.

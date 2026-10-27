# 12-017 — Teste E2E da Confirmação (caminho principal)

**Status:** pendente
**Fluxo / subitem:** Confirmação › 1, 2, 3, 5, 6 (modo enxuto)
**Depende de:** 12-015, 12-016
**Toca:** `tests/e2e/helpers.ts` (alterar; **arquivo compartilhado**, só o lote K mexe), `tests/e2e/order-confirmation.spec.ts` (novo)
**Paralelo:** não: `helpers.ts` é do lote K. O 12-018 (mesmo lote) usa o `seedOrder` deste bloco.
**Lote:** K

> **Modo enxuto** (docs/decisoes.md): só o caminho principal. Casos de borda estão listados no 12-020.

## Objetivo
Um spec com o fluxo pagar → pendente → confirmado → recibo → fechar, e um helper para criar pedidos direto no mock (usado também pelos specs de acessibilidade e visual).

## Arquivos (testes)
- alterar: `tests/e2e/helpers.ts` (acrescentar `seedOrder`)
- criar: `tests/e2e/order-confirmation.spec.ts`

## Referências
- `tests/e2e/checkout.spec.ts` (`openCheckout`, `signInWithCart`, `only`, o trecho conectar → "Confirmar compra" → "Confirmar e pagar"), `tests/e2e/helpers.ts` (`ready`, `seedFigmaCart`, `firstEditionId`, `authState`), `tests/e2e/fixtures.ts` (`users.primary`, `users.other`), `tests/e2e/wallets.spec.ts` (`signIn` pela ponte `window.__kurio.auth.signIn`)
- `window.__kurioMock.stores.ordersStore` e `nftsStore` (só em modo teste); `window.__kurio.http.get(...)` (cliente Axios da ponte, com o token da sessão)
- docs/fluxos/confirmacao.md; seed: o usuário `teste` tem só a principal (`0xA91F3D7B9C1E0A5F48B2C6D09E17A3F5B8C4E82C`, Ethereum, MetaMask); atraso padrão do pagamento 3 s (`.env`); latência 50 ms

## Instruções
1. **`seedOrder(page, input)`** em `helpers.ts`: grava um `OrderRecord` via `ordersStore.put` (registro novo grava inteiro) e devolve o `id`. Parâmetros: `status` (`'pending' | 'confirmed' | 'declined'`), `userId` (padrão `USER.id`), `createdAt` (padrão agora), `network` (padrão `'ethereum'`), `declineReason?`. **Snapshot do Figma** (valores do recibo de `desktop-confirmacao.png`): Emerald Ape #042 (`emerald-ape-042`, edição `1/50`) ×2 a `1.19` = `2.38`; Violet Nomad #314 ×6 a `1.39` = `8.34`; Ivory Baron #088 ×9 a `1.79` = `16.11`; `subtotal` `26.83`, `discount` `0.00`, `networkFee` `0.016`, `total` `26.846`. Nome, `tokenId` e imagem vêm do `nftsStore` (`violet-nomad-314`, `ivory-baron-088`), os preços e quantidades são os acima (o snapshot não depende do catálogo). `wallet` = `{ label: 'MetaMask', provider: 'metamask', address: <endereço da principal> }`; `collector` = a carteira principal do usuário (`GET /wallets`) sem `id` e `slot`. Confirmado: `txHash` = `'0xA91F' + '0'.repeat(56) + 'E82C'`, `explorerUrl` = base do explorador da rede + `txHash`, `createdAt` padrão `'2026-07-29T12:00:00.000Z'`. Recusado: `declineReason` padrão "Pagamento recusado pela carteira simulada.".
2. **Fluxo principal** (`test.setTimeout(90_000)`; os dois projetos; seletores por papel e nome; **sem `waitForTimeout`**; esperas com `expect(...).toBeVisible({ timeout: 15_000 })`):
   - Carrinho do Figma como visitante (`seedFigmaCart`), login com `users.primary`, `/pagamento`, `getByRole('radio', { name: 'MetaMask' })` → "Conectada: 0xA91F…E82C", "Confirmar compra" → diálogo "Revisar pedido" → "Confirmar e pagar" → URL `/pedido/<id>`.
   - **Pendente:** desktop: `getByRole('dialog', { name: 'Confirmando pagamento' })` visível; mobile: `getByRole('heading', { name: 'Confirmando pagamento...' })`. O texto "Seus NFTs agora estão na sua carteira" **não existe** (`toHaveCount(0)`): o recibo só aparece com o pedido confirmado. O foco está no título do diálogo (desktop).
   - **Confirmado** (sem recarregar): desktop: `getByRole('dialog', { name: 'Pedido confirmado' })` (o **mesmo** diálogo, com o título novo); mobile: o `h1` continua "Pedido". Recibo: "Seus NFTs agora estão na sua carteira", "Emerald Ape #042", "(x 2)", "Taxa de rede", e o **Total** igual ao `total` do pedido lido pela API (`window.__kurio.http.get('/orders/<id>')`, formatado como `formatEth`, ex.: `26.846 ETH`; não digitar o valor no teste). "Transação confirmada na Ethereum." visível.
   - **Explorador:** `getByRole('link', { name: /Ver no Etherscan/ })` com `target="_blank"`, `rel` com `noopener`, `href` casando `^https://etherscan\.io/tx/0x[0-9a-fA-F]{64}$`, e o texto "Transação simulada" visível. **Não** clicar (não sair do app).
   - **Efeitos:** `GET /cart` → `itemCount` 0 (só saem os itens comprados; o carrinho do teste tinha só eles); `sessionStorage` sem `kurio:checkout` nem `kurio:checkout-draft`; o contador de itens do cabeçalho some (desktop).
   - **Fechar:** desktop: `Escape` → URL `/`; mobile: botão "Voltar" → URL `/`. Depois `page.goto(<url do pedido>)` e o recibo continua acessível pela URL (acesso direto; o `loader` busca o pedido).
3. **Rede conforme o pedido:** com `seedOrder({ status: 'confirmed', network: 'polygon' })`, em `/pedido/<id>` aparecem "Transação confirmada na Polygon." e o link "Ver no Polygonscan" (`href` em `polygonscan.com`). (Um teste só; Solana fica para a fase 13.)
4. `npm run test:e2e -- order-confirmation` verde nos dois projetos. Commit: `git commit -m "12-017: teste da confirmação" -- <arquivos>`.

## Critérios de aceite
- [ ] Nenhum teste de recusa, 403, 404, refresh com pendente, socket caído/polling, aviso de 60 s, carrinho com itens extras, cenário forçado ou recibo com preço alterado.
- [ ] Sem `waitForTimeout`; seletores por papel e nome.
- [ ] Se um valor do mock não bater com o do spec, **parar e avisar**, não ajustar o teste.

## Verificação (Sonnet)
- Spec verde nos dois projetos (uma vez). Uma captura lado a lado com o Figma no 12-019.

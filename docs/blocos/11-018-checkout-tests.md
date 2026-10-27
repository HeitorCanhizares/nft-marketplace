# 11-018 — Testes do pagamento (caminho principal)

**Status:** pendente
**Fluxo / subitem:** Pagamento › todos (modo enxuto)
**Depende de:** 11-017
**Toca:** `tests/e2e/checkout.spec.ts`, `tests/e2e/checkout-a11y.spec.ts`, `tests/visual/checkout.spec.ts` (todos novos)
**Paralelo:** os três arquivos são independentes; podem ser escritos por um agente só ou por três.
**Lote:** M

> **Modo enxuto** (docs/decisoes.md): só o caminho principal. Casos de borda estão listados no 11-020.

## Objetivo
Um spec do fluxo, um de axe e uma baseline visual por tela (desktop e mobile, conforme o projeto).

## Arquivos (testes)
- criar: `tests/e2e/checkout.spec.ts`
- criar: `tests/e2e/checkout-a11y.spec.ts`
- criar: `tests/visual/checkout.spec.ts`

## Referências
- `tests/e2e/wallets.spec.ts` (`only`, `signIn` pela ponte `window.__kurio.auth.signIn`, `authState`, regiões), `tests/e2e/helpers.ts` (`ready`, `seedCart`, `seedFigmaCart`, `firstEditionId`), `tests/e2e/fixtures.ts` (`users.primary`, `users.other`), `tests/e2e/cart-a11y.spec.ts`, `tests/visual/cart.spec.ts` (`SHOT`, `settle`)
- docs/fluxos/pagamento.md; seed: o usuário `teste` tem **só a principal** (endereço `0xA91F3D7B9C1E0A5F48B2C6D09E17A3F5B8C4E82C`, Ethereum, MetaMask); `KURIO10` = 10 % no carrinho; taxas: Ethereum `0.016`, Polygon `0.002`
- A conexão simulada leva 0,8 a 1,5 s e a assinatura 0,5 a 1 s: usar `expect(...).toBeVisible()` com os textos finais ("Conectada: 0xA91F…E82C"), **sem `waitForTimeout`**

## Instruções
1. Montar o carrinho como **visitante** (`seedFigmaCart` depois de `page.goto('/')` + `ready`) e só então entrar com `signIn` (o login mescla o carrinho). Cada `test` roda uma vez e é independente (contexto novo, banco do mock recriado). Definir `test.setTimeout(60_000)`.
2. `checkout.spec.ts`:
   - **entrada:** logado com carrinho vazio, `/pagamento` leva a `/carrinho`.
   - **desktop, fluxo completo** (`only(…, 'desktop')`): `/pagamento` mostra "Perfil do colecionador" preenchido com a principal, "Seus NFTs" com "Emerald Ape #042", "(x 2)" e os subtotais; "Tem um código promocional? Aplique aqui" abre o campo, `KURIO10` aplica e mostra "Cupom KURIO10 aplicado"; trocar "Rede" para Polygon muda a "Taxa de rede" para `0.002 ETH`; "Confirmar compra" **sem conectar** mostra "Conecte uma carteira para continuar." e não abre a revisão; escolher "MetaMask" → "Conectando à MetaMask..." → "Conectada: 0xA91F…E82C"; com a rede do formulário em Polygon e a carteira em Ethereum aparece "Trocar para Polygon" → clicar → conectada na rede certa; "Confirmar compra" abre o diálogo "Revisar pedido" (itens, carteira, taxa e total); "Confirmar e pagar" → URL `/pedido/<id>`; voltar a `/pagamento` leva de novo ao pedido (recuperação do pedido pendente).
   - **outra carteira** (`only(…, 'desktop')`): marcar "Usar outra carteira?", escolher "Preencher outra carteira" (formulário limpo), preencher os campos obrigatórios (endereço `0x1111111111111111111111111111111111111111`), marcar "Salvar como carteira secundária", conectar, pagar; depois `GET /api/wallets` (com o token da sessão, via `page.evaluate`) devolve a secundária.
   - **mobile** (`only(…, 'mobile')`): `/pagamento` mostra "Carteira conectada" com o cartão "Principal" e **sem** formulário; menu "Opções da carteira Principal" → "Editar carteira" abre `/perfil/carteiras?redirect=/pagamento` (voltar ao pagamento); escolher "MetaMask" → "Conectada: 0xA91F…E82C"; "Confirmar compra" abre a folha "Revisar pedido"; "Confirmar e pagar" → `/pedido/<id>`.
3. `checkout-a11y.spec.ts`: axe (só `serious`/`critical`) em `/pagamento` (carrinho com 3 itens, usuário `teste`) nos dois projetos, e com a revisão aberta (conectar MetaMask antes); nomes acessíveis únicos para os rádios e botões (como em `cart-a11y.spec.ts`).
4. `tests/visual/checkout.spec.ts`: `toHaveScreenshot('pagamento.png', { ...SHOT, fullPage: true })` com movimento reduzido e `settle`. Desktop: usuário `teste`, carrinho do Figma, "Coinbase Wallet" escolhida e conectada. Mobile: o mesmo e **com a secundária cadastrada** (`PUT /api/wallets/secondary` pela página, nome "Reserva", Polygon, ENS `nova.kurio.eth`) e a carteira "Reserva" escolhida. **Diferenças conhecidas para o Figma:** formulário preenchido (o Figma está vazio) e a linha de estado da conexão. **A baseline só é aprovada pelo usuário no checkpoint.**
5. `npm run test:e2e -- checkout` e `npm run test:e2e -- checkout-a11y` verdes nos dois projetos; gerar a baseline com `npx playwright test tests/visual/checkout.spec.ts --update-snapshots`. Commit: `git commit -m "11-018: testes do pagamento" -- <arquivos e baselines>`.

## Critérios de aceite
- [ ] Sem `waitForTimeout`; seletores por papel e nome.
- [ ] Nenhum teste de falha, cenário forçado, cotação vencendo, clique repetido, timeout, recusa, desconexão, mudança de preço/estoque/cupom/taxa, sessão expirada ou rascunho.
- [ ] Se um valor do mock não bater com o do spec, **parar e avisar**, não ajustar o teste.

## Verificação (Sonnet)
- Specs acima verdes; uma captura lado a lado com o Figma por tela (desktop e mobile), nos elementos principais (medidas dos blocos 11-009, 11-011, 11-014, 11-015 e 11-016).

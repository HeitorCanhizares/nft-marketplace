# 11-020 — Casos de borda do pagamento adiados para a fase 13

**Status:** pendente
**Depende de:** 11-019
**Toca:** — (nenhum arquivo agora)
**Paralelo:** não.

Testes que **não** são escritos na fase 11 (modo enxuto). O comportamento já está implementado e documentado (blocos 11-001 a 11-017); os cenários do mock existem (11-003).

## Entrada
- Sem login → `/entrar?redirect=/pagamento`; carrinho com item esgotado ou estoque insuficiente → `/carrinho` com o motivo; cenário `empty-cart`.
- Pedido pendente por `kurio:checkout.orderId` e por `GET /orders?status=pending`; chave de idempotência **sem** `orderId` reenvia o `POST /orders` com a mesma chave e o mesmo corpo (pedido existe / não existe); erro ao carregar carrinho, carteiras ou pendentes (`ErrorState`).

## Formulário e rascunho
- Validação de todos os campos (limites do 10-012), campo vazio só acusa no envio, foco no primeiro erro; observação com mais de 500 caracteres.
- Rascunho: restaura valores, modo, observação, provedor e rede depois de `reload`; rascunho de **outro** usuário descartado; modo `secondary` restaurado sem secundária volta a `primary`; usuário **sem principal** (formulário vazio).

## "Usar outra carteira?" e secundária
- Opção "Carteira secundária" (com e sem secundária cadastrada); "Preencher outra carteira" limpa; checkbox vem desmarcado; texto "Substituir a carteira secundária" com aviso quando já existe; marcado: `PUT /wallets/secondary` antes do pedido e **falha dele impede o pedido**; desmarcado: nenhum `PUT`; apelido vazio vira "Carteira secundária".

## Mobile: carteiras salvas
- Sem nenhuma carteira (estado vazio, link e botão desabilitado); troca entre principal e secundária; "Trocar carteira" desconecta e limpa o provedor; "⋮" → "Editar carteira" e volta com o rascunho preservado; teclado no menu.

## Rede e provedor (carteira simulada)
- Trocar a rede refaz a cotação (Polygon `0.002`, Solana `0.0005`); escolher o provedor **sem rede** (aviso, não conecta).
- `wallet-rejected` ("Conexão recusada na carteira" + "Tentar novamente"); `wallet-disconnect` na tela e **dentro da revisão** (bloqueia "Confirmar e pagar", pede reconexão, nada se perde); `wallet-wrong-network` + "Trocar para…"; "Desconectar" manual; trocar de provedor já conectado; eventos `accountsChanged` e `chainChanged`; anúncios `aria-live`.

## Cotação, cupom e tempo real
- Cotação vence (`VITE_MOCK_QUOTE_TTL_SECONDS` curto) e é refeita sozinha; `nft:price_changed` e `nft:stock_changed` atualizam a coluna; cupom inválido, expirado e remoção; erro da cotação (`PriceSummary` com "Tentar novamente").

## Revisão e mudanças (nova confirmação)
- `price-change-on-checkout`, `sold-out-on-checkout` (remover o item na revisão; carrinho esvaziado → `/carrinho`), `coupon-expires-on-checkout`, `fee-change-on-checkout`: cada um mostra a `QuoteChangeList` com antes → depois, exige confirmar de novo e usa **chave nova**; várias mudanças juntas; `QUOTE_EXPIRED` e `CART_CHANGED` (refaz a cotação).
- "Voltar" mantém dados e chave; Esc e clique fora bloqueados durante o envio; foco inicial e retorno do foco; falha de rede ao revalidar.

## Envio idempotente e falhas
- Clique repetido em "Confirmar compra" e em "Confirmar e pagar": **um** pedido; `order-timeout` ("Confirmando seu pedido..." e chega ao pedido sem duplicar); falha de rede/5xx com 3 tentativas e "Não conseguimos confirmar seu pedido." + "Tentar novamente" reutilizando a chave **sem nova assinatura**; `422 IDEMPOTENCY_KEY_REUSED` e `422 VALIDATION_ERROR`; `wallet-sign-rejected` ("Pagamento cancelado na carteira", nenhum pedido); desconexão durante a assinatura; refresh no meio do envio.
- Em toda falha: carrinho e formulário preservados.

## Sessão expirada
- `session-expired-on-checkout` e expiração por TTL: rascunho salvo (inclui a última digitação, gravada no cleanup), `kurio:checkout` mantido, `/entrar?redirect=/pagamento`; login do **mesmo** usuário restaura formulário, seleção, rede, refaz a cotação e pede reconexão da carteira; **outro** usuário descarta tudo (`clearPrivateSession`).

## Mock
- `GET /orders` só do usuário e só `pending`; mesma chave e corpo diferente; snapshot imutável quando o preço muda; `POST /orders` sem cabeçalho `Idempotency-Key`.

## Estados e acessibilidade
- Skeleton com latência alta; `500` e rede nos carregamentos; teclado (ordem dos campos, rádios, "⋮", `Dialog`/`Sheet` com foco preso e retorno); leitor de tela (conexão, mudanças, "Processando..."); overflow em 320 px e zoom de 200 %; `prefers-reduced-motion`; redimensionar entre desktop e mobile no meio do fluxo mantém o estado; 1024 a 1439 px; contraste de `muted-foreground` sobre `card`.
- Baselines visuais por estado: revisão aberta, com mudanças, com erro, conectando, recusada.

# 12-020 — Casos de borda da confirmação adiados para a fase 13

**Status:** pendente
**Depende de:** 12-019
**Toca:** — (nenhum arquivo agora)
**Paralelo:** não.

Testes que **não** são escritos na fase 12 (modo enxuto). O comportamento já está implementado e documentado (blocos 12-001 a 12-015); os cenários do mock existem (12-002 e 12-003). Cada item deve virar teste em `tests/e2e/order-confirmation-edge.spec.ts` (ou nos specs do fluxo), exceto os marcados como baseline visual.

## Estados do pedido
- `payment-confirmed` e `payment-declined` forçados; `VITE_MOCK_PAYMENT_DECLINE_RATE` > 0 (desfecho aleatório, só no mock); recusado: `declineReason` exibido, "Seus itens continuam no carrinho", carrinho **intacto** (conferir `GET /cart` antes e depois), **sem recibo e sem `txHash`**, "Tentar novamente" → `/pagamento` com formulário preenchido, nova chave de idempotência (`kurio:checkout` apagado e o próximo `POST /orders` com chave diferente), "Voltar ao carrinho".
- Recusa por estoque no momento da confirmação (a edição esgota entre a criação e o desfecho): pedido `declined` com "Um dos NFTs esgotou durante o pagamento.", estoque e carrinho intactos.
- Cada transição anuncia o resultado em `assertive` ("Pedido confirmado" / "Pagamento recusado. <motivo>"); **o foco não sai do título** do diálogo na troca de estado; recibo e recusa nunca aparecem enquanto `pending`.

## Tempo real, polling e reconexão
- `realtime-drop`: o socket cai com o pedido pendente, o polling de 2 s assume (`GET /orders/:id` repetido até sair de `pending`), ao reconectar há uma releitura; com o socket conectado **não** há polling.
- Evento `order:updated` de outro pedido é ignorado; evento perdido (socket reconectou depois do desfecho) é recuperado pela releitura da conexão.
- `payment-slow` (30 s): aviso "Está demorando mais que o normal. Você pode sair; o pedido continua sendo processado." depois de 60 s **desde a criação** (com `createdAt` antigo); some quando o pedido sai de `pending`; botão "Voltar ao início".

## Retomada e recuperação
- Refresh em `/pedido/<id>` pendente retoma o acompanhamento e o desfecho chega depois do refresh (timer rearmado pelo `GET`; mock estável após recarregar).
- `/pagamento` com pedido pendente redireciona para o pedido (por `kurio:checkout.orderId` e por `GET /orders?status=pending`); depois do desfecho, `/pagamento` **não** redireciona mais (confirmado: carrinho vazio → `/carrinho`; recusado: Pagamento livre).
- O usuário sai com o pedido pendente, o pedido confirma enquanto ele está fora, ele volta por `/pagamento` e cai no recibo; `kurio:checkout` é limpo ali.
- Recibo antigo aberto durante um pagamento novo **não** apaga o `kurio:checkout` novo.
- Pagamento criado por reenvio com a mesma chave (`order-timeout`) chega ao mesmo pedido, sem duplicar, e acompanha até o desfecho.

## Acesso
- `403` (pedido de outro usuário, e cenário `forbidden-order`): "Você não tem acesso a este pedido" + link para a Início; nenhum dado do pedido vaza (nem título, nem itens).
- `404` (id inexistente): "Pedido não encontrado" + link para a Início; `server-error:GET /orders/:id` → `ErrorState` com "Tentar novamente"; `offline`.
- Sem login → `/entrar?redirect=/pedido/<id>` e volta ao pedido depois do login; sessão que expira na página (`session-expired`) → fluxo padrão de expiração; troca de usuário não mostra o pedido do anterior (`clearPrivateSession`).

## Recibo e snapshot
- **Recibo não muda** depois que o preço do NFT muda no mock (`triggerPriceChange`/edição esgotada/NFT removido): itens, nomes, imagens, edições, subtotais, taxa e total continuam os do snapshot, e nenhuma requisição a `GET /nfts` é feita pela página.
- Pedido com cupom: linhas "Subtotal" e "Desconto do lançamento" no recibo; sem cupom: só taxa e total.
- Edição aberta (estoque ilimitado) não baixa estoque; edição limitada baixa só o comprado e emite `nft:stock_changed` (card da Início e detalhe atualizam).
- Nome do explorador por rede (Etherscan, Polygonscan, Solscan); `explorerUrl` de domínio desconhecido não mostra o botão; botão "Copiar ID da transação" (sucesso e falha do clipboard, anúncio `polite`, ícone de check por 2 s); ID abreviado com o valor completo acessível.
- Data em pt-BR no fuso do navegador; textos longos (nome do NFT, rótulo da carteira) quebram sem sobrepor "(x N)" e o subtotal.

## Carrinho
- **Só os itens e quantidades comprados saem do carrinho:** item adicionado depois da cotação continua; quantidade a mais do mesmo item continua com a diferença; linha comprada por inteiro some; carrinho que sobra mantém o cupom e carrinho esvaziado perde o cupom (decisão Q4); `version` incrementada; contador do cabeçalho confere.
- Recusa e pendente não mexem no carrinho nem no estoque.

## Mock
- `GET /orders/:id` só do dono; `GET /orders?status=pending` só do usuário e sem pedido vencido; duas liquidações simultâneas (timer + `GET`) baixam o estoque uma vez e emitem um evento; `txHash` com `0x` + 64 hexadecimais; snapshot imutável depois do desfecho.

## Estados e acessibilidade
- Esqueleto com latência alta (`slow`); troca entre desktop e mobile no meio do acompanhamento mantém o estado; 1024 a 1439 px; overflow a 320 px e zoom de 200 %; `prefers-reduced-motion` (spinner parado); teclado (Esc e X fecham, foco preso, foco inicial no título, retorno do foco); leitor de tela (anúncios, ID completo); contraste de `muted-foreground` e `tan` sobre `card`.
- Baselines visuais por estado (desktop e mobile): pendente, pendente com aviso de demora, recusado, 403, 404.

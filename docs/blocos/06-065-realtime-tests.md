# 06-065 — Testes do tempo real na Início

**Status:** pendente
**Responsável:** Sonnet (o Haiku não escreve testes)
**Fluxo / subitem:** Início › 11 (tempo real)
**Depende de:** 06-057, 06-059

## Objetivo
Provar as inscrições dos NFTs visíveis, a atualização de preço e estoque nos cards, o selo "Atualizado", o aviso agrupado, que nada reordena nem move o foco, e a reconexão do socket.

## Arquivos
- criar: `tests/e2e/home-realtime.spec.ts`

## Referências
- docs/api-mock/realtime.md (inscrições; `nft:price_changed`, `nft:stock_changed`; **armadilhas**: `ws.link('*')`, ping de 20 s, queda simulada segura a conexão até o fim da janela; **validar no navegador**, não em Node) e docs/fluxos/inicio.md (subitem 11)
- `window.__kurioMock.triggerPriceChange(nftId, editionId, price)`, `triggerStockChange(nftId, editionId, available)`, `dropConnections(ms)`, `getSubscribedNftIds()` (06-059) e `window.__kurio.queryClient`; no modo `test` o agendador aleatório **não** roda: os eventos vêm só dos `trigger*`
- `tests/e2e/helpers.ts` (`collectAnnouncements`, `announcements`, `recordApi`)

## Instruções
O Sonnet escreve. Esperar a inscrição antes de disparar: `expect.poll(() => getSubscribedNftIds().length).toBe(9)`. Ler os ids da grade pelo cache (`queryClient.getQueriesData({ queryKey: ['nfts', 'list'] })`) e as edições pelo banco.
1. **Inscrição dos visíveis:** os ids inscritos = os 9 da grade; **[d]** ir à página 2 troca (os 9 novos entram, os 9 antigos saem); **[m]** "Carregar mais" fica com 18; navegar para `/carrinho` zera; voltar à Início inscreve de novo; com a Início atrás do modal de `/entrar` também inscreve.
2. **Preço da edição exibida:** `triggerPriceChange('emerald-ape-042', <edição mais barata disponível>, '1.50')` → o card mostra "1.50 ETH" (com o preço antigo riscado), o selo "Atualizado", **sem** nenhuma nova `GET /api/nfts` (a atualização é do cache); o selo some sozinho em ≈ 5 s (`toBeHidden` com `timeout` de 8 s).
3. **Nada se move:** com o foco num card, depois do evento `document.activeElement` é o mesmo elemento; a ordem dos 9 cards não muda (nem em "Menor preço", mesmo que o novo preço mudasse a posição); o layout não desloca (a `boundingBox` dos cards não muda).
4. **Aviso agrupado:** 3 `triggerPriceChange` em NFTs diferentes em menos de 300 ms → **uma** mensagem em `getByRole('status')` ("3 preços foram atualizados") depois de ≈ 1 s; mais uma mudança 2 s depois **não** gera aviso antes de 5 s do anterior e sai numa só mensagem depois disso; nenhuma mensagem usa `role="alert"`.
5. **Estoque zerado:** num NFT visível **sem** edição `ABERTA` (escolher pelo banco; se não houver nenhum visível, remover a `ABERTA` do banco antes de abrir a página), zerar **todas** as edições com `triggerStockChange(..., 0)` → o card passa a mostrar "Esgotado", o botão de carrinho vira "Esgotado" (`aria-disabled`), saiu uma `GET /api/nfts` para refazer a lista (uma só) e o aviso diz "1 NFT esgotou"; a posição do card não muda. Zerar só **uma** edição de um NFT com outras disponíveis **não** o esgota.
6. **Outra edição:** `triggerPriceChange` numa edição que **não** é a exibida refaz a lista (uma `GET /api/nfts`) e o preço mostrado fica o que o servidor devolve; a ordem não muda.
7. **Fora da tela não faz nada:** evento de um NFT de outra página não altera a tela atual; ao ir para essa página, o preço novo já vem do servidor e **não** mostra "Atualizado" (a comparação só vale dentro da mesma consulta); depois de sair da página 1, um evento para um NFT dela é ignorado (cancelou a inscrição).
8. **Reconexão:** `dropConnections(3000)` derruba o socket; durante a queda os eventos não chegam; ao reconectar, a Início refaz a lista (uma `GET /api/nfts` nova), `getSubscribedNftIds()` volta a ter os 9 e um novo `triggerPriceChange` volta a atualizar o card.
9. **Conexão viva:** com a Início aberta por 45 s sem eventos, o socket continua conectado (o servidor simulado manda ping a cada 20 s) e um evento disparado ao fim ainda chega. Marcar `test.slow()` e rodar **só no desktop**.
10. **Troca de usuário:** entrar e sair mantém as inscrições (o `clearPrivateSession` reconecta e o hook reinscreve os visíveis): depois de um logout, `getSubscribedNftIds()` volta a ter os visíveis.
11. **Acessibilidade:** nenhuma das mudanças move o foco nem abre diálogo; o selo "Atualizado" é texto (não só cor).
Fechamento: `npm run lint && npm run format:check && npm run typecheck` → exit 0. Commit: `git add tests/e2e/home-realtime.spec.ts` e `git commit -m "06-065: testes do tempo real"`.

## Critérios de aceite
- [ ] Passa nos projetos `desktop` e `mobile` (o item 9 só no desktop), duas execuções seguidas, **no navegador** (Chromium).
- [ ] Nenhum `data-testid` nem seletor CSS (exceção justificada em comentário).

## Verificação (Sonnet)
- `npm run test:e2e -- home-realtime` verde; `npm run lint && npm run format:check && npm run typecheck && npm run build` → exit 0.

# Detalhes do NFT

**Rota:** `/nft/$nftId` · **Telas:** [desktop](../design/telas/desktop-detalhes.png), [mobile](../design/telas/mobile-detalhes.png)
**Escopo do usuário:** galeria, informações, edição, quantidade, favoritos e compra.
**Subitens:** ✅ validados pelo usuário em 2026-10-25.

## Requisitos do usuário
- Suportar **acesso direto** pela URL, **NFT inexistente**, **edição indisponível** e **limite de quantidade**.
- Favoritos **persistem** para o usuário autenticado.

## O que o Figma mostra
- **Desktop:** `Breadcrumb`; `NftGallery` (4 miniaturas + principal + zoom); nome, `PriceTag`, `RatingStars` ("19 avaliações de colecionadores"); "Sobre este NFT"; `EditionSelector` (1/1, 1/10, 1/50, ABERTA); `QuantityStepper`; "COMPRAR" e `FavoriteButton`; `NftMeta` (ID do token, Coleção, Atributos); `ShareLinks`; abas "Detalhes do NFT" e "Avaliações de colecionadores (19)"; `NftCarousel` "Mais desta coleção"; `Footer`.
- **Mobile:** voltar e favoritar sobre a imagem; imagem grande; painel com nome, nota em pílula, descrição, edição, ID, coleção, atributos; `BuyBar` fixa com "Qtd.", preço, "Comprar NFT" e botão de carrinho.

## API
`GET /nfts/:id`, `GET /nfts/:id/related`, `GET /nfts/:id/reviews`, `GET /cart`, favoritos, `POST /cart/items`. Tempo real: inscrição no NFT aberto.

## Subitens

### 1. Galeria
- **Desktop:** miniaturas verticais (botões com `aria-label` "Imagem 2 de 4") trocam a imagem principal.
- **Mobile:** **swipe** entre as imagens com indicadores discretos (não desenhados; criar no padrão).
- **Zoom:** a lupa (desktop) ou o toque na imagem (mobile) abre a imagem **em tela cheia** num `Dialog`, com setas e teclado (← →) para navegar; Esc fecha e devolve o foco.

### 2. Informações
- Nome, preço da edição selecionada, nota, descrição, ID do token, coleção, atributos — tudo da API.

### 3. Seletor de edição
- Pílulas 1/1, 1/10, 1/50, ABERTA (grupo de rádio acessível). Seleção inicial: a edição mais barata disponível.
- Trocar a edição atualiza preço e limite do stepper e volta a quantidade para 1.
- **Edição indisponível** (`available: 0`): pílula desabilitada com texto "Esgotado" (não só cor). Se todas estiverem esgotadas, "COMPRAR" fica desabilitado com "Esgotado".

### 4. Quantidade
- Inteira, mínimo 1. **Máximo = disponível na edição − quantidade dessa edição já no carrinho** (ABERTA: sem limite de estoque; aplicar teto técnico de 99).
- Quando já existe no carrinho, mostra "2 já no seu carrinho".
- No limite, o "+" fica desabilitado e o motivo aparece em texto ("Máximo disponível: 3").

### 5. Favoritar
- Otimista, persistido no servidor simulado (sobrevive a refresh e a novo login).
- Sem login: `/entrar?redirect=` e a ação é concluída na volta.

### 6. Comprar e adicionar ao carrinho
- **COMPRAR / Comprar NFT:** adiciona edição e quantidade escolhidas e **vai para `/carrinho`**.
- **Botão de carrinho (mobile):** adiciona e **fica** na página, anunciando "Adicionado ao carrinho".
- Mesmo NFT e edição já no carrinho: **soma**, respeitando o estoque.
- Erros `SOLD_OUT` / `QUANTITY_EXCEEDS_STOCK`: mensagem junto ao stepper, dados atualizados.

### 7. Abas Detalhes e Avaliações
- **Desktop:** abas "Detalhes do NFT" (texto, Rede, Contrato, Direitos autorais) e "Avaliações de colecionadores (N)".
- Avaliações **só leitura**: nota, autor, data, texto, com "Carregar mais".
- **Clicar na nota** (estrelas / "19 avaliações") rola até as abas, ativa Avaliações e move o foco para ela. **No mobile** (sem abas no Figma) abre as avaliações num `Sheet`.

### 8. Mais desta coleção (desktop)
- `NftCarousel` com `GET /nfts/:id/related`; cada card igual ao da Início.

### 9. Compartilhar (desktop)
- Links reais: LinkedIn e Twitter abrem a página de compartilhamento em nova aba (com aviso "abre em nova aba"); e-mail abre `mailto:` com o link do NFT. Só a URL pública do NFT vai no link.

### 10. Breadcrumb
- "Início / Mercado / Emerald Ape #042", último item com `aria-current="page"` (decisão do usuário: incluir o nome).

### 11. Tempo real
- `nft:price_changed`: preço atualizado com selo "Atualizado" e aviso `polite`.
- `nft:stock_changed`: atualiza pílulas e limite do stepper; se a quantidade escolhida passou do novo limite, ajusta e avisa.

### 12. Estados
- **Acesso direto:** o `loader` da rota busca o NFT; refresh ou link compartilhado funcionam igual à navegação interna.
- **Carregando:** skeleton da página.
- **NFT inexistente (`404`):** página "NFT não encontrado" com link para o catálogo; título do documento correspondente.
- **Erro:** `ErrorState` com "Tentar novamente"; erro em avaliações ou relacionados não derruba a página.

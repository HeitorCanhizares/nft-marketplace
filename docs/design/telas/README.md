# Telas do Figma

Capturas tiradas do Figma em 2026-10-25. São a referência visual principal (o MCP do Figma tem limite de chamadas).

| Tela | Desktop | Mobile | Node desktop | Node mobile |
|---|---|---|---|---|
| Início | [desktop-inicio.png](desktop-inicio.png) ¹ | [mobile-inicio.png](mobile-inicio.png) | `2:2` | `14:5226` |
| Detalhes do NFT | [desktop-detalhes.png](desktop-detalhes.png) ¹ | [mobile-detalhes.png](mobile-detalhes.png) | `10:244` | `15:5536` |
| Carrinho | [desktop-carrinho.png](desktop-carrinho.png) ¹ | [mobile-carrinho.png](mobile-carrinho.png) | `11:1278` | `16:360` |
| Pagamento | [desktop-pagamento.png](desktop-pagamento.png) ¹ | [mobile-pagamento.png](mobile-pagamento.png) | `11:2862` | `16:748` |
| Confirmação | [desktop-confirmacao.png](desktop-confirmacao.png) ¹ | *não existe — adaptar* | `11:4385` | — |
| Login | [desktop-login.png](desktop-login.png) ¹ | [mobile-login.png](mobile-login.png) | `9:115` | `16:1022` |
| Cadastro | [desktop-cadastro.png](desktop-cadastro.png) ¹ | [mobile-cadastro.png](mobile-cadastro.png) | `9:1022` | `16:1228` |
| Perfil | [desktop-perfil.png](desktop-perfil.png) | *não existe — adaptar* | `9:1238` | — |
| Carteiras | [desktop-carteiras.png](desktop-carteiras.png) | *não existe — adaptar* | `9:1670` | — |

¹ Desde 2026-10-26, **todas as capturas estão em escala 1:1** (desktop 1440px, mobile 414px), recortadas do export completo do Figma feito pelo usuário. Dá para medir direto em pixels.

## Notas por tela

### Início
- Desktop: hero com texto + imagem e indicadores de carrossel; barra lateral de filtros (Coleções com contagem, Faixa de preço com "Aplicar", Rede com contagem) + card "NFT EM DESTAQUE"; abas do catálogo + ordenação; grade 3×3; paginação (1 2 3 4 >); dois cards promocionais; "Diário da Cunhagem" com 4 posts; rodapé.
- Card no hover (visto no fundo do Login): ações carrinho / favoritar / ver sobre a imagem. Selo "RARO".
- Mobile: busca "Explorar coleções" + botão de filtros; hero em card com gradiente; abas; grade de 2 colunas desalinhadas com coração na imagem; barra de abas inferior com botão central. Não tem filtros laterais, promo, blog nem rodapé.

### Detalhes do NFT
- Desktop: breadcrumb; galeria (4 miniaturas + imagem principal + zoom); título, preço, avaliação; "Sobre este NFT"; seletor de edição; quantidade; COMPRAR e Favoritar; ID do token, coleção, atributos, compartilhar; abas "Detalhes do NFT" e "Avaliações de colecionadores (19)"; "Mais desta coleção" em carrossel; rodapé.
- Mobile: voltar e favoritar no topo; imagem grande; painel com título, nota, descrição, edição, ID, coleção, atributos; barra fixa com quantidade, preço, "Comprar NFT" e botão de carrinho.

### Carrinho
- Desktop: tabela (NFTs, Preço, Edições, Total, lixeira) com stepper; painel lateral com código promocional, resumo de valores, "Conectar e finalizar" e "Continuar explorando"; carrossel "Colecionadores também viram"; rodapé.
- Mobile: título com voltar; cards com edição, preço e stepper; painel inferior com cupom, resumo e "Conectar e finalizar".

### Pagamento
- Desktop: formulário "Perfil do colecionador" (mesmo formulário da tela Carteiras) + "Usar outra carteira?" + observação; coluna "Seus NFTs" com itens, cupom recolhido, resumo, "Carteira e rede" (opções de rádio) e "Confirmar compra".
- Mobile: "Pagamento com carteira"; "Carteira conectada" com carteiras salvas (Reserva, Principal) e "Trocar carteira"; "Carteira e rede" com WalletConnect, MetaMask, Coinbase; total; "Confirmar compra". **Sem formulário do colecionador** (decisão: seguir como está).

### Confirmação
- Desktop: modal sobre o Pagamento com fundo escurecido: ícone "Thank you", "Seus NFTs agora estão na sua carteira", faixa ID da transação / Data / Total / Carteira, itens, taxa, total, mensagem e botão para o explorador.
- Mobile: adaptar como página cheia com `MobileTopBar`.

### Login e Cadastro
- Desktop: modal sobre a Início, com abas "Entrar | Criar conta", texto de apoio, campos, botão, "Ou continue com" e botões sociais.
- Mobile: página com logo KURIO grande, título, campos, botão em pílula, botões sociais e link para trocar entre login e cadastro.

### Perfil e Carteiras
- Desktop: `ProfileSidebar` + conteúdo. Perfil: dados, avatar, alterar senha, Salvar. Carteiras: carteira principal (formulário + "Salvar carteira"), carteira secundária vazia com "Igual à carteira principal" e "Adicionar".
- Mobile: adaptar com `MobileTopBar`; a navegação do perfil é a **tela de menu em lista** em `/perfil` (decidido na validação do Perfil).

## Inconsistências corrigidas

O usuário autorizou corrigir. Corrigir assim:

| No Figma | Corrigido para |
|---|---|
| "Resumo da carteira" no Carrinho | "Resumo do pedido" |
| IDs de token diferentes para o mesmo NFT entre telas (Violet Nomad #0009 / #0314) | O ID vem sempre da API; nunca fixo na interface |
| Botão "Ver no Etherscan" fixo | Nome e link do explorador conforme a rede do pedido (Etherscan, Polygonscan, Solscan) |
| "Nome ENS" no Pagamento só com `.eth` e sem campo | `EnsInput` completo, igual ao do Perfil |
| Cabeçalho do Perfil/Carteiras com "Entrar" e aba "Início" ativa | Cabeçalho logado (menu do usuário) e nenhuma aba ativa |
| Edição mobile "1/10, 1/10, 1/50" | "1/1, 1/10, 1/50", igual ao desktop |
| Carrinho mobile com lixeira sobreposta ao "+" | Lixeira no canto superior direito do card, separada do stepper (decisão do usuário) |
| Contador do carrinho "6" sem relação com os itens | Total de unidades do carrinho (decisão do usuário) |
| Opções de carteira no Pagamento desktop (uma linha com os 3 selos + MetaMask + Coinbase) | Três opções: WalletConnect, MetaMask, Coinbase Wallet |

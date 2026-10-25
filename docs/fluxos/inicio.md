# Início

**Rota:** `/` · **Telas:** [desktop](../design/telas/desktop-inicio.png), [mobile](../design/telas/mobile-inicio.png)
**Escopo do usuário:** destaques, catálogo, busca, filtros, ordenação e navegação para o NFT.
**Subitens:** ✅ validados pelo usuário em 2026-10-25.

## O que o Figma mostra
- **Desktop:** `HeroBanner` com "Bem-vindo à Kurio", "SEJA DONO DO FUTURO DA ARTE DIGITAL", texto, "EXPLORAR" e indicadores; `FilterPanel` lateral (Coleções com contagem, Faixa de preço + "Aplicar", Rede com contagem); `FeaturedNftCard`; `CatalogTabs` + `SortSelect`; `NftGrid` 3×3; paginação; dois `PromoCard`; "Diário da Cunhagem" com 4 `BlogCard`; `Footer`.
- **Mobile:** `SearchInput` "Explorar coleções" + botão de filtros; `HeroBanner` mobile ("SEJA DONO DA CULTURA DIGITAL"); `CatalogTabs`; `NftGrid` em 2 colunas desalinhadas com favorito na imagem; `MobileTabBar`.

## API
`GET /home`, `GET /nfts` (com `facets`), `PUT/DELETE /favorites/:id`, `POST /cart/items`. Tempo real: `nft:price_changed` e `nft:stock_changed` para os NFTs visíveis.

## Subitens

### 1. Hero
- Carrossel **automático com pausa**: troca a cada 6s; **para** com hover, com foco dentro do carrossel e quando `prefers-reduced-motion` está ativo.
- **Botão de pausar/retomar** visível junto aos indicadores (obrigatório pela WCAG 2.2.2; não está no Figma, criar no padrão).
- Indicadores clicáveis e navegáveis por teclado; swipe no mobile.
- "EXPLORAR" rola até o catálogo (`#catalogo`) e move o foco para o título do catálogo.
- Conteúdo vem de `GET /home` (`hero`).

### 2. NFT em destaque (desktop)
- `FeaturedNftCard` "NFT EM DESTAQUE / OFERTA LIMITADA" com o NFT de `GET /home` (`featured`). Clicar abre o detalhe.

### 3. Catálogo: grade e navegação entre páginas
- **Desktop:** `NftGrid` 3 colunas, 9 por página, paginação numérica (`1 2 3 4 >`) ligada a `?pagina=`. Ao trocar de página, rola para o topo do catálogo e move o foco para o título.
- **Mobile:** `NftGrid` em 2 colunas desalinhadas e botão **"Carregar mais"** no fim da grade, que acrescenta a próxima página abaixo. `?pagina=N` indica quantas páginas estão carregadas (recarregar mantém a lista). O foco vai para o primeiro card novo, e o total carregado é anunciado ("Mostrando 18 de 64 NFTs").
- Trocar filtro, aba, busca ou ordem volta para a página 1.

### 4. Abas do catálogo
- **Todos os NFTs**, **Novos lançamentos** (listados nos últimos 30 dias), **Em alta** (mais vendidos e favoritados nos últimos 7 dias).
- As abas **filtram**; a ordenação escolhida continua valendo.
- Ligadas a `?aba=`. Visual: cor + sublinhado na aba ativa.

### 5. Ordenação
- `SortSelect` "Ordenar por:" com: **Listados recentemente** (padrão), **Menor preço**, **Maior preço**, **Mais bem avaliados**, **Mais favoritados**.
- Ligada a `?ordem=`. No mobile (não desenhado), a ordenação fica dentro do drawer de filtros.

### 6. Filtros
- **Coleções** e **Rede**: **uma opção por grupo, aplicada na hora**. Clicar na opção ativa remove o filtro. Cada opção mostra a contagem vinda de `facets`. Opção ativa: cor + indicador visual (não só cor).
- **Faixa de preço**: `Slider` com dois cursores + texto "Preço: 0,02 – 12,30 ETH"; só aplica no botão **"Aplicar"**. Limites vindos de `facets.priceRange`.
- **Desktop:** barra lateral. **Mobile:** `Sheet` aberto pelo botão de filtros ao lado da busca, com os mesmos grupos, a ordenação, "Limpar filtros" e "Ver N resultados".
- Filtros ativos ficam na URL (`?colecao=`, `?rede=`, `?precoMin=`, `?precoMax=`).
- "Limpar filtros" sempre disponível quando houver filtro ativo.

### 7. Busca
- **Desktop:** a lupa do `Header` **expande um campo no próprio cabeçalho**. Enter leva ao catálogo da Início com `/?q=`. Funciona de qualquer página. Esc fecha e devolve o foco à lupa.
- **Mobile:** barra "Explorar coleções" no topo da Início, com debounce de 300ms, atualizando `?q=`.
- Requisições antigas são canceladas: o resultado sempre corresponde ao último termo digitado.

### 8. Card do NFT
- O card inteiro abre o detalhe (`/nft/$nftId`).
- **Desktop:** ações aparecem no hover **e no foco** (`:focus-within`): adicionar ao carrinho, favoritar, ver.
- **Adicionar ao carrinho pelo card:** adiciona **1 unidade da edição do preço exibido** (a mais barata disponível) e anuncia "Emerald Ape #042 adicionado ao carrinho". Escolher outra edição fica no detalhe.
- **Favoritar:** otimista; sem login leva a `/entrar?redirect=` e conclui a ação na volta.
- Selo "RARO" e preço riscado quando a API mandar `rarity` e `previousPrice`.
- NFT esgotado: botão de carrinho desabilitado com texto "Esgotado".

### 9. Filtro de favoritos
- A aba "Favoritos" da `MobileTabBar` abre `/?favoritos=1`: o catálogo mostra só os favoritos (decisão A4). Exige login.
- Título do catálogo muda para "Seus favoritos"; vazio mostra "Você ainda não favoritou nenhum NFT" + "Explorar NFTs".

### 10. Promos e blog (desktop)
- **"Lançamentos gênesis de edição limitada" → Explorar:** catálogo com aba **Novos lançamentos**.
- **"Arte digital selecionada e muito mais" → Explorar:** catálogo filtrado pela coleção **Arte digital**.
- **Blog "Diário da Cunhagem":** cards visíveis; **"Ler mais" desabilitado** ("Em breve"), pois não existe tela de post.

### 11. Tempo real no catálogo
- Inscreve os NFTs visíveis (`nft:subscribe`) e cancela ao sair ou trocar de página.
- Preço alterado: o valor muda no card com um selo **"Atualizado"** por alguns segundos.
- Estoque zerado: card passa a mostrar "Esgotado".
- Leitor de tela recebe **no máximo um aviso agrupado** a cada poucos segundos ("2 preços foram atualizados"), em `aria-live="polite"`.
- Nunca reordena a grade nem move o foco.

### 12. Estados
- **Carregando:** `NftCardSkeleton` na grade e skeleton do hero; ao trocar filtro, a grade anterior continua visível (esmaecida, `aria-busy`) até chegar a nova.
- **Vazio:** "Nenhum NFT encontrado" + "Limpar filtros".
- **Erro:** `ErrorState` só na área do catálogo (hero, promos e blog continuam) com "Tentar novamente". Erro em `GET /home` não derruba o catálogo.
- **Erro em ação do card** (carrinho, favorito): desfaz e avisa por toast + `aria-live`.

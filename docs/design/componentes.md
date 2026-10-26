# Componentes reutilizáveis

Regra: **nenhum componente visual nasce dentro de uma página.** As páginas (`src/pages/`) só montam componentes desta lista e ligam os dados. Se um bloco precisa de algo que não está aqui, o Sonnet pergunta ao usuário antes de criar, e o Opus adiciona aqui.

Quando um componente tem aparência diferente no desktop e no mobile, ele é **um componente com variantes** (`variant="desktop" | "mobile"` ou responsivo por CSS), nunca dois componentes copiados.

Legenda das telas: **IN** Início · **DE** Detalhes · **CA** Carrinho · **PG** Pagamento · **CO** Confirmação · **LO** Login · **CD** Cadastro · **PE** Perfil · **CT** Carteiras. Sufixo `d` = desktop, `m` = mobile.

## `components/ui/` — primitivos do shadcn

Instalados pelo CLI do shadcn e estilizados com os [tokens](tokens.md). Não contêm regra de negócio.

**Convenção de estados (descoberta no bloco 01-007):** o preset Nova gera seletores como `data-checked:`, que o Radix não emite. Para estilizar estados do Radix, use `data-[state=checked]`, `data-[state=open]` e similares. O 01-007 usou `aria-checked:`, que também funciona; padronizar em `data-[state=…]` quando o arquivo for tocado de novo. O mesmo vale para `data-open:` / `data-closed:` (corrigidos no `select.tsx`).

**Pendências herdadas da fase 01 (para as fases 03–04 e para os fluxos):**
- `<Toaster />` (Sonner): hoje em `bottom-center`; ao montar, usar `bottom-right` no desktop.
- Carousel: as setas ficam fora do container (`-left-12`); a página que usar setas deve conter esse excesso para não gerar rolagem horizontal no mobile.
- A conferir com o usuário na revisão visual: Tabs sem linha sob a lista (o Figma desktop tem, o mobile não) e Pagination com 40 px.
- Regra ESLint `set-state-in-effect` desligada só em `src/components/ui/**` (por causa do Carousel).

**Tokens customizados e `cn` (resolvido em 2026-10-26, commit `8271947`):** `src/lib/utils.ts` usa `createCn` de `cn/config` registrando os tamanhos de fonte (`tiny`, `caption`, `caption-md`, `body`, `heading`, `display`) e os raios (`mobile`, `media`) do projeto. **Ao criar um token novo de fonte ou raio em `globals.css`, registrá-lo também ali**; senão o `cn` descarta a classe. Não usar `!` para contornar.

**CLI do shadcn:** ao adicionar um componente, a CLI pode pedir para sobrescrever primitivos já estilizados (ex.: `button.tsx`, dependência do Dialog). Responder **não** sempre: os primitivos estilizados nunca são sobrescritos.

| Primitivo | Uso principal |
|---|---|
| Button | Todos os botões. Variantes implementadas (01-004): `default` (primary), `outline`, `ghost`, `link`, `icon`, `gradient` (botões em pílula do mobile). Tamanhos: `default`, `sm`, `lg`. |
| Input, Textarea, Label | Campos de formulário |
| Select | Rede, tipo de carteira, sufixo `.eth`, ordenação |
| RadioGroup | Seleção de carteira, "Usar outra carteira?", "Igual à carteira principal" |
| Checkbox | Filtros, se necessário |
| Dialog | Login/Cadastro (desktop), Confirmação (desktop) |
| Sheet | Drawer de filtros (mobile), menus de ação |
| Tabs | Abas do catálogo, Detalhes/Avaliações, Entrar/Criar conta |
| Slider | Faixa de preço (dois cursores) |
| Pagination | Paginação do catálogo |
| Carousel | Hero, "Mais desta coleção", "Colecionadores também viram" |
| Sonner (Toast) | Feedback de mutations |
| Skeleton | Estados de carregamento |
| Breadcrumb | Migalhas de navegação |
| Badge | Selo "RARO", contador do carrinho, edição |
| Separator, Avatar, DropdownMenu, Tooltip | Apoio |

## `components/layout/`

| Componente | Telas | Notas |
|---|---|---|
| `AppShell` | todas | Monta Header + conteúdo + Footer (desktop) ou conteúdo + MobileTabBar (mobile) |
| `Header` | todas d | Logo KURIO, navegação (Início, Mercado, Criadores, Aprenda), busca, carrinho com contador, Entrar ou menu do usuário logado. Criadores e Aprenda desabilitados. |
| `Footer` | IN, DE, CA, PG d | Destaques (W/C/D), newsletter (desabilitada), faixa de contato, colunas de links, redes sociais, carteiras compatíveis, copyright |
| `MobileTabBar` | IN m | Início, Favoritos, botão central (desabilitado), Carrinho, Perfil |
| `MobileTopBar` | CA, PG m (e telas adaptadas) | Botão voltar + título centralizado |
| `Breadcrumb` | DE, CA, PG d | Usa o primitivo do shadcn |
| `ProfileLayout` | PE, CT | ProfileSidebar + área de conteúdo |
| `ProfileSidebar` | PE, CT d | "Meu perfil": Dados do perfil, Carteiras, Atividade, Lista de interesse, Ofertas, Arquivos baixados, Suporte, Sair. Item ativo com barra lateral `primary`. Só os dois primeiros e Sair ficam habilitados. |

### Apoio do layout (fase 04)
| Item | Onde | Notas |
|---|---|---|
| `SvgIcon` | `src/assets/icons/` | Renderiza os SVGs do Figma como máscara CSS com `currentColor` |
| `ComingSoon` | itens desabilitados | `aria-disabled`, tooltip "Em breve" no foco |
| `PageSkeleton`, `FormSkeleton` | rotas e formulários | Skeletons base; os de dados nascem com seus componentes |
| `RouteFallbacks` | rota raiz | 404, erro e carregamento |
| `useMediaQuery` / `useIsDesktop` | hooks | Breakpoint de 1024 px (A5) |
| `useRouteChrome` | hooks | Lê o `staticData` da rota (rodapé, barra mobile, título) |
| `useRouteFocus` | hooks | Foco no `<h1>` e `document.title` a cada troca de rota |
| `useSignOut` | hooks | Navega para `/` e encerra a sessão |
| `useDeferredEmptyValidation` | hooks (fase 05) | Envolve o resolver do react-hook-form: antes do primeiro envio, campo vazio não mostra erro de "obrigatório" ao sair; erros de formato continuam. **Usar em todos os formulários** (regra em `decisoes.md`). Chamar `markSubmitAttempt()` antes do `handleSubmit`. |

## `components/shared/` — componentes de domínio

### Catálogo e NFT
| Componente | Telas | Notas |
|---|---|---|
| `NftCard` | IN, DE, CA, LO/CD (fundo) | Imagem, nome, preço (`PriceTag`), selo `RarityBadge`. Hover no desktop mostra ações: adicionar ao carrinho, favoritar, ver. No mobile o favorito fica fixo no canto da imagem. |
| `NftGrid` | IN | Grade de `NftCard`: 3 colunas no desktop, 2 colunas desalinhadas (efeito masonry) no mobile, como no Figma |
| `NftCarousel` | DE ("Mais desta coleção"), CA ("Colecionadores também viram") | Título da seção + Carousel de `NftCard` + indicadores |
| `PriceTag` | IN, DE, CA, PG, CO | Valor em ETH; opcionalmente preço anterior riscado (ex.: Neon Vessel `1.99 ETH ~~2.29 ETH~~`) |
| `RarityBadge` | IN | Selo "RARO" |
| `FavoriteButton` | IN, DE | Coração; desktop com texto "Favoritar", mobile só ícone. Otimista. |
| `HeroBanner` | IN | Variante desktop (texto + imagem grande + indicadores) e mobile (card com gradiente + imagens sobrepostas). Carrossel automático com botão de pausar/retomar. |
| `LoadMoreButton` | IN m | "Carregar mais" no fim da grade, com estado de carregamento e anúncio do total carregado |
| `FeaturedNftCard` | IN d | "NFT EM DESTAQUE / OFERTA LIMITADA" |
| `CatalogTabs` | IN | Todos os NFTs / Novos lançamentos / Em alta |
| `SortSelect` | IN d | "Ordenar por: Listados recentemente" |
| `SearchInput` | IN m (barra "Explorar coleções"), Header d (campo que expande a partir da lupa) | Com debounce no mobile; Enter no desktop |
| `FilterPanel` | IN | Coleções e Rede (uma opção por grupo, aplicada na hora, com contagem), Faixa de preço (Slider + "Aplicar"). Desktop: barra lateral. Mobile: dentro de um Sheet aberto pelo botão de filtro, junto com a ordenação. |
| `PromoCard` | IN d | "Lançamentos gênesis..." / "Arte digital selecionada..." |
| `BlogCard` | IN d | "Diário da Cunhagem": data, tempo de leitura, título, resumo, "Ler mais" |
| `SectionHeading` | IN, DE, CA | Título de seção com linha divisória |
| `NftGallery` | DE | Miniaturas verticais + imagem principal + botão de zoom (desktop). No mobile: imagem grande no topo, sem miniaturas. |
| `EditionSelector` | DE | Pílulas: 1/1, 1/10, 1/50, ABERTA. Grupo de rádio acessível. |
| `QuantityStepper` | DE, CA | Botões − e + com o número no meio. Limita ao estoque disponível. |
| `RatingStars` | DE | Estrelas + contagem (desktop) ou pílula "★ 4.8 (19)" (mobile) |
| `ShareLinks` | DE d | LinkedIn, e-mail, Twitter |
| `NftMeta` | DE | ID do token, Coleção, Atributos |
| `BuyBar` | DE m | Barra fixa inferior: Qtd. + preço + "Comprar NFT" + botão de carrinho |

### Carrinho, pagamento e pedido
| Componente | Telas | Notas |
|---|---|---|
| `LineItem` | CA, PG, CO | Miniatura, nome, ID do token ou edição, quantidade, total. Variantes: `cart-row` (CA d, tabela com stepper e lixeira), `cart-card` (CA m), `summary` (PG d, com "(x 2)"), `receipt` (CO). |
| `LineItemList` | CA, PG, CO | Lista de `LineItem` com cabeçalho (NFTs / Preço / Edições / Total) |
| `PriceSummary` | CA, PG, CO | Subtotal, Desconto do lançamento, Taxa de rede ("Taxa estimada"), Total |
| `CouponField` | CA, PG | Campo "Código promocional" + "Aplicar". Mostra estados: aplicado (com "Remover cupom"), inválido, expirado. No PG começa recolhido ("Tem um código promocional? Aplique aqui"). |
| `WalletProviderOption` | PG | Card de rádio: WalletConnect, MetaMask, Coinbase Wallet (ícone + nome) |
| `SavedWalletOption` | PG m | Card de rádio com carteira salva: nome (Reserva/Principal), endereço ou ENS, rede, menu "⋮" |
| `WalletForm` | PG d ("Perfil do colecionador"), CT (principal e secundária) | **Mesmo formulário nas duas telas**: Nome de exibição, Nome de usuário, Rede, Nome do perfil, Endereço da carteira, ENS ou carteira secundária, Tipo de carteira, Código de indicação, E-mail, Nome ENS. Campos extras por contexto (Apelido da carteira em CT; Observação do colecionador em PG). |
| `OrderReceipt` | CO | Ícone "Thank you", título, faixa com ID da transação / Data / Total / Carteira, `LineItemList` variante `receipt`, taxa e total, mensagem de status e botão para o explorador da rede |
| `OrderStatus` | CO (estado não desenhado) | Pendente, confirmado, recusado. O `OrderReceipt` só é renderizado com status confirmado. |
| `CheckoutReview` | PG (não desenhado) | Resumo final antes do envio, com mudanças destacadas e "Confirmar e pagar". `Dialog` no desktop, `Sheet` no mobile. |
| `WalletConnectionStatus` | PG (não desenhado) | Não conectada / Conectando / Conectada (endereço) / Recusada / Rede diferente, com ação correspondente |
| `QuoteChangeList` | PG, CA | Lista textual de mudanças (preço, esgotado, cupom, taxa) com antes → depois |
| `WalletBadges` | Footer, PG | "METAMASK · WALLETCONNECT · COINBASE" |

### Formulários e conta
| Componente | Telas | Notas |
|---|---|---|
| `FormField` | todos os formulários | Label, asterisco de obrigatório, campo, mensagem de erro ligada por `aria-describedby`. Integra com react-hook-form. |
| `PasswordInput` | LO, CD, PE | Campo com botão olho para mostrar/ocultar |
| `EnsInput` | PG, PE, CT | Select de sufixo (`.eth`) + campo de nome |
| `AvatarUploader` | PE | Avatar circular + "Alterar" + "Remover" |
| `AuthForm` | LO, CD | Formulário de login ou de cadastro; usado dentro do Dialog (desktop) e da página (mobile) |
| `AuthTabs` | LO, CD d | "Entrar \| Criar conta" como `nav` de links com `aria-current`; ativa com cor + sublinhado de 2 px |
| `AuthDialog` | LO, CD d | Moldura do modal (500 px, faixa inferior `primary`), sem escurecer o fundo |
| `LoginForm` / `SignupForm` | LO / CD | Formulários concretos sobre o `AuthForm` |
| `TextDivider` | LO, CD | Linha com texto ("Ou continue com") |
| `SocialAuthButtons` | LO, CD | "Continuar com Google/Facebook", **desabilitados** |
| `UserMenu` | Header d (não desenhado) | Avatar/inicial + nome; menu com Dados do perfil, Carteiras, Sair |
| `SessionExpiryBanner` | todas (não desenhado) | Aviso 2 min antes da expiração com "Continuar conectado" |
| `ProfileMenuList` | PE m (não desenhado) | Tela de menu "Meu perfil" no mobile, com os mesmos itens do `ProfileSidebar` |
| `ConfirmPasswordDialog` | PE (não desenhado) | Pede a senha atual para confirmar a troca de e-mail |
| `UnsavedChangesGuard` | PE, CT (não desenhado) | Diálogo "Descartar alterações?" ao sair com formulário alterado |
| `PasswordRequirements` | CD, PE (não desenhado) | Lista de requisitos da senha com ícone + texto quando cumprido |
| `RetryCountdown` | LO (não desenhado) | Contagem regressiva acessível do bloqueio por tentativas |
| `Divider` com texto | LO, CD | "Ou continue com" |

### Estados (não desenhados; criar no padrão visual)
| Componente | Uso |
|---|---|
| `EmptyState` | Catálogo sem resultados, carrinho vazio, nenhuma carteira secundária |
| `ErrorState` | Falha de carregamento com botão "Tentar novamente" |
| `*Skeleton` | Um skeleton por componente de dados (`NftCardSkeleton`, `LineItemSkeleton`...) |
| `LiveRegion` | Região `aria-live` usada pelo `LiveAnnouncerContext` |
| `PriceChangedNotice` | Selo/aviso de preço alterado ou edição esgotada em cards e linhas do carrinho (no pagamento, as mudanças aparecem no `CheckoutReview` via `QuoteChangeList`) |

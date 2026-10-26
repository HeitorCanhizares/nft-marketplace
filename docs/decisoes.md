# Decisões

Registro de tudo que o usuário decidiu. Ao decidir algo novo, adicione aqui com a data.

## Decididas

### Stack e ferramentas (2026-10-25)
- Vite, **npm**.
- React + TypeScript, TanStack Router, TanStack Query, Axios, REST, Socket.IO, Tailwind CSS, shadcn/ui, MSW, Playwright, Lighthouse.
- Formulários: **react-hook-form + zod**.
- Estado só do cliente: **React Context**.
- Git: inicialmente não inicializar; **alterado** — inicia na fase 00 (ver "Fases de implementação").

### Arquitetura (2026-10-25)
- Pastas **por camada**. Árvore aprovada em [arquitetura/pastas.md](arquitetura/pastas.md).
- Rotas **baseadas em arquivos** (plugin do TanStack Router).
- Código (arquivos, componentes, variáveis) em **inglês**. Interface em **PT-BR**. URLs em **PT-BR**.
- Documentação em `docs/`, com a estrutura deste diretório.

### API simulada (2026-10-25)
- Toda a API é simulada pelo **MSW**, incluindo o tempo real (Socket.IO).
- Persistência do mock: **IndexedDB** para dados grandes e **localStorage** para dados pequenos ([api-mock/persistencia.md](api-mock/persistencia.md)).
- Latência e taxa de erro configuradas por **variáveis de ambiente** ([api-mock/cenarios.md](api-mock/cenarios.md)).
- Recursos mínimos: sessão/conta, NFTs, favoritos, carrinho, cotação, pedidos, perfil, carteiras.

### Design (2026-10-25)
- Seguir **cada layout exatamente como está** no Figma, mesmo quando desktop e mobile têm conteúdos diferentes (ex.: o Pagamento mobile não tem o formulário do colecionador).
- Telas mobile que não existem no Figma (**Confirmação, Perfil, Carteiras**): **adaptar do desktop** usando a linguagem visual do mobile.
- Estados que não foram desenhados (carregando, vazio, erro, toast, drawer de filtros no mobile, cabeçalho logado, pagamento recusado): **criar seguindo o padrão visual existente**.
- Itens sem tela ficam **visíveis e desabilitados**: Criadores, Aprenda, Atividade, Lista de interesse, Ofertas, Arquivos baixados, Suporte, botão central da barra mobile, login com Google/Facebook, newsletter do rodapé, "Esqueceu a senha?".
- Inconsistências do Figma **podem ser corrigidas** (lista em [design/telas/README.md](design/telas/README.md#inconsistências-corrigidas)).
- **Login e Cadastro**: mesma rota; **modal no desktop**, **página no mobile**.

### Pontos A1–A8 (aprovados em 2026-10-25)

Os outros documentos se referem a estes itens pelo código (A1, A2...).

| # | Assunto | Decisão |
|---|---|---|
| A1 | Carrinho sem login | Carrinho de visitante identificado por `cartId` no localStorage. No login, o mock mescla o carrinho do visitante com o do usuário. Pagamento exige login. |
| A2 | Confirmação de pedido | Rota `/pedido/$orderId`. Desktop: modal sobre o layout do Pagamento (como no Figma). Mobile: página. Mesmo padrão do Login. |
| A3 | Link "Mercado" do cabeçalho | Leva ao catálogo na Início (`/#catalogo`). Fica ativo em `/nft/*`, `/carrinho` e `/pagamento`, como no Figma. |
| A4 | Aba "Favoritos" da barra mobile | Abre a Início filtrada pelos favoritos (`/?favoritos=1`), já que não existe tela de favoritos. |
| A5 | Breakpoint | Abaixo de `1024px` usa o layout mobile; a partir de `1024px`, o desktop. Não existe layout de tablet no Figma. |
| A6 | Cenários forçados nos testes | Além das variáveis de ambiente, permitir sobrescrever o cenário pelo localStorage **só em dev e teste**, para o Playwright forçar um cenário por teste sem rebuild. |
| A7 | Dependências novas | `idb` (IndexedDB), `@mswjs/socket.io-binding` (Socket.IO no MSW), `embla-carousel-react` (carrossel do shadcn), `sonner` (toast do shadcn), `@axe-core/playwright` (acessibilidade nos testes), `@lhci/cli` (Lighthouse). |
| A8 | Fonte | Roboto Mono (estimada pela captura). Confirmar no Figma quando o limite renovar. |

### Fluxo Início (2026-10-25)
Subitens validados. Detalhes em [fluxos/inicio.md](fluxos/inicio.md).
- Mobile navega pelo catálogo com **"Carregar mais"**; desktop com paginação numérica.
- Filtros de Coleção e Rede: **uma opção por grupo, aplicada na hora**. Faixa de preço só no "Aplicar".
- Carrinho pelo card: adiciona **1 unidade da edição do preço exibido**.
- Hero: **carrossel automático com botão de pausa**, parando com hover, foco e `prefers-reduced-motion`.
- Busca no desktop: **campo que expande no cabeçalho**, levando a `/?q=`.
- Promos levam ao catálogo filtrado; "Ler mais" do blog **desabilitado**.
- Tempo real nos cards: **selo "Atualizado" + aviso agrupado** para leitor de tela.
- Abas: Novos = últimos 30 dias; Em alta = mais vendidos e favoritados em 7 dias. Abas filtram, a ordenação continua valendo.
- Ordenação: Listados recentemente, Menor preço, Maior preço, Mais bem avaliados, Mais favoritados.

### Fluxo Detalhes do NFT (2026-10-25)
Subitens validados. Detalhes em [fluxos/detalhes-nft.md](fluxos/detalhes-nft.md).
- "Comprar" adiciona e **vai ao carrinho**; botão de carrinho do mobile adiciona e fica.
- NFT/edição já no carrinho: **soma**, limitada ao estoque (o stepper desconta o que já está no carrinho).
- Zoom **em tela cheia**; mobile com **swipe** entre imagens.
- Avaliações **só leitura**; clicar na nota abre as avaliações (drawer no mobile).
- Compartilhar com **links reais**; breadcrumb **inclui o nome** do NFT.

### Fluxo Carrinho (2026-10-25)
Subitens validados. Detalhes em [fluxos/carrinho.md](fluxos/carrinho.md).
- Remover: **na hora, com "Desfazer"** no toast.
- Mobile: **lixeira no canto do card**.
- Quantidade mínima 1: **"−" desabilitado**; remover só pela lixeira.
- Contador do cabeçalho: **total de unidades**.
- Item esgotado ou com estoque insuficiente: **marca e bloqueia a finalização** até o usuário remover ou ajustar.

### Fluxo Pagamento (2026-10-25)
Subitens validados. Detalhes em [fluxos/pagamento.md](fluxos/pagamento.md).
- "Usar outra carteira?": escolher a **secundária** ou **preencher manualmente**.
- Carteira digitada à mão só é salva se marcar **"Salvar como carteira secundária"**.
- A carteira simulada **conecta ao escolher o provedor**.
- Mobile: "Trocar carteira" **desconecta** o provedor; menu "⋮" → **"Editar carteira"** (perfil, com volta ao pagamento).

### Fluxo Confirmação (2026-10-25)
Subitens validados. Detalhes em [fluxos/confirmacao.md](fluxos/confirmacao.md).
- Desktop: modal sobre o **Pagamento inerte e escurecido**.
- Pendente e recusado **no mesmo modal**; o recibo só aparece com o pedido confirmado.
- Explorador: **abre a URL simulada em nova aba**, sinalizada como "Transação simulada".
- Fechar leva à **Início**.
- Pendente há mais de 60s mostra aviso de demora.

### Fluxo Login (2026-10-25)
Subitens validados. Detalhes em [fluxos/login.md](fluxos/login.md).
- Login e Cadastro: **labels só para leitor de tela**, mantendo o visual do Figma.
- Aviso **2 min antes** da expiração com **"Continuar conectado"** (`POST /auth/refresh`).
- Mock bloqueia por **30s após 5 senhas erradas** (`429 TOO_MANY_ATTEMPTS`).
- Cabeçalho logado: **avatar + menu** (Dados do perfil, Carteiras, Sair).

### Fluxo Cadastro (2026-10-25)
Subitens validados. Detalhes em [fluxos/cadastro.md](fluxos/cadastro.md).
- Regras: usuário 3–20 (letras, números, `_`, `.`), senha 8+ com letra e número; valem também para Perfil e troca de senha.
- Disponibilidade de e-mail e usuário verificada **ao sair do campo** (`POST /auth/availability`) e no envio (409).
- **Requisitos da senha visíveis** abaixo do campo.
- Após criar: **login automático e volta ao fluxo**.

### Fluxo Perfil (2026-10-25)
Subitens validados. Detalhes em [fluxos/perfil.md](fluxos/perfil.md).
- Mobile: **tela de menu em lista** em `/perfil`; nova rota **`/perfil/dados`** (desktop: `/perfil` redireciona para ela).
- Avatar **enviado na hora** após pré-visualizar; remover pede confirmação.
- Troca de e-mail **exige a senha atual**.
- **Aviso de alterações não salvas** ao sair.
- Nome ENS e Apelido da carteira **opcionais** no perfil (Figma marcava como obrigatórios).

### Fluxo Carteiras (2026-10-25)
Subitens validados. Detalhes em [fluxos/carteiras.md](fluxos/carteiras.md).
- Formulário da principal **sempre visível**; "Adicionar" só sem principal (com principal vira "Editar").
- "Igual à carteira principal" **copia os dados uma vez**; depois são independentes.
- Extras aprovados: **remover a secundária** (`DELETE /wallets/secondary`) e **tornar a secundária principal** (`POST /wallets/swap`).
- Primeira carteira **pré-preenchida com os dados do perfil**.

### Setup (2026-10-25, confirmado pelo usuário na sessão do Sonnet)
- Ícones: **`lucide-react`** (instalado com o shadcn).
- Alias de importação **`@/`** → `src/`.
- **Tailwind CSS v4**.
- **ESLint 9** (com `jsx-a11y`) e **Prettier** (com o plugin do Tailwind), como propostos nos blocos 00-013 e 00-014.
- Dependências implícitas da stack aprovadas.
- Biblioteca base do shadcn: **Radix UI**; preset de estilo **Nova** (`shadcn init -t vite -b radix -p nova`). O visual final segue os tokens do Figma (fase 01), não o preset.
- Dependências trazidas pela CLI do shadcn e aceitas: `radix-ui`, `cn` (do shadcn, no lugar de `clsx` + `tailwind-merge`) e `shadcn`. A fonte **Geist** que a CLI adicionou foi **removida** (a fonte do projeto é a do Figma, A8).
- **TypeScript fixado em 6.0.x** (6.0.3), porque o `typescript-eslint` só aceita versões abaixo de 6.1 (o npm tinha instalado a 7.0.2 no bloco 00-002).
- `@hookform/resolvers` na versão exata **5.2.2** (versões mais novas dão `ERESOLVE`).
- **MSW 2.x**, porque o `@mswjs/socket.io-binding` não aceita a 3.
- **ESLint 9** mantido apesar do aviso de fim de suporte, porque o `jsx-a11y` ainda não aceita a 10.
- `.gitattributes` com **fim de linha LF** (no Windows, o CRLF quebrava o `format:check`).

### Fase 00 concluída (2026-10-25)
- Tag **`fase-00-setup`** no commit `b273ec4`, aprovada pelo usuário. Sem remoto.
- Validada num clone limpo: lint, format, typecheck, build, Playwright (desktop e mobile) e LHCI passando.
- Pendências herdadas:
  - **Fase 02:** confirmar que o modo `test` carrega o `.env.test`; decidir se o tempo real fica desligado nos testes.
  - **Fase 13:** tratar as 16 vulnerabilidades do `npm audit` trazidas pelo `@lhci/cli` (ferramenta de desenvolvimento).
  - **Fase 13:** performance mobile caiu de 99 para **86** na fase 02 (TBT ~440 ms, custo do seed e do MSW na inicialização). Sugestão do Sonnet: semear de forma preguiçosa e fora da thread principal.

### Fase 01 concluída (2026-10-25)
- Visual **aprovado pelo usuário**; tag **`fase-01-design-base`** no commit `aa48d78`.
- Tokens, Roboto Mono, escala 9–43 px, raio base 4 px, 20 primitivos do shadcn e teste de contraste.
- Tabs sem linha sob a lista e Pagination com 40 px aceitos como estão.
- Pendências para as próximas fases em [design/componentes.md](design/componentes.md) (posição do toast, setas do carrossel).

### Fase 02 — decisões do usuário (2026-10-25)
- **Tipos de domínio** (`src/types/`) e **`lib/storage.ts`** antecipados da fase 03 para a 02; schemas zod continuam na 03.
- **Seed com 283 NFTs**, imagens vindas do Figma, contagens escaladas a partir do Figma: Arte digital 39, Fotografia 14, Música 77, Arte 3D 46, Colecionáveis 27, Generativa 20, Jogos 23, Assinaturas 16, Utilidade 21; redes Ethereum 119, Polygon 78, Solana 86.
- Nos testes, o **tempo real fica ligado, sem oscilação aleatória** de preço e estoque (desligada quando `MODE === 'test'`, sem variável nova).
- Blocos da fase 02 aprovados com os pontos propostos pelo Sonnet: tipos `Review`, `Promo`, `Post` e `HomeResponse` com campos mínimos (bloco 02-001); endpoint técnico **`GET /api/health`**; senhas fictícias de teste em texto só em `tests/e2e/fixtures.ts`; imagens no formato do Figma (conversão para WebP na fase 13).

### Fase 02 concluída (2026-10-25)
- **Aprovada pelo usuário**; tag **`fase-02-mock-base`**. 64 testes do Playwright passando em desktop e mobile.
- Aprovado também: o servidor de tempo real envia **ping próprio a cada 20 s** (o binding do Socket.IO não envia).
- Pendência de performance (86 no mobile) registrada para a fase 13.

### Fase 03 concluída (2026-10-25)
- **Aprovada pelo usuário**; tag **`fase-03-app-base`** no commit `a54fab1`. 114 testes do Playwright passando (250 execuções sem falha).
- Aprovados: ponte de teste `window.__kurio` só em modo `test`; redirecionamento de sessão expirada na fase 05; falha de rede ao recuperar a sessão → segue como visitante e mantém o token; na expiração, o socket reconecta sem token e os dados privados e o rascunho ficam até o próximo login; `.claude/` no `.prettierignore`.
- Performance mobile 83–85 e LCP 2,8 s → pendência da fase 13 (cascata de imports dinâmicos; sugestão: pré-carregar em paralelo e semear de forma preguiçosa).

### Workflow (2026-10-26)
- O usuário passa a falar **só com o Opus**; o Opus cria Sonnet e Haiku como **subagentes**. Ver [README.md](README.md#papéis).
- Export do Figma recebido: as 15 capturas em `docs/design/telas/` foram trocadas por recortes **1:1**.
- **Ícones:** os 6 SVGs do Figma (Message, X, Arrow-Down, Search, User, Shop) vão para a pasta nova **`src/assets/icons/`** e substituem os equivalentes do lucide-react; o resto continua do lucide.
- A sessão separada do Sonnet deve ser arquivada (o arquivamento automático foi recusado porque ela ainda tinha um cliente do Remote Control conectado; arquivar pela barra lateral).

### Fase 04 — blocos aprovados (2026-10-26)
34 blocos em `docs/blocos/04-*`. Decisões do usuário:
- **Ícones:** no cabeçalho desktop, lupa e carrinho de linha do **lucide** (como na captura); os SVGs `search`, `shop` e `user` só na barra mobile; `x`, `arrow-down` e `message` nos primitivos e onde couberem.
- **SVG como componente:** `SvgIcon` com o arquivo como **máscara CSS** pintada com `currentColor` (sem dependência nova).
- **Ícones das redes sociais:** o **usuário vai exportar os 5 SVGs do Figma** (Facebook, Instagram, Twitter, LinkedIn, YouTube). O bloco 04-024 fica **parado** até eles chegarem.
- **Demais recomendações do Sonnet aprovadas:** `staticData` no TanStack Router para decidir rodapé, barra mobile e título; rotas provisórias com `<h1>` para as 11 rotas; `container-page` com 24 px de margem entre 1024 e 1247 px; busca do desktop expande no cabeçalho e leva a `/?q=…#catalogo`; recorte da barra mobile simplificado; contador do carrinho no mobile só no `aria-label`; `SearchInput` em `components/shared`; setas do carrossel resolvidas na fase 07; `cartCount={0}` até as fases 07–08; `toast` exposto na ponte de teste; `scrollRestoration` ligado; links do rodapé habilitados só para "Meu perfil" e as coleções; "Mercado" ativo também em `/pedido/*`; título do documento `"<título> | Kurio"`.
- **Valores medidos nas capturas 1:1** (alturas, larguras, cores do header, footer, `ProfileSidebar`, `MobileTopBar`, `MobileTabBar`) aprovados como estão nos blocos.

### Fase 04 — ajustes após verificação do header e rodapé (2026-10-26)
- **Itens "Em breve"** (newsletter do rodapé, Criadores, Aprenda e demais `ComingSoon`): **cor cheia, como no Figma**, sem opacidade. O estado aparece no cursor, no tooltip "Em breve" e no `aria-disabled`. Campos de formulário desabilitados de verdade continuam com o estilo de desabilitado.
- **Linha do cabeçalho** limitada à largura do conteúdo (1200 px), como no Figma, em todas as telas.
- **Ícone do "Entrar":** porta com seta saindo, como no Figma (`LogOutIcon` do lucide).
- **UserMenu:** a inicial do avatar vira decoração via CSS; o nome acessível fica "Menu de <nome>".
- Decisões técnicas do Opus: título do destaque do rodapé fica em 18 px (não há token de 17); o 04-033 exclui a regra `aria-hidden-focus` do axe com menus Radix abertos (falso positivo do `hideOthers`); Esc da busca só no campo (limitação do jsx-a11y) é aceito.

### Ícones das redes sociais (2026-10-26)
- O usuário pediu SVGs padrão da internet. Fonte: **Font Awesome Free 6.5.2** (marcas), via jsDelivr (`@fortawesome/fontawesome-free@6.5.2/svgs/brands`): `facebook-f`, `instagram`, `twitter`, `linkedin-in`, `youtube`, salvos como `facebook.svg`, `instagram.svg`, `twitter.svg`, `linkedin.svg`, `youtube.svg`.
- **Licença CC BY 4.0:** exige atribuição. O comentário de licença dentro de cada SVG é mantido (arquivos copiados sem edição).

### Fase 04 concluída (2026-10-26)
- **Aprovada pelo usuário**; tag **`fase-04-layout-estados`**. Clone limpo: 151 testes do Playwright passando (13 pulados por projeto); LHCI mobile: performance 84–86, acessibilidade 100, boas práticas 100, SEO 91, CLS 0, LCP ~3,05 s.
- Token novo **`--text-subtitle: 17px`** para o título dos destaques do rodapé, igual ao Figma (decisão do usuário).
- Desvios aceitos em relação ao Figma: menu do cabeçalho centralizado (24 px à direita do Figma); recorte da barra mobile simétrico; ponto sob o item ativo da barra mobile; ícones sociais do Font Awesome.
- Pendência de performance (LCP subiu ~0,25 s com o `AppShell`) somada à da fase 13.

### Fase 05 — blocos aprovados (2026-10-26)
49 blocos em `docs/blocos/05-*`. Decisões do usuário:
- **Logos coloridos dos botões sociais:** baixados da internet. `google.svg` = devicon 2.16.0 (`google-original`, licença MIT); `facebook-color.svg` = o "f" do Font Awesome Free 6.5.2 com a cor da marca `#1877F2` aplicada (CC BY 4.0, modificação indicada no comentário do arquivo). Renderizados como `<img>` (o `SvgIcon` é monocromático).
- **Acessibilidade acima do Figma em dois pontos:** olho da senha em `tan` (contraste 6,1:1; o Figma tem 1,7:1) e aba ativa de "Entrar | Criar conta" com **sublinhado de 2 px** além da cor.
- **Modal de Login/Cadastro sem escurecer o fundo**, como no Figma (camada transparente mantém o clique fora e a inertização; nova prop no `ui/dialog.tsx`).
- **Demais recomendações do Sonnet aprovadas** (relatório da fase 05): guardas `beforeLoad` com contexto do roteador e promessa `ready` no `AuthContext`; Home provisória atrás do modal; modal centralizado na viewport com rolagem interna; `AuthTabs` como `nav` de links com `aria-current`; raios mobile `rounded-3xl` (campo) e `rounded-4xl` (botão); título mobile 20 px; `--text-logo: 32px`; botão principal mobile liso (sem gradiente, como na captura); 5ª senha errada já devolve `429` com 30 s, contador só em memória; ação pendente em `kurio:pending-action` (sessionStorage, 10 min, fora do `clearPrivateSession`); aviso de ajustes do carrinho em toast de 10 s; aviso de expiração como faixa no topo (`role="alertdialog"`, sem mover o foco); fechar o modal devolve o foco ao "Entrar" (`skipRouteFocus`); `redirect` rejeita `\`, controle, >2048 caracteres e `/entrar`/`/cadastro`; placeholder "Senha" no login; correções pequenas do Figma (alinhamentos, sublinhado nos links de troca, anel de foco mantido); convenção de carrinhos no mock (`cart-<userId>` e `X-Cart-Id`); ETH em inteiros no mock.

### Fase 05 — ajustes após a verificação visual (2026-10-26)
- Link de troca no mobile ("Crie uma conta" / "Entre"): **mesma cor do texto ao redor (`muted-foreground`), sem negrito, com sublinhado**.
- Requisitos da senha visíveis no Cadastro aceitos (modal ~30 px mais alto que o Figma).
- **16 px** entre os botões sociais em todas as telas (o Figma usa 12 px só no login desktop).
- Modal de Login e de Cadastro **sem raio** nos dois (o Figma arredonda só o do Cadastro).

### Fase 05 concluída (2026-10-26)
- **Aprovada pelo usuário**, com 3 ajustes finais:
  - Modal de Login/Cadastro **ancorado pelo topo** (no Figma ele começa a 160 px do topo da página); erros crescem para baixo e nada sai de baixo do mouse ao trocar de aba.
  - Ação pendente **sem executor é descartada** após o login, sem erro.
  - Mensagens separadas: e-mail vazio → "Informe um e-mail."; formato inválido → "Informe um e-mail válido.".
  - **Validação de campo vazio só no envio:** sair de um campo vazio não mostra erro de "obrigatório" (evita que o layout se mova sob o mouse); erros de formato continuam aparecendo ao sair do campo. Vale para todos os formulários do projeto.
- Clone limpo: 458 testes passando (110 pulados por projeto), LHCI mobile performance 83, acessibilidade 100, boas práticas 100, SEO 91, LCP ~3,36 s (piorou ~0,3 s; pendência da fase 13).
- Baselines visuais de Login/Cadastro aprovadas (valem só no Windows, sufixo `-win32`).
- Conhecido: o mock ainda não tem rotas de carrinho, favoritos e carteiras (fases 06–10).

### Fases de implementação (2026-10-25)
Aprovadas. Detalhes em [blocos/README.md](blocos/README.md).
- 00 Setup → 01 Design base → 02 Mock base → 03 App base → 04 Layout e estados → 05 Login/Cadastro → 06 Início → 07 Detalhes → 08 Carrinho → 09 Perfil → 10 Carteiras → 11 Pagamento → 12 Confirmação → 13 Final.
- Handlers do MSW nascem **com cada fluxo**; a fase 02 faz só a base.
- **Baseline visual ao fim de cada fluxo**, aprovada pelo usuário.
- **Checkpoint do usuário ao fim de cada fase.**
- **Git local iniciado na fase 00** (substitui a decisão anterior de não inicializar): commit por bloco, tag por fase, sem push sem pedido.

### Requisitos funcionais do usuário (2026-10-25)
O usuário enviou requisitos de catálogo, carrinho, pagamento, confirmação, conta e sessão. Foram incorporados em `api-mock/`, `arquitetura/estado.md` e `fluxos/`. Consequências principais:
- Cupom **guardado no carrinho** (`PUT/DELETE /cart/coupon`), removível e persistente.
- Pedido criado com **revalidação** da cotação (`409 QUOTE_CHANGED`) e **nova confirmação** do usuário.
- **Revisão em modal (desktop) / drawer (mobile)** antes do envio.
- **Carteira simulada** em `services/wallet/` + `mocks/wallet/` (conexão, recusa, desconexão, troca de rede, assinatura recusada).
- Recibo a partir de **snapshot imutável**; exibido **só para pedido confirmado**.
- Confirmação **remove do carrinho só os itens e quantidades comprados**; falhas preservam o carrinho.
- Recuperação de pedido pendente após refresh/reconexão (`GET /orders?status=pending`).
- Rascunho do checkout preservado na expiração de sessão; `clearPrivateSession()` no logout e na troca de usuário.
- Senhas com hash PBKDF2 no mock; credenciais fictícias só no seed.

## Em aberto

Nenhum ponto de arquitetura em aberto. Pendências:
- ~~Validar os subitens dos fluxos~~ — todos os 9 fluxos validados ✅.
- ~~Validar as fases~~ ✅. Próximo passo: o **Sonnet** detalha a fase 00 em blocos.
- Confirmar tokens e fonte no Figma quando o limite do plano renovar.
- ~~Confirmar `lucide-react`~~ ✅ confirmado (ver "Setup").
- ~~Valores propostos nos blocos da fase 00~~ ✅ aprovados com a fase.

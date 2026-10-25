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

### Fase 01 concluída (2026-10-25)
- Visual **aprovado pelo usuário**; tag **`fase-01-design-base`** no commit `aa48d78`.
- Tokens, Roboto Mono, escala 9–43 px, raio base 4 px, 20 primitivos do shadcn e teste de contraste.
- Tabs sem linha sob a lista e Pagination com 40 px aceitos como estão.
- Pendências para as próximas fases em [design/componentes.md](design/componentes.md) (posição do toast, setas do carrossel).

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

# Login

**Rota:** `/entrar?redirect=` · **Telas:** [desktop](../design/telas/desktop-login.png) (modal sobre a Início), [mobile](../design/telas/mobile-login.png) (página)
**Escopo do usuário:** autenticação, validação e retorno ao fluxo anterior.
**Subitens:** ✅ validados pelo usuário em 2026-10-25.

## Requisitos do usuário (conta e sessão)
- Cadastro, login, logout e sessão são **obrigatórios** e integrados à API simulada.
- Checkout, perfil, carteiras, favoritos e pedidos **exigem autenticação**.
- A sessão é **recuperável após refresh**.
- Expiração durante a navegação **e durante o checkout** preserva o contexto para retomada ([estado](../arquitetura/estado.md#expiração-com-preservação-de-contexto)).
- **Logout e troca de usuário limpam os dados privados em cache e as inscrições da sessão anterior** ([estado](../arquitetura/estado.md#logout-e-troca-de-usuário)).
- Credenciais fictícias; senhas **nunca em claro** ([persistência](../api-mock/persistencia.md)).

## O que o Figma mostra
- **Desktop:** `Dialog` com `AuthTabs` ("Entrar" ativo), "Entre para gerenciar sua carteira, coleção e perfil de criador.", e-mail, `PasswordInput`, "Esqueceu a senha?", "Entrar", "Ou continue com", `SocialAuthButtons`.
- **Mobile:** logo KURIO, título "Entrar", mesmos campos, botão em pílula, sociais, "Novo na Kurio? Crie uma conta".

## API
`POST /auth/login`, `GET /auth/session`, `POST /auth/refresh`, `POST /auth/logout`.

## Subitens

### 1. Estrutura
- **Desktop:** `Dialog` sobre a Início (fundo inerte), com `AuthTabs` "Entrar | Criar conta" (trocar de aba navega para `/cadastro` mantendo o `redirect`). Esc/X fecham e levam ao `redirect` (ou `/`) se a página de origem for pública; se a origem exigir login, levam à Início.
- **Mobile:** página cheia; "Novo na Kurio? Crie uma conta" leva a `/cadastro` mantendo o `redirect`.
- **Desabilitados:** "Esqueceu a senha?", "Continuar com Google", "Continuar com Facebook" (`aria-disabled`, dica "Em breve").
- Usuário já logado em `/entrar` → vai para o `redirect` ou `/`.

### 2. Formulário e validação
- Campos com **label só para leitor de tela** (visual do Figma mantido); placeholder como no Figma.
- zod: e-mail obrigatório e válido; senha obrigatória.
- `PasswordInput` com botão olho (`aria-label` "Mostrar senha" / "Ocultar senha", `aria-pressed`).
- Erros em texto abaixo do campo, ligados por `aria-describedby`; foco no primeiro erro no envio.
- Foco no campo de e-mail ao abrir.

### 3. Autenticação e erros
- Botão "Entrar" com estado de carregamento; bloqueia duplo envio.
- `401 INVALID_CREDENTIALS`: mensagem no topo do formulário ("E-mail ou senha incorretos"), anunciada, **sem dizer qual campo** está errado; o e-mail é mantido e a senha é limpa.
- **Bloqueio:** após **5 tentativas erradas**, o mock responde `429 TOO_MANY_ATTEMPTS` por **30s**; a tela mostra contagem regressiva acessível ("Tente novamente em 30 segundos") e desabilita o botão até acabar.
- Falha de rede / 5xx: mensagem com "Tentar novamente", formulário preservado.

### 4. Retorno ao fluxo anterior
- Sucesso: volta para `redirect` (só caminhos internos começando com `/`) ou `/`.
- **Ação pendente** (ex.: favoritar, adicionar ao carrinho) é concluída após o login e anunciada.
- O carrinho do visitante é **mesclado** ao do usuário; ajustes por estoque são avisados.
- Vindo de uma expiração no checkout: restaura o rascunho do Pagamento (mesmo usuário).

### 5. Sessão recuperada após refresh
- Na inicialização, com token salvo, `GET /auth/session` restaura o usuário antes de renderizar rotas protegidas (tela de carregamento curta, sem piscar o botão "Entrar").
- Token vencido ou inválido: limpa a sessão e segue como visitante.

### 6. Expiração
- **2 minutos antes** de expirar: aviso acessível (`role="alertdialog"`, sem roubar o foco de um formulário em edição — aparece como banner com foco opcional) com **"Continuar conectado"** → `POST /auth/refresh` (novo `expiresAt`).
- Sem resposta: expira. Durante a navegação, vai para `/entrar?redirect=<atual>`; no checkout, salva o rascunho antes ([estado](../arquitetura/estado.md#expiração-com-preservação-de-contexto)).
- `401 SESSION_EXPIRED` em qualquer requisição dispara o mesmo fluxo.

### 7. Logout e troca de usuário
- "Sair" (menu do cabeçalho e perfil): `POST /auth/logout`, `clearPrivateSession()`, vai para a Início e anuncia "Você saiu da sua conta".
- Login de um usuário diferente do anterior: `clearPrivateSession()` antes de carregar os dados novos; nenhum dado do usuário anterior (favoritos, carrinho, carteiras, pedidos, rascunho) aparece.

### 8. Cabeçalho logado e rotas protegidas
- **Desktop:** no lugar de "Entrar", **avatar** (ou inicial do nome) + nome de exibição, abrindo menu (`DropdownMenu`) com **Dados do perfil** (`/perfil/dados`), **Carteiras** e **Sair**. Não desenhado; criar no padrão.
- **Mobile:** a aba Perfil da `MobileTabBar` leva a `/perfil` (ou a `/entrar` se deslogado).
- Rotas protegidas (`/pagamento`, `/pedido/*`, `/perfil`, `/perfil/dados`, `/perfil/carteiras`, favoritos) sem sessão → `/entrar?redirect=`.

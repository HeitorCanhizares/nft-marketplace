# Cadastro

**Rota:** `/cadastro?redirect=` · **Telas:** [desktop](../design/telas/desktop-cadastro.png) (modal), [mobile](../design/telas/mobile-cadastro.png) (página)
**Escopo do usuário:** criação de conta, validação e tratamento de conflito.
**Subitens:** ✅ validados pelo usuário em 2026-10-25.

## Requisitos do usuário
- Criação de conta integrada à API simulada, com validação e **tratamento de conflito** (incluindo erros retornados pela API).
- Senha guardada só como hash no mock; seeds com credenciais fictícias.
- Requisitos gerais de sessão em [login.md](login.md#requisitos-do-usuário-conta-e-sessão).

## O que o Figma mostra
- **Desktop:** `Dialog` com `AuthTabs` ("Criar conta" ativo), "Crie seu perfil de colecionador e conecte uma carteira quando quiser.", Nome de usuário, E-mail, Senha, Confirmar senha, "Criar conta", sociais.
- **Mobile:** logo, "Criar perfil de colecionador", mesmos campos, "Criar perfil", sociais, "Já tem uma conta? Entre".

## API
`POST /auth/availability`, `POST /auth/register`.

## Regras de validação (valem também para Perfil e troca de senha)
Schemas compartilhados em `src/schemas/`:
- **Nome de usuário:** 3–20 caracteres; letras, números, `_` e `.`; sem espaços; único sem diferenciar maiúsculas (o mock compara em minúsculas).
- **E-mail:** formato válido; único sem diferenciar maiúsculas.
- **Senha:** mínimo 8 caracteres, com pelo menos uma letra e um número.
- **Confirmar senha:** igual à senha.

## Subitens

### 1. Estrutura
- **Desktop:** `Dialog` sobre a Início (fundo inerte), `AuthTabs` "Entrar | Criar conta" (trocar de aba vai para `/entrar` mantendo o `redirect`).
- **Mobile:** página cheia; "Já tem uma conta? Entre" vai para `/entrar` mantendo o `redirect`.
- `SocialAuthButtons` desabilitados ("Em breve").
- Usuário já logado em `/cadastro` → `redirect` ou `/`.

### 2. Formulário e validação
- Labels **só para leitor de tela** (visual do Figma mantido).
- `PasswordInput` com olho nos dois campos de senha.
- **Requisitos da senha abaixo do campo** (`PasswordRequirements`): "8+ caracteres · letra · número", cada item marcado com ícone + texto quando cumprido, e lido pelo leitor de tela como parte da descrição do campo (sem anunciar a cada tecla).
- Validação ao sair do campo e no envio; erros ligados por `aria-describedby`; foco no primeiro erro.

### 3. Disponibilidade ao sair do campo
- Ao sair de **Nome de usuário** ou **E-mail** (com formato válido), consulta `POST /auth/availability` e mostra "Este nome de usuário já está em uso" / "Este e-mail já está cadastrado" no campo.
- Consulta com debounce e cancelamento (só vale a resposta do último valor); enquanto verifica, indicador discreto no campo.
- Falha na consulta não bloqueia o envio (o 409 cobre).

### 4. Criação e conflito no envio
- "Criar conta" / "Criar perfil" com estado de carregamento; bloqueia duplo envio.
- `409 EMAIL_TAKEN` / `USERNAME_TAKEN` (alguém pegou no meio-tempo): erro no campo, foco nele. Em e-mail em uso, link "Entrar com este e-mail" (vai para `/entrar` com o e-mail preenchido, sem pôr o e-mail na URL — passa por estado de navegação).
- `422 VALIDATION_ERROR`: erros do servidor nos campos (`setError`).

### 5. Login automático e volta ao fluxo
- Sucesso: sessão criada, toast/anúncio "Conta criada. Bem-vindo(a), <usuário>!", volta para `redirect` ou `/`, e conclui a ação pendente.
- O carrinho do visitante é mesclado ao da nova conta.
- Conectar carteira fica para depois ("quando quiser", como no Figma).

### 6. Erros de rede e servidor
- Falha de rede / 5xx: mensagem no topo com "Tentar novamente"; todos os campos preservados (as senhas também, enquanto o formulário estiver aberto).

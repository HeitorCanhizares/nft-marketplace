# Perfil do colecionador

**Rotas:** `/perfil` (menu no mobile; no desktop redireciona) e `/perfil/dados` (logado) · **Telas:** [desktop](../design/telas/desktop-perfil.png), mobile **adaptado**
**Escopo do usuário:** edição dos dados, avatar e alteração de senha.
**Subitens:** ✅ validados pelo usuário em 2026-10-25.

## Requisitos do usuário
- Validar os formulários de **perfil** e **senha**, incluindo **erros retornados pela API**.
- Alterações confirmadas **permanecem após refresh** (gravadas no IndexedDB do mock).
- Exige autenticação.

## O que o Figma mostra
- **Desktop:** `ProfileLayout` com `ProfileSidebar` ("Dados do perfil" ativo); "Perfil do colecionador": Nome de exibição*, Nome de usuário*, E-mail*, Nome ENS* (`EnsInput`), Apelido da carteira*, `AvatarUploader` (Alterar / Remover); "Alterar senha": Senha atual, Nova senha, Confirmar nova senha (`PasswordInput`); "Salvar".
- **Mobile:** não existe. Adaptar (abaixo).

## API
`GET /profile`, `PATCH /profile`, `POST /auth/availability`, `PUT/DELETE /profile/avatar`, `POST /profile/password`, `POST /auth/logout`.

## Subitens

### 1. Layout e navegação
- **Desktop:** `ProfileSidebar` com Dados do perfil, Carteiras, Atividade, Lista de interesse, Ofertas, Arquivos baixados, Suporte e Sair. Só Dados, Carteiras e Sair habilitados; os demais com `aria-disabled` e "Em breve". Item ativo: barra `primary` + `aria-current="page"`. `/perfil` redireciona para `/perfil/dados`.
- **Mobile:** `/perfil` mostra a **tela de menu em lista** ("Meu perfil", com avatar e nome no topo), com os mesmos itens do menu lateral. Cada item abre sua rota (`/perfil/dados`, `/perfil/carteiras`) com `MobileTopBar` e voltar para o menu. Conteúdo em uma coluna.

### 2. Dados do perfil (`/perfil/dados`)
- **Obrigatórios:** Nome de exibição, Nome de usuário, E-mail. **Opcionais** (sem asterisco, decisão do usuário): Nome ENS (`EnsInput`) e Apelido da carteira.
- Pré-preenchido com `GET /profile`. Após o cadastro, o nome de exibição começa igual ao nome de usuário.
- Mesmas regras de validação do Cadastro ([cadastro.md](cadastro.md#regras-de-validação-valem-também-para-perfil-e-troca-de-senha)).
- Usuário e e-mail alterados: disponibilidade verificada ao sair do campo (`POST /auth/availability`, ignorando o próprio valor atual) e `409` tratado no envio.

### 3. Troca de e-mail
- Se o e-mail mudou, ao salvar abre um `Dialog` "Confirme sua senha" pedindo a **senha atual** antes de enviar (`PATCH /profile` com `currentPassword`).
- Senha errada: `422 INVALID_CURRENT_PASSWORD` no campo do diálogo; o restante do formulário é mantido.

### 4. Avatar
- "Alterar" abre o seletor de arquivo (png, jpg, webp, até 2 MB; validado no front e no mock).
- Mostra a **prévia** com "Usar esta foto" / "Cancelar"; ao confirmar, **envia na hora** (`PUT /profile/avatar`), independente do "Salvar". Imagem com `alt` "Sua foto de perfil".
- "Remover" pede confirmação e chama `DELETE /profile/avatar`; volta ao ícone padrão.
- Sucesso e erro anunciados; o avatar do `UserMenu` atualiza junto.

### 5. Alterar senha
- Senha atual, Nova senha, Confirmar nova senha, com `PasswordInput` e `PasswordRequirements` na nova senha.
- Só é enviada se algum campo de senha foi preenchido; aí os três são obrigatórios. Nova senha diferente da atual.
- `422 INVALID_CURRENT_PASSWORD`: erro em "Senha atual", foco nele.
- Sucesso: campos limpos, aviso "Senha alterada". A sessão atual continua; no mock, as outras sessões do usuário são encerradas.

### 6. Salvar
- Um botão "Salvar" (como no Figma) dispara **dois envios independentes**: dados (`PATCH /profile`) e senha (`POST /profile/password`, se preenchida). Erro em um não desfaz o outro; cada erro aparece no seu bloco.
- Botão com estado de carregamento; bloqueia duplo envio; desabilitado sem alterações.
- Sucesso: toast + anúncio "Perfil atualizado". **Persistem após refresh.** Cabeçalho (`UserMenu`) atualiza o nome.

### 7. Alterações não salvas
- Navegar para outra rota com alterações pendentes: `Dialog` "Descartar alterações?" (Descartar / Continuar editando).
- Fechar ou recarregar a aba: aviso nativo do navegador (`beforeunload`).

### 8. Sair
- "Sair" (menu lateral, menu mobile e `UserMenu`): mesmo fluxo de logout do [Login](login.md#7-logout-e-troca-de-usuário).

### 9. Estados
- **Carregando:** skeleton do formulário.
- **Erro ao carregar:** `ErrorState` com "Tentar novamente".
- **Erro ao salvar:** mensagens por campo (API) ou no topo (rede/5xx), formulário preservado.

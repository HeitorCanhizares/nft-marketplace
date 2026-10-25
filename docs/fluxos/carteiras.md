# Carteiras

**Rota:** `/perfil/carteiras` (logado) · **Telas:** [desktop](../design/telas/desktop-carteiras.png), mobile **adaptado**
**Escopo do usuário:** cadastro e edição de carteiras principal e secundária.
**Subitens:** ✅ validados pelo usuário em 2026-10-25.

## Requisitos do usuário
- Validar o formulário de carteiras, incluindo **erros retornados pela API**.
- Alterações confirmadas **permanecem após refresh**.
- As carteiras cadastradas são **usadas no Pagamento** (seleção, rede e conexão simulada).
- Exige autenticação.

## O que o Figma mostra
- **Desktop:** `ProfileLayout` ("Carteiras" ativo); "Carteira principal" + "Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados." + "Adicionar"; `WalletForm` (Nome de exibição, Apelido da carteira, Rede, Nome do perfil, Endereço da carteira, ENS ou carteira secundária, Tipo de carteira, Código de indicação, E-mail, Nome ENS); "Salvar carteira"; "Carteira secundária" vazia com "Você ainda não adicionou uma carteira secundária.", rádio "Igual à carteira principal" e "Adicionar".
- **Mobile:** não existe. Adaptar (abaixo).

## API
`GET /wallets`, `PUT /wallets/primary`, `PUT /wallets/secondary`, `DELETE /wallets/secondary`, `POST /wallets/swap`, `GET /profile` (pré-preenchimento).

## Subitens

### 1. Layout
- **Desktop:** `ProfileLayout` com "Carteiras" ativo no `ProfileSidebar`.
- **Mobile:** tela própria com `MobileTopBar` "Carteiras" e voltar para o menu do perfil (`/perfil`); conteúdo em uma coluna.
- Vindo do Pagamento (menu "⋮" → "Editar carteira"), mostra "Voltar ao pagamento" e retorna para lá após salvar.

### 2. Carteira principal
- O `WalletForm` fica **sempre visível**, como no Figma.
- **Sem principal:** formulário **pré-preenchido com os dados do perfil** (nome de exibição, usuário, e-mail, ENS); o link do título é **"Adicionar"** e leva o foco ao primeiro campo.
- **Com principal:** formulário preenchido com a carteira, o link vira **"Editar"** (foco no primeiro campo).
- "Salvar carteira" → `PUT /wallets/primary`; estado de carregamento; desabilitado sem alterações.

### 3. Carteira secundária
- **Vazia:** "Você ainda não adicionou uma carteira secundária." com **"Adicionar"** (abre um `WalletForm` vazio, pré-preenchido do perfil) e **"Igual à carteira principal"**.
- **"Igual à carteira principal"** (exige principal cadastrada; senão desabilitado com o motivo): **copia os dados da principal uma única vez** para o formulário da secundária, para ajustar e salvar. Depois as duas são independentes.
- **Cadastrada:** formulário preenchido para editar; "Salvar carteira" → `PUT /wallets/secondary`.

### 4. Remover a secundária
- Botão "Remover carteira secundária" com `Dialog` de confirmação → `DELETE /wallets/secondary`. Volta ao estado vazio; foco no "Adicionar".

### 5. Tornar a secundária principal
- Botão "Tornar principal" na secundária, com confirmação → `POST /wallets/swap`: as duas trocam de lugar. Anúncio "Carteiras trocadas".
- Desabilitado enquanto um dos formulários tiver alterações não salvas.

### 6. Validação e erros da API
- **Mesmo schema zod do Pagamento** (`WalletForm`): obrigatórios com asterisco; endereço `0x` + 40 hex; e-mail válido; ENS com o `EnsInput`.
- `422 VALIDATION_ERROR` com `fields` → erros nos campos (`setError`), foco no primeiro.
- Rede/5xx → mensagem no topo do bloco, formulário preservado.

### 7. Persistência, Pagamento e alterações não salvas
- Alterações salvas ficam no IndexedDB do mock e **sobrevivem a refresh**.
- Salvar ou trocar invalida a query `wallets`; o Pagamento passa a usar os dados novos (principal pré-preenche o formulário do desktop; as duas aparecem como `SavedWalletOption` no mobile).
- Sair com alterações não salvas: `UnsavedChangesGuard` ("Descartar alterações?") e aviso do navegador.

### 8. Estados
- **Carregando:** skeleton dos dois blocos.
- **Erro ao carregar:** `ErrorState` com "Tentar novamente".

# 09-016 — Casos de borda do perfil adiados para a fase 13

**Status:** concluído
**Depende de:** 09-015

Testes que **não** são escritos na fase 09 (modo enxuto). O comportamento já está implementado e documentado.

## Dados e disponibilidade
- Campo obrigatório vazio só acusa no envio; formato inválido ao sair do campo (usuário 3–20, e-mail, nome de exibição até 40, apelido até 30, ENS 3–63 minúsculas/números/hífen).
- `POST /auth/availability` com falha: não bloqueia; `409 EMAIL_TAKEN` e `USERNAME_TAKEN` no envio (ambos juntos) com foco no primeiro campo; conflito ignora o próprio valor, sem diferenciar maiúsculas.
- Limpar ENS e apelido (campos opcionais) grava vazio.

## Troca de e-mail
- `INVALID_CURRENT_PASSWORD` mantém o diálogo com o erro e o formulário; Esc/Cancelar fecha e limpa; campo vazio acusa só ao enviar; clique repetido em "Confirmar": uma só requisição.
- `409 EMAIL_TAKEN` depois da senha certa fecha o diálogo e mostra o erro no campo.

## Avatar
- Arquivo fora de png/jpg/webp e acima de 2 MB rejeitados no front (mensagem anunciada) e no mock (`422` com `fields.file`); prévia cancelada devolve o foco e revoga a URL; clique repetido em "Usar esta foto" e "Remover": uma só requisição.
- Erro de rede/5xx no envio mantém a prévia; erro ao remover mantém a foto; "Remover" desabilitado sem foto; avatar do `UserMenu` atualiza junto.

## Senha
- Só um campo de senha preenchido: os outros acusam "obrigatório"; confirmação diferente; nova igual à atual (front e `422` do mock); requisitos (8+, letra, número) sem anúncio por tecla.
- `INVALID_CURRENT_PASSWORD`: erro em "Senha atual" com foco; sucesso encerra as **outras** sessões do usuário (sessão atual continua) e o login com a senha nova funciona.

## Salvar
- Dados com erro e senha ok (e o inverso): um bloco não desfaz o outro; erro de rede/5xx mostra a mensagem no bloco certo e preserva o formulário; "Salvar" desabilitado sem alterações; duplo clique: uma requisição por bloco; persistência após refresh.
- Anúncios: "Perfil atualizado" e "Senha alterada" (`polite`), erros (`assertive`).

## Alterações não salvas e sessão
- `beforeunload` ao fechar/recarregar com alterações; "Descartar alterações?" ao navegar por link, voltar do navegador e "Sair" com formulário alterado.
- Sessão expirada durante a edição (`session-expired`): vai a `/entrar` sem ficar preso no diálogo; `session-expired` em `GET /profile`.

## Estados e acessibilidade
- `500` e erro de rede no carregamento (`ErrorState` com "Tentar novamente"); skeleton com latência alta; perfil sem ENS, apelido e avatar.
- Redimensionar de mobile para desktop em `/perfil` redireciona; acesso direto a `/perfil/dados` deslogado vai ao login e volta.
- Teclado: ordem dos campos, Enter envia, seletor de arquivo, diálogos; leitor de tela: erros e anúncios; overflow em 320 px e zoom 200 %; `prefers-reduced-motion`.
- Título do documento e foco no `h1` ao navegar entre `/perfil` e `/perfil/dados`.

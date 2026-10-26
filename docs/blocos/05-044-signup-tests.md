# 05-044 — Testes do Cadastro

**Status:** pendente
**Responsável:** Sonnet (o Haiku não escreve testes)
**Fluxo / subitem:** Cadastro › 1 a 6
**Depende de:** 05-012, 05-036, 05-041, 05-042

## Objetivo
Provar o Cadastro de ponta a ponta com Playwright (desktop e mobile): regras, requisitos da senha, disponibilidade, conflitos, login automático e erros.

## Arquivos
- criar: `tests/e2e/signup.spec.ts`

## Referências
- docs/qualidade/testes.md (Login/Cadastro: validação; conflito de e-mail e de usuário) e docs/api-mock/cenarios.md (`email-taken`, `username-taken`, `validation-error:<rota>`, `network-error`, `server-error`)
- docs/fluxos/cadastro.md
- `tests/e2e/fixtures.ts` (`users.primary`: e-mail `teste@kurio.test`, usuário `teste`)

## Instruções
O Sonnet escreve. **[d]** = só `desktop`, **[m]** = só `mobile`.
1. **[d] Estrutura:** `/cadastro` abre `dialog` "Criar conta" sobre a Início; abas com "Criar conta" `aria-current="page"`; texto "Crie seu perfil de colecionador e conecte uma carteira quando quiser."; os quatro campos acessíveis por `getByLabel` ("Nome de usuário", "E-mail", "Senha", "Confirmar senha"), foco inicial em "Nome de usuário"; trocar para "Entrar" mantém o `redirect`. **[m]:** `h1` "Criar perfil de colecionador", botão "Criar perfil", link "Entre" (com `redirect`), sem `dialog`.
2. **Regras de validação** (ao sair do campo e no envio): usuário `ab`, 21 caracteres, `com espaço`, `açúcar` → erro; `Heito_1.x` → ok. E-mail inválido → erro. Senha `semnumero`, `12345678`, `curta1` → erro; `Açaí1234` (letra com acento) → ok. Confirmação diferente → "As senhas não coincidem." (inclusive com outro campo inválido). Foco no primeiro erro do envio; `aria-describedby` ligado.
3. **Requisitos da senha:** "8+ caracteres", "letra" e "número" mudam de pendente para cumprido ao digitar (conferir o texto `sr-only` ", cumprido"); a lista faz parte da descrição do campo (`toHaveAccessibleDescription`); **nenhuma** região `aria-live` muda a cada tecla (observar `status`/`alert` durante a digitação).
4. **Disponibilidade:** sair de "E-mail" com `teste@kurio.test` (também `TESTE@kurio.test`) → "Este e-mail já está cadastrado"; sair de "Nome de usuário" com `teste` e `TESTE` → "Este nome de usuário já está em uso"; valores livres não mostram erro; o indicador de verificação aparece durante a consulta (usar o cenário `slow` ou um handler lento); **resposta atrasada** de um valor antigo não aparece (trocar o valor antes de a primeira resposta chegar); `server-error:POST /auth/availability` **não** impede enviar; formato inválido não faz requisição.
5. **Sucesso:** cadastro válido → já logado, toast "Conta criada. Bem-vindo(a), <usuário>!", URL `/` (ou o `redirect`); [d] menu "Menu de <usuário>"; a requisição **não** contém `confirmPassword`; no IndexedDB (`usersStore`) o registro tem `passwordHash` e **não** contém a senha em texto; depois de sair, o mesmo e-mail e senha entram.
6. **Conflito no envio:** cenário `email-taken` → erro "Este e-mail já está cadastrado" no campo, foco nele e o link "Entrar com este e-mail" que abre `/entrar` com o e-mail **preenchido** e **sem** o e-mail na URL; cenário `username-taken` → erro e foco em "Nome de usuário". Conflito real (outro usuário cadastrado no meio-tempo): usar dois contextos ou plantar o usuário depois da checagem.
7. **`422`:** `validation-error:POST /auth/register` (chave `field`, desconhecida) → mensagem de formulário "Revise os dados informados."; um handler que devolva `fields.password` → erro no campo de senha.
8. **Rede e servidor:** `network-error:POST /auth/register` e `server-error:POST /auth/register` → mensagem no topo + "Tentar novamente"; **todos os campos, as senhas inclusive, seguem preenchidos**; limpar o cenário e reenviar conclui.
9. **Duplo envio:** duplo clique em "Criar conta" gera **uma** requisição e **um** usuário.
10. **`redirect`:** `/cadastro?redirect=/carrinho` termina em `/carrinho`; valores inválidos terminam em `/`.
Fechamento: `npm run lint && npm run format:check && npm run typecheck` → exit 0. Commit: `git add tests/e2e/signup.spec.ts` e `git commit -m "05-044: testes do Cadastro"`.

## Critérios de aceite
- [ ] Todos passam nos projetos `desktop` e `mobile` (cada um nos seus), duas execuções seguidas.
- [ ] Nenhum `data-testid` nem seletor CSS (exceção justificada em comentário).
- [ ] As senhas de teste vêm só de `tests/e2e/fixtures.ts` ou são geradas no teste; nenhuma em documentação.

## Verificação (Sonnet)
- `npm run test:e2e` → tudo verde; `npm run lint && npm run format:check && npm run typecheck && npm run build` → exit 0.

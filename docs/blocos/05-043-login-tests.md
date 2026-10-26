# 05-043 — Testes do Login

**Status:** concluído
**Responsável:** Sonnet (o Haiku não escreve testes)
**Fluxo / subitem:** Login › 1, 2, 3 e 4
**Depende de:** 05-012, 05-036, 05-041, 05-042

## Objetivo
Provar o Login de ponta a ponta com Playwright (desktop e mobile), com o mock real.

## Arquivos
- criar: `tests/e2e/login.spec.ts`

## Referências
- docs/qualidade/testes.md (Login/Cadastro: validação; credenciais inválidas; `redirect`; sessão; seletores por papel, **sem** `data-testid`; axe só `serious`/`critical`) e docs/api-mock/cenarios.md (`network-error:`, `server-error:`, cenários do A6)
- docs/fluxos/login.md
- `tests/e2e/helpers.ts`, `tests/e2e/fixtures.ts` (`users.primary`, `users.other`)

## Instruções
O Sonnet escreve. **[d]** = só projeto `desktop`, **[m]** = só `mobile` (`test.skip` por `testInfo.project.name`).
1. **[d] Estrutura:** abrir `/entrar` mostra `dialog` "Entrar" com a Início ao fundo **inerte** (o `h1` "Kurio" não é alcançável por Tab nem aparece em `getByRole`); foco inicial em "E-mail"; `navigation` "Entrar ou criar conta" com "Entrar" `aria-current="page"` e "Criar conta"; texto "Entre para gerenciar sua carteira, coleção e perfil de criador."; "Esqueceu a senha?", "Continuar com Google" e "Continuar com Facebook" com `aria-disabled="true"`, sem `disabled`; clicar neles não muda a URL e o foco mostra "Em breve" (`getByRole('tooltip')`).
2. **[m] Estrutura:** sem `dialog`; `h1` "Entrar"; link do logo "Kurio, página inicial" para `/`; texto "Novo na Kurio? Crie uma conta" com o link "Crie uma conta" para `/cadastro` **mantendo** o `redirect` (`/entrar?redirect=/carrinho` → `/cadastro?redirect=%2Fcarrinho`); sem barra inferior.
3. **Labels só para leitor de tela:** `getByLabel('E-mail')` e `getByLabel('Senha')` existem; os `label` não ocupam área visível (caixa ≤ 1 px).
4. **Validação:** enviar vazio mostra "Informe um e-mail." e "Informe sua senha." (ou as mensagens do schema), foco no primeiro campo com erro, `aria-invalid` e `aria-describedby` ligados ao texto; e-mail inválido mostra "Informe um e-mail válido." ao sair do campo; nenhuma requisição `POST /api/auth/login` foi feita.
5. **Sucesso:** credenciais de `users.primary` → URL `/`; [d] aparece o menu "Menu de Teste Kurio" e some o link "Entrar"; `localStorage['kurio:session']` guardado; recarregar a página mantém a sessão.
6. **`redirect`:** `/entrar?redirect=/carrinho` vai para `/carrinho` depois do login; `/entrar?redirect=//evil.com`, `/entrar?redirect=https://evil.com` e `/entrar?redirect=/entrar` vão para `/`.
7. **Credenciais inválidas:** senha errada → alerta "E-mail ou senha incorretos" **sem** citar qual campo; e-mail mantido, senha vazia e com foco; botão volta a funcionar.
8. **Bloqueio:** com `page.clock.install()` antes do `goto`, 5 senhas erradas → aparece "Tente novamente em 30 segundos" (`getByRole('timer')`), botão `aria-disabled`, a mensagem assertive é anunciada **uma vez** (e não por segundo); senha **certa** durante o bloqueio continua bloqueada; `clock.fastForward(31_000)` → botão habilitado, anúncio "Você já pode tentar novamente.", login funciona.
9. **Rede e servidor:** cenário `network-error:POST /auth/login` e `server-error:POST /auth/login` → mensagem "Não foi possível entrar agora…" + "Tentar novamente"; os campos (e a senha) seguem preenchidos; limpar o cenário e clicar "Tentar novamente" conclui o login.
10. **Duplo envio:** duplo clique em "Entrar" gera **uma** requisição (contar por `page.on('request')`).
11. **Já logado:** com sessão válida, abrir `/entrar` leva a `/`; com `redirect=/carrinho`, a `/carrinho`.
12. **[d] Fechar:** abrir pelo link "Entrar" do cabeçalho a partir de `/carrinho` e fechar com Esc → URL `/carrinho` e o foco volta ao link "Entrar"; com o X idem; abrir `/entrar?redirect=/pagamento` e fechar → `/`.
13. **Mostrar senha:** o botão alterna `aria-pressed`, o rótulo "Mostrar senha" ↔ "Ocultar senha" e o `type` do campo; o foco volta ao campo.
14. **Teclado:** Enter no campo de senha envia; Tab percorre e-mail → senha → olho → "Esqueceu" → "Entrar" → sociais → fechar (desktop, ordem no DOM, sem sair do modal).
15. **Aviso de ajustes e ação pendente** ficam no 05-045.
Fechamento: `npm run lint && npm run format:check && npm run typecheck` → exit 0. Commit: `git add tests/e2e/login.spec.ts` e `git commit -m "05-043: testes do Login"`.

## Critérios de aceite
- [ ] Todos passam nos projetos `desktop` e `mobile` (cada um nos seus), duas execuções seguidas.
- [ ] Nenhum `data-testid` nem seletor CSS (exceção justificada em comentário).
- [ ] Os testes das fases 00 a 04 continuam verdes.

## Verificação (Sonnet)
- `npm run test:e2e` → tudo verde; `npm run lint && npm run format:check && npm run typecheck && npm run build` → exit 0.

# 09-014 — Testes do perfil (caminho principal)

**Status:** pendente
**Fluxo / subitem:** Perfil › todos (modo enxuto)
**Depende de:** 09-013

> **Modo enxuto** (docs/decisoes.md): só o caminho principal. Casos de borda estão listados no 09-016.

## Objetivo
Um spec do fluxo, um de axe e uma baseline visual por tela (desktop e mobile, conforme o projeto).

## Arquivos (testes)
- criar: `tests/e2e/profile.spec.ts`
- criar: `tests/e2e/profile-a11y.spec.ts`
- criar: `tests/visual/profile.spec.ts`

## Referências
- `tests/e2e/cart.spec.ts`, `cart-a11y.spec.ts`, `tests/visual/cart.spec.ts` (estrutura, `ready`, `users`, `only`, `settle`, `signIn` pela ponte `window.__kurio.auth.signIn`), `tests/e2e/fixtures.ts` (`users.primary`: `teste@kurio.test`; `users.other`: `outro`)
- docs/fluxos/perfil.md; seed do usuário em `src/mocks/seed/users.ts` (Teste Kurio, `teste`)

## Instruções
1. `profile.spec.ts` (cada `test` roda uma vez; `only(testInfo, …)` para o que é só de um projeto; entrar com `signIn` e abrir a rota). Sem `waitForTimeout`; seletores por papel e nome.
   - **navegação desktop:** `/perfil` redireciona para `/perfil/dados`; "Dados do perfil" com `aria-current="page"` no menu lateral; "Atividade" com `aria-disabled`.
   - **navegação mobile:** `/perfil` mostra "Meu perfil", o nome "Teste Kurio" e os itens; "Dados do perfil" abre `/perfil/dados` com "Dados do perfil" na barra superior; "Voltar" leva a `/perfil`.
   - **dados:** campos vêm preenchidos ("Teste Kurio", `teste`, `teste@kurio.test`); trocar nome de exibição para "Colecionador Novo", ENS para `colecionador` e apelido para "Carteira 1"; "Salvar" → toast "Perfil atualizado"; o nome no `UserMenu` (desktop) muda; `reload` mantém os valores.
   - **disponibilidade:** digitar `outro` em "Nome de usuário" e sair do campo mostra "Este nome de usuário já está em uso"; voltar para `teste` (o próprio valor) limpa.
   - **e-mail:** trocar para `novo@kurio.test` e "Salvar" abre "Confirme sua senha"; informar `users.primary.password` e "Confirmar" fecha o diálogo e salva; `reload` mantém o novo e-mail.
   - **senha:** preencher "Senha atual" (`users.primary.password`), "Nova senha" (`Novasenha123`) e "Confirmar nova senha"; "Salvar" → "Senha alterada" e os três campos ficam vazios.
   - **avatar:** `setInputFiles` no campo de arquivo com um PNG pequeno em memória (buffer base64); aparece a prévia com "Usar esta foto"; confirmar → imagem "Sua foto de perfil" visível e o avatar do `UserMenu` com imagem; `reload` mantém; "Remover" → "Remover foto?" → confirmar volta ao ícone padrão.
   - **alterações não salvas:** digitar no nome e clicar em "Carteiras" abre "Descartar alterações?"; "Continuar editando" mantém a página e o valor; "Descartar" navega.
   - **sair:** "Sair" no menu lateral (desktop) e na lista (mobile) leva a `/` com o cabeçalho de visitante.
2. `profile-a11y.spec.ts`: axe (só `serious`/`critical`) em `/perfil/dados` (os dois projetos) e em `/perfil` (só mobile), como em `cart-a11y.spec.ts`; e os campos têm nomes acessíveis únicos (três de senha distintos).
3. `tests/visual/profile.spec.ts`: `toHaveScreenshot('perfil-dados.png', { fullPage: true })` com movimento reduzido e `settle` (campos vazios de senha, sem foto, como no Figma) e, só no mobile, `perfil-menu.png`. **A baseline só é aprovada pelo usuário no checkpoint.**
4. `npm run test:e2e -- profile` e `npm run test:e2e -- profile-a11y` verdes nos dois projetos; gerar a baseline com `npx playwright test tests/visual/profile.spec.ts --update-snapshots`. Commit: `09-014: testes do perfil`.

## Critérios de aceite
- [ ] Nenhum teste de falha de rede/5xx, cenário forçado, conflito 409 no envio, senha atual errada, arquivo inválido ou clique repetido.
- [ ] Cada teste independe dos outros (contexto novo, banco do mock recriado).

## Verificação (Sonnet)
- Specs acima verdes; uma captura lado a lado com o Figma por tela (desktop e mobile), nos elementos principais (medidas do 09-011, 09-012 e 09-008).

# 10-010 — Testes de carteiras (caminho principal)

**Status:** pendente
**Fluxo / subitem:** Carteiras › todos (modo enxuto)
**Depende de:** 10-009

> **Modo enxuto** (docs/decisoes.md): só o caminho principal. Casos de borda estão listados no 10-012.

## Objetivo
Um spec do fluxo, um de axe e uma baseline visual por tela (desktop e mobile, conforme o projeto).

## Arquivos (testes)
- criar: `tests/e2e/wallets.spec.ts`
- criar: `tests/e2e/wallets-a11y.spec.ts`
- criar: `tests/visual/wallets.spec.ts`

## Referências
- `tests/e2e/profile.spec.ts`, `profile-a11y.spec.ts`, `tests/visual/profile.spec.ts` (estrutura, `ready`, `authState`, `only`, `signIn` pela ponte `window.__kurio.auth.signIn`), `tests/e2e/fixtures.ts` (`users.primary`)
- docs/fluxos/carteiras.md; seed: o usuário `teste` tem **só a principal** (`src/mocks/seed/users.ts`, endereço `0xA91F3D7B9C1E0A5F48B2C6D09E17A3F5B8C4E82C`, rede Ethereum, MetaMask)

## Instruções
1. `wallets.spec.ts` (cada `test` roda uma vez; entrar com `signIn`; seletores por papel e nome; sem `waitForTimeout`; endereço de teste `0x` + 40 hex, ex.: `0x1111111111111111111111111111111111111111`):
   - **navegação:** desktop: "Carteiras" com `aria-current="page"` no menu lateral; mobile: `/perfil` → "Carteiras" abre `/perfil/carteiras` com "Carteiras" na barra superior e "Voltar" leva a `/perfil`.
   - **principal carregada:** o formulário vem preenchido ("Carteira principal"/dados do seed), link "Editar"; "Salvar carteira" desabilitado sem alterações; alterar o apelido para "Minha principal" e salvar → toast "Carteira principal salva"; `reload` mantém o valor.
   - **primeira carteira pré-preenchida:** com um usuário **sem carteira** (`users.other`, ou apagar a principal do `teste` pela API de teste do mock; usar a opção mais simples já existente nos helpers), o formulário vem com nome de exibição, e-mail e ENS do perfil, link "Adicionar"; preencher Rede, Endereço, Tipo, Código de indicação, Nome do perfil e Apelido, salvar → o link vira "Editar".
   - **validação:** endereço `0x123` e sair do campo mostra "Endereço de carteira inválido."; enviar com obrigatório vazio mostra "obrigatório" e foca o primeiro campo com erro.
   - **secundária:** com principal, estado vazio ("Você ainda não adicionou uma carteira secundária.") → rádio "Igual à carteira principal" abre o formulário com os dados da principal; trocar o apelido e "Salvar carteira" → toast "Carteira secundária salva"; `reload` mantém as duas.
   - **remover:** "Remover carteira secundária" → "Remover carteira secundária?" → "Remover" → volta ao estado vazio com o foco em "Adicionar".
   - **tornar principal:** com as duas salvas, "Tornar principal" → confirmar → anúncio/toast "Carteiras trocadas" e os valores das duas trocaram de lugar; o botão fica desabilitado quando se edita um campo sem salvar.
   - **alterações não salvas:** digitar no apelido e clicar em "Dados do perfil" abre "Descartar alterações?"; "Continuar editando" mantém a página; "Descartar" navega.
   - **voltar ao pagamento:** `/perfil/carteiras?redirect=/pagamento` mostra "Voltar ao pagamento"; editar o apelido e salvar leva a `/pagamento`.
2. `wallets-a11y.spec.ts`: axe (só `serious`/`critical`) em `/perfil/carteiras` nos dois projetos, com a secundária vazia e com as duas carteiras abertas (como em `profile-a11y.spec.ts`); nomes acessíveis únicos para os campos (inclui "ENS ou carteira secundária").
3. `tests/visual/wallets.spec.ts`: `toHaveScreenshot('carteiras.png', { fullPage: true })` com movimento reduzido e `settle`, estado do Figma (formulário da principal **vazio** sem carteira e secundária vazia) → usar o usuário sem carteira. **A baseline só é aprovada pelo usuário no checkpoint.**
4. `npm run test:e2e -- wallets` e `npm run test:e2e -- wallets-a11y` verdes nos dois projetos; gerar a baseline com `npx playwright test tests/visual/wallets.spec.ts --update-snapshots`. Commit: `10-010: testes de carteiras`.

## Critérios de aceite
- [ ] Nenhum teste de falha de rede/5xx, cenário forçado, `422` do servidor, endereços-limite, clique repetido ou sessão expirada.
- [ ] Cada teste independe dos outros (contexto novo, banco do mock recriado).

## Verificação (Sonnet)
- Specs acima verdes; uma captura lado a lado com o Figma por tela (desktop; o mobile é adaptado), nos elementos principais (medidas do 10-004, 10-006 e 10-008).

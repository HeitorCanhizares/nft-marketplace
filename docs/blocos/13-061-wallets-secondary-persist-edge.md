# 13-061 — Carteiras: secundária, persistência, alterações não salvas e acessibilidade

**Status:** pendente
**Responsável:** Sonnet
**Depende de:** 13-001, 13-060
**Toca:** `tests/e2e/wallets-secondary-edge.spec.ts` (novo); `tests/e2e/wallets-a11y.spec.ts` (acrescentar; arquivo só deste bloco)
**Paralelo:** sim.
**Lote:** T5
**Origem:** 10-012 (Secundária, Persistência e Pagamento, Alterações não salvas, Estados)

Regras: 13-001.

## Secundária
1. "Igual à carteira principal": desabilitado sem principal (motivo visível); copia **uma única vez** (editar a principal depois não muda a secundária); copiar sobre formulário já editado sobrescreve sem confirmar; o rádio some quando há secundária.
2. Secundária sem principal: aviso "Cadastre a carteira principal primeiro."; "Adicionar" com foco; foco em "Adicionar" ao remover.
3. "Tornar principal" desabilitado com alterações não salvas em qualquer dos dois formulários; a troca preserva os `id` e troca só o `slot`.

## Persistência e Pagamento
4. Dados sobrevivem a refresh e a novo login; cada usuário só vê as próprias carteiras; salvar ou trocar invalida `wallets` e o Pagamento usa os dados novos; `redirect` diferente de `/pagamento` é ignorado.
5. Pré-preenchimento do perfil quando não há carteira (inclui perfil sem ENS e sem apelido); mudar o perfil depois não reinicia um formulário em edição.

## Alterações não salvas e sessão
6. `beforeunload`; "Descartar alterações?" ao navegar por link, voltar do navegador e "Sair"; `session-expired` durante a edição vai a `/entrar` sem ficar preso; acesso deslogado vai ao login e volta.

## Estados e acessibilidade
7. `server-error:GET /wallets`/rede: `ErrorState` com "Tentar novamente"; `slow`: skeleton; `empty-wallets`: formulário vazio da principal.
8. `[d]` mobile → desktop em `/perfil/carteiras` mantém o estado do formulário; título do documento e foco no `h1`.
9. Axe com diálogos de remover e de trocar abertos e erros visíveis; anúncios "Carteira principal salva", "Carteira secundária salva", "Carteira secundária removida" e "Carteiras trocadas"; teclado (Radix `Select`, rádio, diálogos).

## Critérios de aceite
- [ ] Specs verdes em `desktop` e `mobile`.

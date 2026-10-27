# 13-063 — Carteiras: persistência, integração com Pagamento, guarda de saída e estados

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001
**Toca:** `tests/e2e/wallets-persist-states-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T5
**Origem:** 10-012 (Persistência e Pagamento, Alterações não salvas, Estados)

Regras: 13-001.

## Casos
1. Dados sobrevivem a refresh e a novo login; cada usuário só vê as próprias carteiras; salvar ou trocar invalida `wallets` e o Pagamento usa os dados novos; `redirect` diferente de `/pagamento` é ignorado.
2. Pré-preenchimento do perfil quando não há carteira (inclui perfil sem ENS e sem apelido); mudar o perfil depois não reinicia um formulário em edição.
3. `beforeunload`; "Descartar alterações?" ao navegar por link, voltar do navegador e "Sair"; `session-expired` durante a edição vai a `/entrar` sem ficar preso; acesso deslogado vai ao login e volta.
4. `server-error:GET /wallets`/rede: `ErrorState` com "Tentar novamente"; `slow`: skeleton; `empty-wallets`: formulário vazio da principal; `[d]` mobile → desktop em `/perfil/carteiras` mantém o estado do formulário; título do documento e foco no `h1`.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.

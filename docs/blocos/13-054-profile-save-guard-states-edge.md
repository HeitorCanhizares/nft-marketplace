# 13-054 — Perfil: salvar, alterações não salvas, sessão e estados

**Status:** concluído
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001
**Toca:** `tests/e2e/profile-save-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T4
**Origem:** 09-016 (Salvar, Alterações não salvas, Estados)

Regras: 13-001.

## Casos
1. Dados com erro e senha ok (e o inverso): um bloco não desfaz o outro; erros de formato no cliente bloqueiam "Salvar" por inteiro (decisão da fase 09); erros devolvidos pela API são independentes por bloco.
2. 5xx/rede: mensagem no bloco certo e formulário preservado; "Salvar" desabilitado sem alterações; duplo clique: uma requisição por bloco; persistência após refresh; anúncios "Perfil atualizado" e "Senha alterada" (`polite`), erros (`assertive`).
3. `beforeunload` ao fechar/recarregar com alterações; "Descartar alterações?" ao navegar por link, voltar do navegador e "Sair" com o formulário alterado (Cancelar mantém, Descartar sai); `session-expired` durante a edição vai a `/entrar` sem ficar preso no diálogo (`UnsavedChangesGuard` não bloqueia); `session-expired` em `GET /profile`.
4. `server-error:GET /profile` e rede: `ErrorState` com "Tentar novamente"; `slow`: skeleton; `[d]` redimensionar de mobile para desktop em `/perfil` redireciona a `/perfil/dados`; acesso direto deslogado a `/perfil/dados` vai ao login e volta; título do documento e foco no `h1` ao navegar entre `/perfil` e `/perfil/dados`.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.

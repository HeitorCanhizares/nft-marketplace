# 13-052 — Perfil: salvar, alterações não salvas, sessão, estados e acessibilidade

**Status:** pendente
**Responsável:** Sonnet
**Depende de:** 13-001, 13-050, 13-051
**Toca:** `tests/e2e/profile-save-edge.spec.ts` (novo); `tests/e2e/profile-a11y.spec.ts` (acrescentar; arquivo só deste bloco)
**Paralelo:** sim.
**Lote:** T4
**Origem:** 09-016 (Salvar, Alterações não salvas, Estados)

Regras: 13-001.

## Salvar
1. Dados com erro e senha ok (e o inverso): um bloco não desfaz o outro; erros de formato no cliente bloqueiam "Salvar" por inteiro (decisão da fase 09); erros devolvidos pela API são independentes por bloco.
2. 5xx/rede: mensagem no bloco certo e formulário preservado; "Salvar" desabilitado sem alterações; duplo clique: uma requisição por bloco; persistência após refresh.
3. Anúncios: "Perfil atualizado" e "Senha alterada" (`polite`), erros (`assertive`).

## Alterações não salvas e sessão
4. `beforeunload` ao fechar/recarregar com alterações; "Descartar alterações?" ao navegar por link, voltar do navegador e "Sair" com o formulário alterado (Cancelar mantém, Descartar sai).
5. `session-expired` durante a edição: vai a `/entrar` sem ficar preso no diálogo (o `UnsavedChangesGuard` não bloqueia o redirecionamento); `session-expired` em `GET /profile`.

## Estados e navegação
6. `server-error:GET /profile` e rede: `ErrorState` com "Tentar novamente"; `slow`: skeleton.
7. `[d]` redimensionar de mobile para desktop em `/perfil` redireciona a `/perfil/dados`; acesso direto deslogado a `/perfil/dados` vai ao login e volta.
8. Título do documento e foco no `h1` ao navegar entre `/perfil` e `/perfil/dados`.

## Acessibilidade
9. Axe com: diálogo de e-mail aberto, diálogo de remover avatar, erros visíveis, "Descartar alterações?". Teclado: ordem dos campos, Enter envia, seletor de arquivo, diálogos com foco preso e retorno; `prefers-reduced-motion`.

## Critérios de aceite
- [ ] Specs verdes em `desktop` e `mobile`.

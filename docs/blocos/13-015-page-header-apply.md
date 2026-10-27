# 13-015 — `PageHeader` compartilhado: aplicar em Perfil, Carteiras e Confirmação

**Status:** pendente (aguarda a Q6)
**Responsável:** Haiku
**Depende de:** 13-014
**Toca:** `src/pages/Profile/Profile.tsx`, `src/pages/Wallets/Wallets.tsx`, `src/pages/OrderConfirmation/OrderConfirmation.tsx`
**Paralelo:** não com blocos que toquem essas páginas.
**Lote:** C

## Objetivo
Trocar os `PageHeader` locais dessas três páginas pelo componente de `src/components/layout/PageHeader.tsx`.

## Instruções
1. Em cada página, apagar o `PageHeader` local e usar o compartilhado com os mesmos textos e destinos de hoje:
   - Perfil: `title="Dados do perfil"`, mobile `backTo={{ to: '/perfil' }}`, sem breadcrumb (desktop mostra só o `h1` `sr-only`).
   - Carteiras: o mesmo cabeçalho de hoje, incluindo o `backTo` que depende de `redirect` (voltar ao pagamento).
   - Confirmação: título e `backTo`/ação atuais (ler o arquivo; o mobile é página, o desktop é o `OrderDialog`).
2. Nenhuma mudança de comportamento, de foco (`useRouteFocus` continua no `h1`) nem de markup além do necessário.
3. `npx prettier --write` nos 3 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build`.

## Critérios de aceite
- [ ] Specs de `profile`, `wallets`, `order-confirmation` e os `*-a11y` verdes nos dois projetos; baselines visuais sem diferença.
- [ ] Nenhum `function PageHeader` restante em `src/pages/`.

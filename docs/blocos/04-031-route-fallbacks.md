# 04-031 — Fallbacks de rota (404, erro e carregando)

**Status:** pendente
**Fluxo / subitem:** Fase 04 › Estados
**Depende de:** 04-013, 04-014, 04-015

## Objetivo
Criar os três componentes que o router usa por padrão: página 404, erro da rota com "Tentar novamente" e carregamento da página.

## Arquivos
- criar: `src/components/layout/RouteFallbacks.tsx`

## Referências
- docs/arquitetura/rotas.md (Outras regras: `notFoundComponent`, `errorComponent`, `pendingComponent`)
- `src/services/http/ApiError.ts` (`isApiError`) e `src/components/shared/{EmptyState,ErrorState,PageSkeleton}.tsx`

## Instruções
1. Exportar três componentes (export nomeado):
   - `RouteNotFound`: `EmptyState` com `as="h1"`, título "Página não encontrada", descrição "O endereço que você abriu não existe ou foi removido." e ação `Button asChild` + `Link to="/"` "Voltar para o início". Envolto em `div.container-page`.
   - `RouteError({ error, reset }: ErrorComponentProps)` (tipo de `@tanstack/react-router`): `ErrorState` com `as="h1"`; título e texto padrão, **exceto** quando `isApiError(error)` for verdadeiro e o erro vier do servidor com mensagem em PT-BR segura (`error.message`): usar essa mensagem como `message`. `onRetry`: chama `reset()` e `router.invalidate()` (`useRouter()`), com `retrying` enquanto a invalidação roda. Não mostrar `stack`, `code` nem texto técnico.
   - `RoutePending`: `PageSkeleton` (04-015).
2. Não registrar nada no router aqui (isso é o 04-032).
3. Fechamento: `npx prettier --write src/components/layout/RouteFallbacks.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/layout/RouteFallbacks.tsx` e `git commit -m "04-031: fallbacks de rota"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`.
- [ ] A 404 e o erro têm `<h1>` (o foco da troca de rota vai para ele).
- [ ] "Tentar novamente" recarrega a rota sem recarregar a página.
- [ ] Nenhuma mensagem em inglês nem técnica na tela.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Exercitados no 04-032 (404 por URL inexistente) e no probe (erro forçado por uma rota de probe que lança no `loader`; skeleton com `loader` lento).

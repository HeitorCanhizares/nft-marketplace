# 05-032 — AuthContext: promessa `ready` (fim da recuperação da sessão)

**Status:** concluído
**Fluxo / subitem:** Login › 5 (a sessão é restaurada **antes** de renderizar rotas protegidas)
**Depende de:** 03-015
**Depende de decisão:** pergunta 1 do relatório da fase 05 (guardas por `beforeLoad` com contexto do roteador)

## Objetivo
Dar ao `AuthContext` uma promessa `ready` que resolve quando a recuperação da sessão na inicialização termina (`'authenticated'` ou `'anonymous'`), para as guardas de rota esperarem em vez de adivinhar enquanto o estado é `loading`.

## Arquivos
- alterar: `src/contexts/auth.ts`, `src/contexts/AuthContext.tsx`

## Referências
- docs/fluxos/login.md (subitem 5: restaura o usuário antes de renderizar rotas protegidas; tela de carregamento curta, sem piscar o botão "Entrar") e docs/arquitetura/rotas.md (Proteção de rotas: `beforeLoad` consulta a sessão)
- `src/contexts/AuthContext.tsx` (efeito de inicialização `(a)`), `src/contexts/auth.ts`

## Instruções
1. `auth.ts`: `AuthContextValue` ganha `ready: Promise<'authenticated' | 'anonymous'>` (comentar: "resolve uma vez, quando a inicialização termina; depois disso use `status`").
2. `AuthContext.tsx`: criar **uma** promessa por provider (`useState(() => …)` com `resolve` guardado em ref; sem criar outra a cada render) e incluí-la no `value`.
3. Resolver no efeito de inicialização: sem sessão salva → `'anonymous'` na hora; `getSession` com sucesso → `'authenticated'`; falha **não abortada** (token vencido, rede ou 5xx) → `'anonymous'`. Falha por cancelamento (cleanup do StrictMode) **não** resolve (o efeito seguinte resolve).
4. Nenhum outro comportamento do `AuthContext` muda (timers, ações, `onClearPrivateSession`).
5. A ponte de teste (`TestBridge.tsx`) **não** precisa mudar (`auth.state` continua devolvendo só `status`, `user`, `expiresAt`, `expiryWarning`).
6. Fechamento: `npx prettier --write` nos 2 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0; `npx playwright test tests/e2e/app-base.spec.ts` verde. Commit: `git add src/contexts/auth.ts src/contexts/AuthContext.tsx` e `git commit -m "05-032: promessa ready no AuthContext"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`.
- [ ] Sem token: `ready` resolve `'anonymous'` sem chamar a API.
- [ ] Com token válido: `'authenticated'` depois do `GET /auth/session`; token inválido ou erro de rede: `'anonymous'` (e o token de erro de rede **continua** guardado, como antes).
- [ ] A mesma promessa em todos os renders (identidade estável); resolve uma vez, também em StrictMode.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0; testes da fase 03 verdes.
- Coberto no 05-046 (guarda espera a recuperação) e no 05-045.

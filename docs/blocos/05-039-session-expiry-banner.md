# 05-039 — Aviso de expiração da sessão (`SessionExpiryBanner`)

**Status:** pendente
**Fluxo / subitem:** Login › 6 (aviso 2 minutos antes, "Continuar conectado")
**Depende de:** 03-010, 03-015, 04-030
**Depende de decisão:** pergunta 13 do relatório da fase 05 (componente não desenhado: posição, texto, foco)

## Objetivo
Mostrar, 2 minutos antes de a sessão expirar, um aviso acessível com o botão "Continuar conectado", que renova a sessão (`POST /auth/refresh`), sem roubar o foco de quem está digitando.

## Arquivos
- criar: `src/components/shared/SessionExpiryBanner.tsx`, `src/hooks/useSessionRenewal.ts`
- alterar: `src/components/layout/AppShell.tsx` (renderizar o aviso no topo)

## Referências
- docs/fluxos/login.md (subitem 6: `role="alertdialog"`, sem roubar o foco de um formulário em edição, aparece como banner com foco opcional; "Continuar conectado" → `POST /auth/refresh`; sem resposta, expira) e docs/arquitetura/estado.md (AuthContext: `expiryWarning`, `refreshSession`)
- docs/qualidade/acessibilidade.md (assertive para sessão expirada; botão em envio com `aria-busy`)
- `src/contexts/auth.ts` (`expiryWarning`, `refreshSession`), `src/contexts/liveAnnouncer.ts`, `src/components/layout/AppShell.tsx`

## Valores propostos (não desenhado; confirmar com o usuário)
Faixa **no fluxo da página** (não cobre o cabeçalho), `sticky top-0 z-50`, no **topo** do `AppShell` (desktop e mobile), fundo `secondary` (`#2f1d15`), borda inferior `border-strong`, conteúdo na largura do `container-page`. Título "Sua sessão expira em breve" (14 px bold, `foreground`) e texto "Em menos de 2 minutos você será desconectado. Quer continuar conectado?" (13 px, `muted-foreground`); botão `Button` padrão de 36 px (`h-9 px-3 text-sm`) "Continuar conectado", à direita (embaixo do texto em telas estreitas, `flex-wrap`). Sem contagem regressiva (evita anúncio contínuo).

## Instruções
1. `SessionExpiryBanner` — props: `onContinue: () => void`, `pending: boolean`, `error?: string`, `className?`. Raiz `role="alertdialog"`, `aria-modal="false"`, `aria-labelledby` (título) e `aria-describedby` (texto). **Sem** `autoFocus` e **sem** armadilha de foco. Botão com `aria-busy={pending}`, texto "Renovando…" enquanto `pending`, `aria-disabled` e clique ignorado durante o envio. `error` em `role="alert"` (`text-caption text-destructive`, ícone `CircleAlertIcon`).
2. `useSessionRenewal()`: lê `useAuth()` (`expiryWarning`, `refreshSession`) e `useLiveAnnouncer()`; devolve `{ open: expiryWarning, pending, error, renew }`.
   - Ao `open` virar `true`: `announce('Sua sessão expira em 2 minutos. Use "Continuar conectado" para renovar.', 'assertive')` **uma vez** por aviso.
   - `renew`: `pending = true`, `await refreshSession()`; sucesso → `toast.success('Sessão renovada.')` e, se o foco estava no botão (que some), `document.getElementById('conteudo')?.focus()`; falha com `isApiError` e `status === 401` → nada (o fluxo de expiração já cuida); outra falha → `error = 'Não foi possível renovar agora. Tente novamente.'` e o aviso continua. Limpa `error` ao tentar de novo.
3. `AppShell`: `const renewal = useSessionRenewal()` e, **antes** do `Header`, `{renewal.open && <SessionExpiryBanner … />}`. Nada mais muda no `AppShell`.
4. Fechamento: `npx prettier --write` nos 3 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0; `npx playwright test tests/e2e/layout.spec.ts` verde. Commit: `git add src/components/shared/SessionExpiryBanner.tsx src/hooks/useSessionRenewal.ts src/components/layout/AppShell.tsx` e `git commit -m "05-039: aviso de expiração da sessão"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; export nomeado `SessionExpiryBanner`; `components/shared` não chama a API (o hook faz).
- [ ] Aparece com `expiryWarning`; some depois do refresh; **não** move o foco ao aparecer e **não** tira o foco de um campo em edição.
- [ ] Anúncio assertive uma vez por aviso; sem anúncio por segundo.
- [ ] Falha de rede ao renovar mantém o aviso com a mensagem e deixa tentar de novo.
- [ ] Sem cor hexadecimal, `oklch()` ou `rgb()`; sem rolagem horizontal em 320 px.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Coberto no 05-045 (relógio simulado com `page.clock`) e no 05-047 (axe com o aviso aberto, teclado).

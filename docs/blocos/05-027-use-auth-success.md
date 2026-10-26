# 05-027 — Hook useAuthSuccess (o que acontece depois de entrar ou cadastrar)

**Status:** concluído
**Fluxo / subitem:** Login › 4 e Cadastro › 5 (boas-vindas, aviso de ajustes do carrinho, ação pendente)
**Depende de:** 03-015, 04-030, 05-025, 05-026
**Depende de decisão:** perguntas 11 e 12 do relatório da fase 05

## Objetivo
Reunir num hook o que as páginas de Login e Cadastro fazem **depois** do `signIn`/`signUp` dar certo: mensagem de boas-vindas (cadastro), aviso dos ajustes do carrinho e execução da ação pendente. **A navegação para o `redirect` não é daqui**: é feita pela guarda de rota da página (05-033 e 05-036), que reage à sessão nova.

## Arquivos
- criar: `src/hooks/useAuthSuccess.ts`

## Referências
- docs/fluxos/login.md (subitem 4) e docs/fluxos/cadastro.md (subitem 5: "Conta criada. Bem-vindo(a), <usuário>!")
- docs/qualidade/acessibilidade.md (toasts do Sonner também são anunciados: **não** repetir a mesma frase em `announce`)
- `src/contexts/auth.ts` (`AuthResponse`), `src/lib/cartAdjustments.ts` (05-025), `src/lib/pendingAction.ts` (05-026), `sonner`

## Instruções
1. `useAuthSuccess(): (response: AuthResponse, options?: { welcome?: string }) => Promise<void>` (função estável com `useCallback`).
2. Ordem dentro da função:
   1. `options.welcome` → `toast.success(welcome)`;
   2. `response.details?.adjustments` não vazio → **um** `toast.warning('Ajustamos o seu carrinho', { description: describeAdjustments(...).join(' '), duration: 10000 })`;
   3. `runPendingAction()`: `ok: true` → `toast.success(message)`; `ok: false` → `toast.error(message)`; `null` → nada.
3. Nunca lança (qualquer erro é engolido; o login já deu certo). Não navega, não chama `signIn`.
4. Fechamento: `npx prettier --write src/hooks/useAuthSuccess.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/hooks/useAuthSuccess.ts` e `git commit -m "05-027: hook useAuthSuccess"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`.
- [ ] Sem ajustes e sem ação pendente, só mostra a mensagem de boas-vindas (ou nada, no login).
- [ ] O toast de ajustes mostra uma frase por item; some em 10 s.
- [ ] A ação pendente roda uma vez.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Coberto no 05-043, 05-044 e 05-045.

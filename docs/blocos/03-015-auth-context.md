# 03-015 — AuthContext

**Status:** pendente
**Fluxo / subitem:** Fase 03 › Autenticação
**Depende de:** 03-007, 03-010, 03-013, 03-014

## Objetivo
Criar o estado de sessão (usuário, status, expiração) com recuperação após refresh e aviso de expiração.

## Arquivos
- criar: `src/contexts/AuthContext.tsx`, `src/contexts/auth.ts`

## Referências
- docs/arquitetura/estado.md#authcontext e #expiração-com-preservação-de-contexto
- docs/fluxos/login.md (subitens 5 a 7)

## Instruções
1. `auth.ts`: contexto, tipo `AuthState` (`status: 'loading' | 'authenticated' | 'anonymous'`, `user: User | null`, `expiresAt: string | null`, `expiryWarning: boolean`) e `useAuth()` (erro claro fora do provider).
2. `AuthContext.tsx`: `AuthProvider({ children, onClearPrivateSession })` — `onClearPrivateSession` é injetado por `app/Providers.tsx` (a camada `contexts` **não** importa `app/`).
   - **Inicialização:** sem token → `anonymous`. Com token → `loading` e `getSession()`; sucesso → `authenticated`; `401` (`SESSION_EXPIRED`/`UNAUTHORIZED`) → limpa a sessão e `anonymous`; erro de rede/5xx → `anonymous` **sem apagar** o token (tenta de novo na próxima navegação).
   - **Ações:** `signIn(credentials)`, `signUp(data)`, `signOut()`, `refreshSession()`. Em `signIn`/`signUp`, se já havia um usuário **diferente**, chamar `onClearPrivateSession()` antes de guardar o novo; gravar a sessão (`writeSession`), atualizar o estado, e chamar `reconnectSocket()`. `signOut`: `logout()` (falha ignorada), `clearSession`, `onClearPrivateSession()`, `anonymous`, anunciar "Você saiu da sua conta".
   - **Expiração:** agendar `setTimeout` para `msUntilWarning` → `expiryWarning: true`; para `msUntilExpiry` → expirar (limpa sessão, `anonymous`, `emitSessionExpired()` já tratado abaixo). `refreshSession()` troca token e `expiresAt`, desarma o aviso e reagenda.
   - Assina `onSessionExpired` (`services/http/sessionEvents.ts`): mesmo caminho de expiração. O **redirecionamento** para `/entrar?redirect=` é da fase 05 (roteador), não daqui; aqui só o estado e um `onExpired` opcional por prop.
   - Anuncia por `useLiveAnnouncer` (assertive) "Sua sessão expirou."
3. Não guarda nada vindo da API em outro Context (regra do estado.md); o `user` aqui é só a identidade da sessão.
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/contexts/AuthContext.tsx src/contexts/auth.ts` e `git commit -m "03-015: AuthContext"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`.
- [ ] Camadas respeitadas (pastas.md): `services/api` não conhece React; `components/shared` e `contexts` não chamam Axios direto; nada importa de `src/mocks/` além de `main.tsx`.
- [ ] Mensagens ao usuário em PT-BR; código e nomes em inglês.
- [ ] Sem token → `anonymous` sem chamar a API.
- [ ] Erro de rede na inicialização não apaga o token.
- [ ] Timers cancelados ao desmontar e ao trocar de sessão.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Testado no 03-019 via ponte de teste e handlers de execução (sessão recuperada após reload, token vencido, aviso, expiração, troca de usuário).

# 05-023 — Hook useAvailability (disponibilidade de e-mail e usuário)

**Status:** concluído
**Fluxo / subitem:** Cadastro › 3 (disponibilidade ao sair do campo, com debounce e cancelamento)
**Depende de:** 03-014, 05-001

## Objetivo
Criar o hook que consulta `POST /auth/availability` quando o usuário sai do campo, com espera de 300 ms, cancelamento da consulta anterior e descarte de respostas de valores antigos.

## Arquivos
- criar: `src/hooks/useAvailability.ts`
- alterar: `src/services/api/auth.ts` (`checkAvailability` aceita um `AbortSignal` opcional)

## Referências
- docs/fluxos/cadastro.md (subitem 3: ao sair do campo, com formato válido; debounce e cancelamento — só vale a resposta do último valor; falha na consulta **não** bloqueia o envio) e docs/arquitetura/estado.md (respostas fora de ordem; debounce de 300 ms)
- `src/services/api/auth.ts` (`checkAvailability(input)`), `src/schemas/common.ts` (`emailSchema`, `usernameSchema`)

## Instruções
1. `auth.ts`: `checkAvailability(input: AvailabilityInput, signal?: AbortSignal)` repassa `{ signal }` ao `post`. Nada mais muda.
2. `type AvailabilityField = 'email' | 'username'` e `type AvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken' | 'unknown'`.
3. `useAvailability(field: AvailabilityField)` devolve `{ status, check(value: string): void, cancel(): void }`.
   - `check(value)`: cancela a consulta e o timer anteriores; se `value` (após `trim`) **não** passa no schema do campo (`emailSchema` / `usernameSchema`), `status = 'idle'` e para; senão `status = 'checking'` e, depois de **300 ms**, chama `checkAvailability({ [field]: value })` com um `AbortController` novo.
   - Resposta só vale se a consulta não foi cancelada **e** o valor ainda é o último: `available: true` → `'available'`; `false` → `'taken'`.
   - Erro: cancelamento (`CANCELED`) é ignorado; qualquer outro erro → `'unknown'` (silencioso: **não bloqueia** o envio, o `409` cobre).
   - `cancel()`: aborta, limpa o timer e volta a `'idle'` (o `SignupForm` chama ao digitar no campo).
4. Ao desmontar, aborta e limpa o timer (também em StrictMode).
5. O hook **não** conhece o react-hook-form nem as mensagens (o `SignupForm` traduz `'taken'` em erro de campo).
6. Fechamento: `npx prettier --write` nos 2 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/hooks/useAvailability.ts src/services/api/auth.ts` e `git commit -m "05-023: hook useAvailability"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; o hook usa só `services/api` (nunca Axios direto).
- [ ] Valor com formato inválido não chama a API.
- [ ] Duas chamadas seguidas: só a última gera requisição (a primeira é cancelada); resposta atrasada de um valor antigo não altera o `status`.
- [ ] Falha de rede ou 500 → `'unknown'`, sem exceção solta.
- [ ] Nenhum `setState` depois de desmontar.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Coberto no 05-044 (taken, available, resposta atrasada com `slow`/handler lento, falha não bloqueia).

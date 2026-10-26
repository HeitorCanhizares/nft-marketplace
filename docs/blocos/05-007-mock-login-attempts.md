# 05-007 — Mock: bloqueio por tentativas de login

**Status:** concluído
**Fluxo / subitem:** Login › 3 (bloqueio de 30 s após 5 senhas erradas)
**Depende de:** nenhum
**Depende de decisão:** pergunta 14 do relatório da fase 05 (a 5ª tentativa errada já devolve 429; contador só em memória)

## Objetivo
Criar o contador de tentativas erradas por e-mail que faz o mock responder `429 TOO_MANY_ATTEMPTS` por 30 s.

## Arquivos
- criar: `src/mocks/db/loginAttempts.ts`

## Referências
- docs/api-mock/contratos.md (`POST /auth/login` após **5 tentativas erradas** para o mesmo e-mail responde `429 TOO_MANY_ATTEMPTS` com `details.retryAfterSeconds` (30) até o prazo acabar)
- docs/fluxos/login.md (subitem 3)

## Instruções
1. Constantes exportadas: `MAX_FAILED_ATTEMPTS = 5`, `LOCK_SECONDS = 30`.
2. Estado **em memória** do módulo (`Map` por e-mail em minúsculas e sem espaços → `{ count: number; lockedUntil: number }`). Recarregar a página zera o bloqueio (decisão registrada; comentar em uma linha).
3. `getLockRemainingSeconds(email: string, now = Date.now()): number`: `0` se não há bloqueio; senão `Math.ceil((lockedUntil - now) / 1000)`. Bloqueio vencido **apaga a entrada** (o contador volta a zero) e devolve `0`.
4. `registerFailedAttempt(email: string, now = Date.now()): number`: soma 1; ao chegar a `MAX_FAILED_ATTEMPTS`, define `lockedUntil = now + LOCK_SECONDS * 1000`. Devolve os segundos restantes (`0` se ainda não bloqueou). **A 5ª tentativa errada já bloqueia** e devolve `30`.
5. `resetAttempts(email: string): void` (login certo apaga o contador).
6. Conta **qualquer** e-mail, existente ou não, para o mock não revelar quais contas existem.
7. Fechamento: `npx prettier --write src/mocks/db/loginAttempts.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/mocks/db/loginAttempts.ts` e `git commit -m "05-007: bloqueio por tentativas do mock"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; funções com `now` injetável (testáveis sem relógio global).
- [ ] 4 falhas → `0`; 5ª → `30`; 10 s depois → `20`; 30 s depois → `0` e contador zerado.
- [ ] `E-MAIL@x.com ` e `e-mail@x.com` são o mesmo contador.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Coberto no 05-012 e no teste de bloqueio do 05-043 (`page.clock`).

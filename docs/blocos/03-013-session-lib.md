# 03-013 — Utilitários de sessão

**Status:** pendente
**Fluxo / subitem:** Fase 03 › Sessão
**Depende de:** Fase 02

## Objetivo
Reunir as regras puras de sessão (ler, gravar, expirar, carrinho do visitante).

## Arquivos
- criar: `src/lib/session.ts`

## Referências
- docs/api-mock/persistencia.md (`kurio:session`, `kurio:guest-cart-id`)
- docs/fluxos/login.md#6-expiração (aviso 2 min antes)

## Instruções
1. `readSession()`, `writeSession(session)`, `clearSession()` sobre `storage.local` (`STORAGE_KEYS.session`), validando o JSON (`{ token: string; expiresAt: ISO }`; inválido → `null`).
2. `msUntilExpiry(expiresAt, now?)`, `msUntilWarning(expiresAt, now?)` (2 minutos antes de `expiresAt`; nunca negativo) e `isExpired(expiresAt, now?)`. Constante exportada `EXPIRY_WARNING_MS = 120_000`.
3. `getGuestCartId()`, `ensureGuestCartId()` (cria com `crypto.randomUUID()` se não existir) e `clearGuestCartId()` (chave `kurio:guest-cart-id`).
4. Puro: sem React, sem Axios.
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/lib/session.ts` e `git commit -m "03-013: utilitários de sessão"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`.
- [ ] Camadas respeitadas (pastas.md): `services/api` não conhece React; `components/shared` e `contexts` não chamam Axios direto; nada importa de `src/mocks/` além de `main.tsx`.
- [ ] Mensagens ao usuário em PT-BR; código e nomes em inglês.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Testado no 03-019 (casos de tempo e de JSON inválido).

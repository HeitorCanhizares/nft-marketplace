# 03-005 — Schemas zod: conta e carteiras

**Status:** pendente
**Fluxo / subitem:** Fase 03 › Schemas
**Depende de:** 03-002

## Objetivo
Criar os schemas de usuário, sessão e carteiras.

## Arquivos
- criar: `src/schemas/user.ts`

## Referências
- docs/api-mock/contratos.md#sessão-e-conta, #perfil, #carteiras
- src/types/user.ts

## Instruções
1. `userSchema`, `sessionSchema` (`{ token, expiresAt }`), `loginResponseSchema` (`{ user, session }`, com `details.adjustments?` opcional), `sessionResponseSchema` (`{ user, expiresAt }`), `walletSchema`, `walletsResponseSchema` (`{ primary | null, secondary | null }`) e `availabilityResponseSchema` (`{ available: boolean }`).
2. `walletSchema` usa `walletAddressSchema`, `networkSchema` e `walletProviderSchema`.
3. Os schemas de **formulário** (login, cadastro, perfil, carteira) nascem com os seus fluxos; aqui ficam só as respostas.
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/schemas/user.ts` e `git commit -m "03-005: schemas de conta"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`.
- [ ] Camadas respeitadas (pastas.md): `services/api` não conhece React; `components/shared` e `contexts` não chamam Axios direto; nada importa de `src/mocks/` além de `main.tsx`.
- [ ] Mensagens ao usuário em PT-BR; código e nomes em inglês.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.


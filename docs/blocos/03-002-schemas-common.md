# 03-002 — Schemas zod: validadores compartilhados

**Status:** pendente
**Fluxo / subitem:** Fase 03 › Schemas
**Depende de:** Fase 02

## Objetivo
Criar os validadores reutilizados por respostas e formulários (e-mail, usuário, senha, endereço, ETH, enums).

## Arquivos
- criar: `src/schemas/common.ts`, `src/schemas/api.ts`

## Referências
- docs/fluxos/cadastro.md#regras-de-validação (regras de usuário, e-mail e senha)
- docs/fluxos/carteiras.md (endereço `0x` + 40 hex)
- docs/api-mock/contratos.md#convenções e #formato-de-erro
- src/types/api.ts, src/types/nft.ts

## Instruções
1. `common.ts` exporta (todos com **mensagens de erro em PT-BR**): `networkSchema` (`'ethereum' | 'polygon' | 'solana'`), `walletProviderSchema` (`'metamask' | 'walletconnect' | 'coinbase'`), `ethAmountSchema` (string decimal, ex.: `"1.19"`; sem notação científica, sem sinal; **nunca `number`**), `isoDateSchema`, `emailSchema` (formato válido, normaliza espaços nas pontas), `usernameSchema` (3–20; letras, números, `_` e `.`; sem espaços), `passwordSchema` (mínimo 8, pelo menos uma letra e um número), `walletAddressSchema` (`0x` + 40 hex), `positiveIntSchema` (inteiro ≥ 1; rejeita decimais) e `paginatedSchema(item)` (`items, page, pageSize, total, totalPages`).
2. `api.ts`: `apiErrorBodySchema` (`{ error: { code, message, fields?, details? } }`) e a lista de códigos (`apiErrorCodeSchema`) coerente com `ApiErrorCode` de `src/types/api.ts`.
3. Onde houver tipo correspondente em `src/types/`, anotar o schema como `z.ZodType<Tipo>` (o TypeScript passa a acusar divergência entre schema e tipo).
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/schemas/common.ts src/schemas/api.ts` e `git commit -m "03-002: schemas comuns e de erro"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`.
- [ ] Camadas respeitadas (pastas.md): `services/api` não conhece React; `components/shared` e `contexts` não chamam Axios direto; nada importa de `src/mocks/` além de `main.tsx`.
- [ ] Mensagens ao usuário em PT-BR; código e nomes em inglês.
- [ ] Regras idênticas às de `cadastro.md` (usuário 3–20, senha 8+ com letra e número).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Testado no 03-019 (casos válidos e inválidos de cada validador, via `window.__kurio.schemas`).

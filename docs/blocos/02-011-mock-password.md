# 02-011 — Hash de senha (PBKDF2)

**Status:** pendente
**Fluxo / subitem:** Fase 02 › Banco e stores
**Depende de:** 02-009

## Objetivo
Fornecer o hash e a verificação de senha com Web Crypto, sem nunca guardar senha em claro.

## Arquivos
- criar: `src/mocks/db/password.ts`

## Referências
- docs/api-mock/persistencia.md (`users`: PBKDF2-SHA-256 com salt aleatório)
- docs/decisoes.md (senhas com hash no mock)

## Instruções
1. `hashPassword(password, salt?)` → `{ salt, hash, iterations }` (base64). PBKDF2, SHA-256, **100.000 iterações**, salt de 16 bytes aleatórios (`crypto.getRandomValues`), chave derivada de 32 bytes.
2. `verifyPassword(password, record)` compara em tempo constante (loop com XOR, não `===`).
3. Usar só `crypto.subtle`; nenhuma dependência.
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/mocks/db/password.ts` e `git commit -m "02-011: hash de senha PBKDF2"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; tipos exportados com nome.
- [ ] `src/mocks/**` não importa nada do app além de `src/types`, `src/schemas` e `src/lib` (regra de camadas de pastas.md).
- [ ] Comentários só onde o porquê não é óbvio.
- [ ] Dois hashes da mesma senha têm salts e hashes diferentes.
- [ ] Senha errada → `false`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Conferido no 02-022 (verificação com a senha certa e uma errada).

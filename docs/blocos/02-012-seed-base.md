# 02-012 — Seed: coleções, usuários e cupons

**Status:** pendente
**Fluxo / subitem:** Fase 02 › Seed
**Depende de:** 02-002, 02-011

## Objetivo
Criar os dados iniciais pequenos: coleções, usuários de teste, carteira principal de exemplo e cupons.

## Arquivos
- criar: `src/mocks/seed/collections.ts`, `src/mocks/seed/users.ts`, `src/mocks/seed/coupons.ts`

## Referências
- docs/api-mock/persistencia.md (seed, credenciais fictícias só no seed)
- docs/api-mock/contratos.md#cotação (cupons)
- docs/design/telas/desktop-inicio.png (nomes das coleções)

## Instruções
1. `collections.ts`: as 9 coleções do Figma, com id em slug e a **contagem alvo de NFTs** abaixo (soma 283, as proporções do Figma escaladas; decisão do usuário em 2026-10-25): Arte digital 39, Fotografia 14, Música 77, Arte 3D 46, Colecionáveis 27, Generativa 20, Jogos 23, Assinaturas 16, Utilidade 21. As contagens por rede (Ethereum 119, Polygon 78, Solana 86) ficam para o 02-014.
2. `users.ts`: dois usuários fictícios (`teste@kurio.test` e `outro@kurio.test`, com `username`, `displayName` e `id` fixos). **O Haiku escolhe uma senha fictícia para cada um e grava só o hash e o salt** (via `hashPassword`, executado na hora do seed, com a senha como constante local não exportada, ou hash pré-calculado). A senha **não** vai para docs, README nem comentários; o Haiku a informa no relatório de entrega para o Sonnet colocá-la no arquivo de fixtures dos testes. Incluir na semente a **carteira principal** do usuário `teste@kurio.test` (dados do Figma de Carteiras: endereço `0xA91F…E82C` completo e válido, rede Ethereum, provedor MetaMask) e **nenhuma** carteira secundária; o outro usuário sem carteiras.
3. `coupons.ts`: `KURIO10` (10%), `GENESIS5` (5%) e `EXPIRADO` (vencido), como em contratos.md. Exportar também `findCoupon(code)` (maiúsculas, sem espaços nas pontas) que devolve `{ percent, expired }` ou `undefined`.
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/mocks/seed/collections.ts src/mocks/seed/users.ts src/mocks/seed/coupons.ts` e `git commit -m "02-012: seed de coleções, usuários e cupons"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; tipos exportados com nome.
- [ ] `src/mocks/**` não importa nada do app além de `src/types`, `src/schemas` e `src/lib` (regra de camadas de pastas.md).
- [ ] Comentários só onde o porquê não é óbvio.
- [ ] Nenhuma senha em claro em lugar nenhum do repositório.
- [ ] Soma das contagens das coleções = 283.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- `grep -rn` pela senha informada no relatório: nenhum resultado em `src/` e `docs/`.

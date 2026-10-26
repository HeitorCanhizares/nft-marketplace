# 05-004 — Mock: aritmética de ETH em inteiros

**Status:** pendente
**Fluxo / subitem:** Login › 4 (mescla do carrinho do visitante)
**Depende de:** 02-009
**Depende de decisão:** pergunta 12 do relatório da fase 05 (arquivo novo em `src/mocks/db/`)

## Objetivo
Dar ao mock uma forma única de multiplicar e converter valores em ETH usando inteiros (unidades de 0,000001 ETH), sem `number` decimal, para a mescla do carrinho (e, depois, a cotação da fase 08).

## Arquivos
- criar: `src/mocks/db/money.ts`

## Referências
- docs/api-mock/contratos.md (Valores em ETH: string decimal; "o mock calcula em inteiros (unidades de 0,000001 ETH) e converte para string"; **o front não soma valores**)
- docs/arquitetura/pastas.md (`mocks` só importa `types`, `schemas` e `lib`)

## Instruções
1. `ETH_DECIMALS = 6`.
2. `ethToUnits(eth: string): number`: lê uma string decimal sem sinal (`/^\d+(\.\d+)?$/`; senão lança `Error`), completa ou **trunca** as casas decimais em 6 e devolve o inteiro (`"1.19"` → `1190000`; `"26.846"` → `26846000`). Sem `parseFloat`.
3. `unitsToEth(units: number): string`: inteiro ≥ 0 → string decimal **sem zeros à direita além de 2 casas** (`1190000` → `"1.19"`, `2000000` → `"2.00"`, `26846000` → `"26.846"`, `1500000` → `"1.50"`). Lança `Error` se `units` não é inteiro seguro.
4. `multiplyEth(unitPrice: string, quantity: number): string` = `unitsToEth(ethToUnits(unitPrice) * quantity)`; `quantity` inteiro ≥ 0.
5. Exportar só estas funções e a constante. Comentário de uma linha: "o front nunca usa este arquivo; só o mock".
6. Fechamento: `npx prettier --write src/mocks/db/money.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/mocks/db/money.ts` e `git commit -m "05-004: aritmética de ETH do mock"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; sem `parseFloat`/`Number('1.19')` para dinheiro.
- [ ] `multiplyEth('1.19', 3)` → `"3.57"`; `multiplyEth('0.1', 3)` → `"0.30"` (sem erro de ponto flutuante); `multiplyEth('26.846', 2)` → `"53.692"`; `multiplyEth('1.19', 0)` → `"0.00"`.
- [ ] Entradas inválidas (`'1,19'`, `'-1'`, `'1e3'`, vazia) lançam.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Casos acima dentro do 05-012 (o Sonnet expõe `money` na ponte `__kurioMock` só para o teste, junto com o 05-012).

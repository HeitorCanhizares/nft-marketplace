# 05-025 — Mensagens dos ajustes do carrinho mesclado

**Status:** pendente
**Fluxo / subitem:** Login › 4 e Cadastro › 5 (ajustes por estoque avisados)
**Depende de:** 02-003
**Depende de decisão:** pergunta 12 do relatório da fase 05 (texto do item removido e formato do aviso)

## Objetivo
Montar, a partir de `details.adjustments` (`CartAdjustment`), as frases que o app mostra quando a mescla do carrinho do visitante limitou quantidades por estoque.

## Arquivos
- criar: `src/lib/cartAdjustments.ts`

## Referências
- docs/api-mock/contratos.md (Carrinho: "O front monta a mensagem a partir desses campos: 'Ajustamos Emerald Ape #042 (1/50) de 5 para 3 unidades, o estoque disponível'")
- `src/types/cart.ts` (`CartAdjustment`)
- A UI do carrinho é da fase 08; aqui entra **só o aviso** (toast, no 05-027).

## Instruções
1. `describeAdjustment(adjustment: CartAdjustment): string`:
   - `applied > 0`: `Ajustamos ${nftName} (${editionLabel}) de ${requested} para ${applied} ${applied === 1 ? 'unidade' : 'unidades'}, o estoque disponível.` (o texto do contrato);
   - `applied === 0`: `Removemos ${nftName} (${editionLabel}) do carrinho: sem estoque disponível.` (texto proposto; o contrato não cobre o item removido).
2. `describeAdjustments(adjustments: readonly CartAdjustment[]): string[]` — uma frase por ajuste, na ordem recebida.
3. Funções puras, sem React. Exportar só estas duas.
4. Fechamento: `npx prettier --write src/lib/cartAdjustments.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/lib/cartAdjustments.ts` e `git commit -m "05-025: mensagens dos ajustes do carrinho"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`.
- [ ] `{ nftName: 'Emerald Ape #042', editionLabel: '1/50', requested: 5, applied: 3 }` → "Ajustamos Emerald Ape #042 (1/50) de 5 para 3 unidades, o estoque disponível."
- [ ] `applied: 1` usa "unidade" no singular; `applied: 0` usa a frase de remoção.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Coberto no 05-045 (aviso no login com carrinho plantado).

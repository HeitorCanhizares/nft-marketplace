# 06-030 — Hook `useLiveChanges` (selo "Atualizado" e anúncio agrupado)

**Status:** pendente
**Fluxo / subitem:** Início › 11 (selo "Atualizado" por alguns segundos; no máximo um aviso agrupado a cada poucos segundos)
**Depende de:** 06-002, 03-010
**Depende de decisão:** pergunta 12 do relatório da fase 06 (5 s, textos do aviso)

## Objetivo
Descobrir, comparando a lista anterior com a atual, quais NFTs tiveram o preço alterado ou esgotaram, marcar esses ids por 5 segundos e avisar o leitor de tela uma vez por janela.

## Arquivos
- criar: `src/hooks/useLiveChanges.ts`

## Referências
- docs/fluxos/inicio.md (subitem 11) e docs/qualidade/acessibilidade.md ("Mudança em tempo real nunca move o foco"; `aria-live` `polite`)
- `src/contexts/liveAnnouncer.ts` (`useLiveAnnouncer`, `announce(message, 'polite')`)

## Instruções
1. `useLiveChanges(items: readonly NftSummary[] | undefined, resetKey: string): { updatedIds: ReadonlySet<string> }`.
2. Guarda numa `ref` o mapa `id → { price, soldOut }` da **última lista da mesma `resetKey`**. Quando `items` muda:
   - `items` indefinido → não faz nada; `resetKey` diferente da anterior → só **troca a base** (sem comparar, sem marcar nada) e zera `updatedIds`;
   - mesma `resetKey`: para cada item presente nas duas listas, **`price` diferente** (comparação de texto, nunca conta) → "preço atualizado"; **`soldOut` de falso para verdadeiro** → "esgotou". Itens novos ou removidos são ignorados.
3. `updatedIds`: estado com os ids "preço atualizado" **e** "esgotou"; cada id sai sozinho **5 s** depois de marcado (um timer por id; marcar de novo reinicia; limpar os timers ao desmontar).
4. **Anúncio agrupado:** as mudanças vão para um acumulador. A primeira mudança abre uma janela de **1 s** para juntar as que chegarem logo depois; no fim dela, **uma** chamada `announce(msg, 'polite')`. Depois de anunciar, **nenhum aviso novo por 5 s**: o que chegar nesse intervalo espera e sai junto, numa só mensagem, quando os 5 s passarem. Mensagem: partes `N preço(s)` e `N esgotado(s)` unidas por " e ": "1 preço foi atualizado", "2 preços foram atualizados", "1 NFT esgotou", "2 NFTs esgotaram", "2 preços foram atualizados e 1 NFT esgotou". Limpar timers ao desmontar.
5. Quem chama passa `items` **sem** o `placeholderData` (`isPlaceholderData` → `undefined`) e uma `resetKey` que muda com a chave da consulta.
6. Fechamento: `npx prettier --write src/hooks/useLiveChanges.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/hooks/useLiveChanges.ts` e `git commit -m "06-030: hook useLiveChanges"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; trocar de filtro/página **não** gera selo nem aviso.
- [ ] Três preços mudando em menos de 1 s geram **um** aviso ("3 preços foram atualizados"), não três; uma mudança nova nos 5 s seguintes só é anunciada depois deles.
- [ ] O selo some sozinho em 5 s; nada muda de posição nem recebe foco.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Coberto no 06-065.

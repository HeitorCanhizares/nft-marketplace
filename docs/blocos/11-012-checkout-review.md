# 11-012 — `CheckoutReview` (modal no desktop, drawer no mobile)

**Status:** pendente
**Fluxo / subitem:** Pagamento › 7, 8, 9
**Depende de:** 11-010, 11-011
**Toca:** `src/components/shared/CheckoutReview.tsx` (novo)
**Paralelo:** pode rodar com 11-013, 11-014, 11-016. O 11-017 espera este.
**Lote:** H

## Objetivo
A revisão final antes do envio, com as mudanças da cotação em destaque e os botões "Confirmar e pagar" e "Voltar". **Não está desenhada no Figma**: usar `Dialog` (desktop) e `Sheet` (mobile) do projeto e o estilo do resto da tela.

## Arquivos
- criar: `src/components/shared/CheckoutReview.tsx`

## Referências
- docs/design/componentes.md (`CheckoutReview`); docs/fluxos/pagamento.md subitens 7, 8 e 9
- `src/components/ui/dialog.tsx`, `src/components/ui/sheet.tsx` (ver como `FilterSheet.tsx` e `AuthDialog.tsx` usam), `src/hooks/useMediaQuery.ts` (`useIsDesktop`), `LineItemList` `summary` (11-011), `QuoteChangeList` (11-010), `PriceSummary`, `Button`, `providerLabel`, `networkLabel`, `shortAddress`, `SubmitPhase` (11-006), `QuoteChangeEntry` (11-001)

## Instruções
1. Props:
```ts
type CheckoutReviewProps = {
  open: boolean
  quote: Quote | null
  changes: readonly QuoteChangeEntry[]
  collectorName: string
  collectorAddress: string        // endereço 0x completo do colecionador
  provider: WalletProvider | null
  walletAddress: string | null    // carteira conectada
  network: Network | null
  phase: 'idle' | 'signing' | 'sending' | 'confirming'
  error: string | null
  canPay: boolean                 // false quando a carteira não está pronta
  blockMessage: string | null     // ex.: "Carteira desconectada. Conecte novamente."
  removingId: string | null
  onReconnect: () => void         // botão "Conectar carteira" ao lado do blockMessage
  onPay: () => void
  onBack: () => void
  onRemoveItem: (itemId: string) => void
}
```
2. `useIsDesktop()` escolhe `Dialog` (largura máx. 560 px) ou `Sheet` `side="bottom"` (altura máx. 90 dvh, rolável). `onOpenChange(false)` chama `onBack` (Esc e fora fecham, **exceto** com `phase !== 'idle'`: aí bloquear o fechamento). Título "Revisar pedido"; descrição curta "Confira os dados antes de pagar.".
3. Conteúdo, nesta ordem: (a) se `changes.length > 0`: bloco "Os valores mudaram" com `QuoteChangeList` e a frase "Confirme de novo para continuar." (`role="status"`, para o leitor de tela); (b) itens: `LineItemList variant="summary"` com `quote.items`; (c) dados em lista `<dl>`: Colecionador, Endereço do colecionador, Carteira ({provedor}, `shortAddress`), Rede, Cupom (se `quote.coupon`); (d) `PriceSummary` com a cotação (`isUpdating=false`, `isError=false`); (e) `error` em `role="alert"` e `blockMessage` em `role="status"` com o botão "Conectar carteira" (`onReconnect`, altura mínima 44 px).
4. Rodapé: "Voltar" (`variant="outline"`, `onBack`) e "Confirmar e pagar" (`onPay`). Esse botão: `disabled={!canPay}`, `aria-busy={phase !== 'idle'}`, **fica bloqueado desde o primeiro clique** enquanto `phase !== 'idle'`, texto "Processando..." em `signing`/`sending` e "Confirmando seu pedido..." em `confirming`. O foco inicial vai para "Voltar" (padrão seguro), e volta ao botão "Confirmar compra" ao fechar (o `Dialog`/`Sheet` já devolve o foco ao gatilho).
5. Item esgotado com `onRemoveItem`: o botão vem da `QuoteChangeList`; `removingId` repassado.
6. Só tokens de cor; `cn`; Radix com `data-[state=…]`; sem hexadecimal.
7. Fechamento: prettier; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0 (se falhar por arquivo de **outro** agente, esperar e repetir). Commit: `git commit -m "11-012: CheckoutReview" -- <arquivo>`.

## Critérios de aceite
- [ ] Desktop abre `Dialog`; mobile abre `Sheet` inferior; ambos com título e foco preso.
- [ ] Com `changes` mostra a lista com antes → depois e "Confirme de novo para continuar."; sem `changes` não mostra o bloco.
- [ ] Durante o envio o botão não aceita novo clique, mostra "Processando..." e o diálogo não fecha.
- [ ] Sem cor hexadecimal fora dos tokens; sem `any`, `as` ou `@ts-ignore`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Visual e comportamento: 11-018 e 11-019.

# 12-014 — Tela mobile da Confirmação e esqueleto

**Status:** pendente
**Fluxo / subitem:** Confirmação › 1, 6 (mobile adaptado: página cheia com `MobileTopBar`)
**Depende de:** 12-006, 12-008, 12-010
**Toca:** `src/pages/OrderConfirmation/OrderConfirmationMobile.tsx` (novo), `src/pages/OrderConfirmation/OrderConfirmationSkeleton.tsx` (novo)
**Paralelo:** pode rodar com o 12-013 (arquivos distintos).
**Lote:** H

## Objetivo
No mobile, o pedido vira página cheia com a barra "Pedido" e o mesmo `OrderStatus`; mais o esqueleto das duas telas.

## Arquivos
- criar: `src/pages/OrderConfirmation/OrderConfirmationMobile.tsx`
- criar: `src/pages/OrderConfirmation/OrderConfirmationSkeleton.tsx`

## Referências
- docs/fluxos/confirmacao.md subitens 1 e 6; docs/design/telas/README.md (Confirmação: "Mobile: adaptar como página cheia com `MobileTopBar`"); `docs/design/telas/mobile-pagamento.png` e `mobile-carrinho.png` (linguagem visual do mobile, 414 px)
- `MobileTopBar` (`backTo`), `OrderStatus` (12-010), `viewProps.ts` (12-008), `OrderDialog` (12-008), `LineItemSkeleton variant="receipt"` (12-006), `Skeleton`, `useIsDesktop`; padrão de esqueleto: `src/pages/Checkout/CheckoutSkeleton.tsx`

## Medidas (adaptação do desktop; **proposta**, sem captura mobile no Figma)
- 414 px de largura, margem lateral **28 px**, conteúdo de **358 px**. Barra superior padrão do `MobileTopBar` (voltar de 36 px em x 28, título "Pedido" 20 px).
- O resto vem do `OrderStatus`/`OrderReceipt` (`variant="mobile"`): faixa em grade 2 × 2 num cartão `rounded-card`, itens em cartões, botão de **358 × 60 px** em pílula.

## Instruções
1. `OrderConfirmationMobile({ order, isSlow }: OrderViewProps)`:
```tsx
<div className="flex flex-col pb-8">
  <MobileTopBar title="Pedido" backTo={{ to: '/' }} />
  <div className="px-7"><OrderStatus order={order} isSlow={isSlow} variant="mobile" /></div>
</div>
```
   O voltar (`backTo`) leva à **Início**, não ao histórico (decisão do fluxo: "voltar (mobile) leva à Início"; o recibo continua acessível pela URL). O `h1` é o título fixo "Pedido" da barra; o estado aparece nos `h2` do `OrderStatus`. `onClose` não é usado no mobile.
2. `OrderConfirmationSkeleton()`: `role="status"`, `aria-busy="true"`, texto `sr-only` "Carregando pedido…". Com `useIsDesktop()`:
   - **Desktop:** `OrderDialog title="Carregando pedido" onClose` (usa `useNavigate()` para `/`), com o miolo em `Skeleton`: bloco de 66 × 80 px e barra de título; faixa de 65 px; três `LineItemSkeleton variant="receipt"` (70 px, 12 px de espaço); duas barras de totais; barras da mensagem; botão de 186 × 48 px.
   - **Mobile:** `MobileTopBar title="Pedido" backTo={{ to: '/' }}` + os mesmos blocos em 358 px, botão de 358 × 60 px.
3. Só tokens de cor; `cn`; sem hexadecimal; sem `ref` no render.
4. Fechamento: prettier nos 2; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0 (se falhar por arquivo de **outro** agente em andamento, esperar e repetir, sem mexer nele). Commit só dos 2: `git commit -m "12-014: tela mobile da confirmação" -- <arquivos>`.

## Critérios de aceite
- [ ] A 414 px: margem de 28 px, conteúdo de 358 px, sem rolagem horizontal a 320 px.
- [ ] O voltar da barra navega para `/` mesmo com histórico.
- [ ] O esqueleto desktop usa a mesma moldura (578 px) e o mobile a mesma barra, sem salto de layout ao trocar pelo conteúdo.
- [ ] Sem cor hexadecimal fora dos tokens; sem `any`, `as`, `!`, `@ts-ignore` nem `eslint-disable`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Visual no 12-018 e no 12-019 (o mobile é **adaptado**: o usuário aprova na baseline).

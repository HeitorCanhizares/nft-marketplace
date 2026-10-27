# 12-010 — `OrderStatus` (pendente, confirmado e recusado)

**Status:** pendente
**Fluxo / subitem:** Confirmação › 2, 3, 4
**Depende de:** 12-009
**Toca:** `src/components/shared/OrderStatus.tsx` (novo)
**Paralelo:** mesmo agente do 12-009 (lote E). Os blocos 12-013 e 12-014 esperam este.
**Lote:** E

## Objetivo
O conteúdo do modal/página para cada estado do pedido. **Pendente** e **recusado** não estão no Figma: criar no padrão visual existente. O `OrderReceipt` só é renderizado com `confirmed`.

## Arquivos
- criar: `src/components/shared/OrderStatus.tsx`

## Referências
- docs/fluxos/confirmacao.md subitens 2, 3 e 4; docs/design/componentes.md (`OrderStatus`: "O `OrderReceipt` só é renderizado com status confirmado"); docs/design/tokens.md (`destructive`, `primary`)
- `OrderReceipt` (12-009), `networkLabel` (`src/lib/walletOptions.ts`), `Button`, `src/components/shared/ErrorState.tsx` e `EmptyState.tsx` (padrão de ícone em círculo de 64 px `bg-card`), lucide (`Loader2Icon`, `CircleXIcon`, `InfoIcon`), `Link` do TanStack Router
- Atenção ao nome: `OrderStatus` também é o **tipo** de `@/types/order`. Importar o tipo como `import type { Order, OrderStatus as OrderStatusValue }`.

## Instruções
1. Props: `{ order: Order; isSlow: boolean; variant: 'desktop' | 'mobile' }`. Troca por `order.status`: `pending` → painel pendente; `confirmed` → `<OrderReceipt order={order} variant={variant} />`; `declined` → painel recusado. `switch` exaustivo sobre `OrderStatusValue` (sem `default` que esconda um estado novo).
2. **Pendente** (`<div role="status">` = `aria-live` polite): coluna centralizada, `px-11 py-12` (desktop) / `py-10` (mobile), `gap-4`:
   - `Loader2Icon` de 48 px `text-primary` com `animate-spin motion-reduce:animate-none`, `aria-hidden`;
   - `h2` "Confirmando pagamento..." (`text-lg` negrito `foreground`);
   - `<p>` `text-body muted-foreground`: "Aguardando a confirmação na rede {networkLabel(order.network)}. Isso leva só alguns instantes.";
   - com `isSlow`: bloco com `InfoIcon` + texto "Está demorando mais que o normal. Você pode sair; o pedido continua sendo processado." (`text-caption-md`, `border-border-strong`, `rounded-mobile`, `p-3`) e o botão `variant="outline"` "Voltar ao início" (`Link to="/"`). **Sem recibo, sem ID da transação.**
3. **Recusado:** mesma coluna; círculo de 64 px `bg-card` com `CircleXIcon` de 32 px `text-destructive` (`aria-hidden`); `h2` "Pagamento recusado" em `text-destructive`; motivo `order.declineReason ?? 'O pagamento não foi aprovado.'` em `text-body foreground`; "Seus itens continuam no carrinho." em `muted-foreground`; botões (`Link`): **"Tentar novamente"** (`Button` padrão, `to="/pagamento"`) e **"Voltar ao carrinho"** (`variant="outline"`, `to="/carrinho"`). Erro com ícone + texto + cor, nunca só cor. Desktop: botões lado a lado de 186 × 48 px, 12 px de espaço; mobile: empilhados, 358 × 60 px (`variant="gradient"` o primário, `rounded-full`).
4. Nada de `useQuery`, nem de efeitos colaterais aqui (anúncios e limpeza do `sessionStorage` são do `useOrderOutcome`, 12-012). "Tentar novamente" é só um link para `/pagamento`: a chave de idempotência é limpa pelo `useOrderOutcome` quando o pedido sai de `pending`, então o próximo envio gera uma chave **nova**.
5. Só tokens de cor; `cn`; sem hexadecimal; sem `ref` no render.
6. Fechamento: prettier; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0 (se falhar por arquivo de **outro** agente em andamento, esperar e repetir, sem mexer nele). Commit: `git commit -m "12-010: OrderStatus" -- <arquivo>`.

## Critérios de aceite
- [ ] `pending` e `declined` nunca renderizam o `OrderReceipt` nem o `txHash`; `confirmed` renderiza só o recibo.
- [ ] Pendente: indicador de progresso, `role="status"`, aviso de demora só com `isSlow`; o ícone não anima com `prefers-reduced-motion`.
- [ ] Recusado: motivo, "Seus itens continuam no carrinho", "Tentar novamente" → `/pagamento`, "Voltar ao carrinho" → `/carrinho`.
- [ ] Sem cor hexadecimal fora dos tokens; sem `any`, `as`, `!`, `@ts-ignore` nem `eslint-disable`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Comportamento no 12-017; recusa e aviso de demora em detalhe no 12-020 (fase 13).

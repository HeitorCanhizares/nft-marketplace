# 12-013 — Tela desktop da Confirmação (modal)

**Status:** pendente
**Fluxo / subitem:** Confirmação › 1, 6
**Depende de:** 12-008, 12-010 (decisão Q1)
**Toca:** `src/pages/OrderConfirmation/OrderConfirmationDesktop.tsx` (novo)
**Paralelo:** pode rodar com o 12-014 (arquivos distintos; os dois dependem só dos tipos de `viewProps.ts` e dos componentes prontos).
**Lote:** G

## Objetivo
No desktop, o pedido aparece num `Dialog` centralizado sobre fundo opaco, como no Figma: pendente, confirmado (recibo) ou recusado, com X e Esc levando à Início.

## Arquivos
- criar: `src/pages/OrderConfirmation/OrderConfirmationDesktop.tsx`

## Referências
- docs/fluxos/confirmacao.md subitens 1 e 6; docs/arquitetura/rotas.md ("Login, Cadastro e Confirmação"); tela `docs/design/telas/desktop-confirmacao.png` (1:1; **medir com recorte**)
- `OrderDialog`, `viewProps.ts` (`OrderViewProps`, `orderTitle`) (12-008), `OrderStatus` (12-010)
- Padrão de página-modal: `src/pages/SignIn/SignIn.tsx`

## Medidas do Figma
Todas as medidas do modal (578 px de largura, topo a 166 px, faixa inferior de 10 px, fundo opaco `background`) estão no 12-008 e as do recibo no 12-009. Este bloco só compõe.

## Instruções
1. `OrderConfirmationDesktop(props: OrderViewProps)`: 
```tsx
<OrderDialog title={orderTitle(order.status)} onClose={onClose}>
  <OrderStatus order={order} isSlow={isSlow} variant="desktop" />
</OrderDialog>
```
2. **Só isso renderiza**: o fundo do Figma é totalmente opaco (decisão Q1: **não** montar o Pagamento por trás). O cabeçalho e o rodapé da `AppShell` continuam existindo atrás do fundo; o Radix os deixa inertes e fora da árvore de acessibilidade enquanto o modal está aberto.
3. Nenhuma lógica de dados, rota ou efeito aqui; o `onClose` vem da página (navega para `/`).
4. Fechamento: prettier; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0 (se falhar por arquivo de **outro** agente em andamento, esperar e repetir, sem mexer nele). Commit: `git commit -m "12-013: tela desktop da confirmação" -- <arquivo>`.

## Critérios de aceite
- [ ] O título acessível do diálogo muda com o estado ("Confirmando pagamento", "Pedido confirmado", "Pagamento recusado") sem remontar o diálogo.
- [ ] Esc e X chamam `onClose` uma vez.
- [ ] Sem `any`, `as`, `!`, `@ts-ignore` nem `eslint-disable`; sem cor hexadecimal.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Visual e foco no 12-017 a 12-019.

# 12-007 — `PriceSummary` variante `receipt` (valores do snapshot)

**Status:** concluído
**Fluxo / subitem:** Confirmação › 3 (taxa de rede e total do recibo)
**Depende de:** —
**Toca:** `src/components/shared/PriceSummary.tsx` (alterar)
**Paralelo:** pode rodar com os lotes A, B e D da onda 1. O 12-009 espera este. **Atenção:** usado pelo carrinho, pelo Pagamento e pela revisão; `default` e `checkout` não podem mudar.
**Lote:** C (depois do 12-006)

## Objetivo
Fazer o `PriceSummary` aceitar os valores de um pedido (snapshot) e ganhar a variante `receipt` do Figma da Confirmação.

## Arquivos
- alterar: `src/components/shared/PriceSummary.tsx`

## Referências
- docs/design/componentes.md (`PriceSummary`: CA, PG, CO); tela `docs/design/telas/desktop-confirmacao.png` (1:1)
- `src/components/shared/PriceSummary.tsx` (variantes `default` e `checkout`), `src/types/cart.ts` (`Quote`), `src/types/order.ts` (`Order`)

## Medidas do Figma (desktop, tabela de 490 px, x 475–965)
- Duas linhas com passo de **30 px** (medido no Figma no fechamento; antes 29): "Taxa de rede" e "Total" (negrito), rótulos em 15 px (`text-body`) `foreground` que **começam a 169 px da borda esquerda** da tabela (x 644); valores em 17 px (`text-subtitle`) alinhados à **direita** da tabela (x 965): taxa `foreground`, total negrito `text-price`.
- Linha de **1 px** (`border-soft`) abaixo do total (y 782), largura total da tabela, e 18 px de espaço até a mensagem de status.

## Instruções
1. Tipo da prop: `type PriceSummaryValues = Pick<Quote, 'subtotal' | 'discount' | 'networkFee' | 'total'> & { networkFeeEstimated?: boolean }` e `quote?: PriceSummaryValues` (um `Quote` e um `Order` servem; **o nome da prop não muda**, para não tocar nos chamadores). Os chamadores atuais continuam compilando sem alteração.
2. `variant` passa a `'default' | 'checkout' | 'receipt'`; nova prop opcional `showDiscount?: boolean` (só vale em `receipt`, padrão `false`).
3. `receipt`: `<dl>` com as linhas acima. Com `showDiscount`, antes da taxa entram "Subtotal" e "Desconto do lançamento" com `(-) {valor}` (mesmos rótulos do carrinho, mesmo passo de 30 px; o recibo só passa `showDiscount` quando o pedido tem cupom). **Sem** "Taxa estimada" no `receipt` (a taxa de um pedido confirmado não é estimativa). **Mobile** (adaptado): abaixo de 1024 px os rótulos ficam na borda esquerda (o recuo de 169 px vale só a partir de `lg:`). Estados `isUpdating`/`isError`/carregando não se aplicam: o recibo sempre recebe os valores; mantenha os ramos de erro e de carregamento já existentes funcionando para as outras variantes.
4. Só tokens de cor; `cn`; sem hexadecimal.
5. Fechamento: prettier; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0 (se falhar por arquivo de **outro** agente em andamento, esperar e repetir, sem mexer nele). Commit: `git commit -m "12-007: PriceSummary receipt" -- <arquivo>`.

## Critérios de aceite
- [ ] `default` e `checkout` idênticos (specs `cart` e `checkout` verdes).
- [ ] `<PriceSummary quote={order} variant="receipt" />` compila com um `Order` e mostra só "Taxa de rede" e "Total"; com `showDiscount` mostra também "Subtotal" e "Desconto do lançamento".
- [ ] Os valores são exibidos como vêm (strings), sem somar nem arredondar.
- [ ] Sem cor hexadecimal fora dos tokens; sem `any`, `as`, `!`, `@ts-ignore` nem `eslint-disable`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build, `npm run test:e2e -- cart checkout`. Visual no 12-019.

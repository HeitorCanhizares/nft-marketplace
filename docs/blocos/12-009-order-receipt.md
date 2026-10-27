# 12-009 — `OrderReceipt` (recibo do pedido confirmado)

**Status:** concluído
**Fluxo / subitem:** Confirmação › 3, 5
**Depende de:** 12-001, 12-006, 12-007 (decisões Q2, Q3, Q5)
**Toca:** `src/components/shared/OrderReceipt.tsx` (novo)
**Paralelo:** pode rodar com o lote F (hooks) e com o lote J. O 12-010 espera este (mesmo agente).
**Lote:** E

## Objetivo
O recibo do Figma: ícone "Thank you", título, faixa (ID da transação / Data / Total / Carteira), itens, taxa e total, mensagem de status e botão do explorador da rede. Montado **só** com o snapshot do `Order`; nunca consulta `GET /nfts`.

## Arquivos
- criar: `src/components/shared/OrderReceipt.tsx`

## Referências
- docs/fluxos/confirmacao.md subitens 3 e 5; docs/design/componentes.md (`OrderReceipt`); docs/design/telas/desktop-confirmacao.png (1:1, 1440 × 1657; **medir com recorte**)
- `LineItemList variant="receipt"` (12-006), `PriceSummary variant="receipt"` (12-007), `MailOpenIcon` do `lucide-react` (decisão Q2; o 12-005 foi cancelado), `explorerName`, `isExplorerUrl` (12-001), `shortAddress` (`src/lib/address.ts`), `networkLabel` (`src/lib/walletOptions.ts`), `formatEth` (`src/lib/formatEth.ts`), `useLiveAnnouncer` (`@/contexts/liveAnnouncer`), `Button`, `Order` (`src/types/order.ts`)

## Medidas do Figma (desktop; modal de 578 px, conteúdo da tabela de **490 px**, 44 px de margem lateral)
Cores: título e faixa em `muted-foreground`; "Detalhes da transação" e cabeçalhos em `foreground`; mensagem em `muted-foreground`; linhas de 1 px da faixa e do cabeçalho em `primary` de ponta a ponta do modal; separadores verticais da faixa `bg-primary/60` (≈ `#915e36`), 1 × 31 px.

| Elemento | Medida |
|---|---|
| Cabeçalho | y 166–322 (156 px): ícone `MailOpenIcon` (lucide, `aria-hidden`) numa caixa de **66 × 80 px** (`h-20 w-[66px]`, `strokeWidth` padrão) a 22 px do topo, centralizado, `text-primary`; título "Seus NFTs agora estão na sua carteira" em 16 px (`text-base`) negrito centralizado, texto em y 285–301 (≈ 18 px abaixo do ícone, 21 px acima da linha) |
| Faixa de dados | y 323–388 (**65 px**), centralizada, 4 células com `px-4` e separador de 1 px entre elas (x 612, 757, 883). Rótulo e valor empilhados (centros em y 345 e 364), **14 px** (`text-sm`); rótulos **todos em negrito** (o Figma mistura; decisão do Sonnet, proposta) |
| "Detalhes da transação" | `h3` 15 px (`text-body`) negrito `foreground`, centro em y 418 (≈ 22 px abaixo da linha da faixa) |
| Tabela | cabeçalho em y 446, linha de 1 px (`border-soft`) em y 464, linhas de 70 px a partir de y 477 (12 px de espaço) — vêm do `LineItemList` (12-006) |
| Totais | centros em y 734 e 763 (≈ 23 px abaixo da última linha), linha de 1 px em y 782 — vêm do `PriceSummary` (12-007) |
| Mensagem | 15 px (`text-body`) `muted-foreground`, centralizada, entrelinha **22 px**, largura 490 px (3 linhas no Figma), centro da 1ª linha em y 806 (18 px abaixo da linha) |
| Botão do explorador | **186 × 48 px** (x 627–812, y 881–928), `Button` padrão (`primary`), texto 16 px (`text-base`) negrito `primary-foreground`; 26 px abaixo da mensagem; 49 px até a faixa inferior do modal |

Células da faixa: **ID da transação** (`shortAddress(txHash)` = `0xA91F…E82C`), **Data**, **Total** (`formatEth(order.total)`), **Carteira** (`order.wallet.label`, ex.: "MetaMask").

## Instruções
1. Props: `{ order: Order; variant: 'desktop' | 'mobile' }`. **Defesa em profundidade:** `order.status !== 'confirmed'` → devolve `null` (o recibo nunca aparece de outro jeito, mesmo que alguém o monte por engano).
2. Estrutura: `<section aria-labelledby={titleId}>` (`useId`), `h2` visível com o título; faixa como `<dl>` (4 `div` com `dt` rótulo e `dd` valor); `h3` "Detalhes da transação"; `LineItemList variant="receipt" items={order.items}`; `PriceSummary variant="receipt" quote={order} showDiscount={order.coupon !== undefined} isUpdating={false} isError={false} onRetry={noop}` (`noop` = função vazia local); `<p>` da mensagem; botão. Ordem DOM = ordem visual.
3. **ID da transação:** texto curto `aria-hidden` com `title={txHash}` + `<span className="sr-only">{txHash}</span>` com o valor **completo** para leitor de tela; ao lado, botão só de ícone (lucide `CopyIcon`, `aria-label="Copiar ID da transação"`, alvo de 44 × 44 px sem aumentar a faixa: margens negativas) que faz `navigator.clipboard.writeText(txHash)` dentro de `try/catch` e anuncia `polite` "ID da transação copiado" (ou "Não foi possível copiar o ID da transação"); o ícone troca para `CheckIcon` por 2 s (`useState` + `setTimeout` limpo no cleanup). `txHash` ausente (não deveria) → "—" sem botão.
4. **Data:** `new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })` criado uma vez no módulo, aplicado a `new Date(order.createdAt)` → "29 de jul. de 2026" (decisão Q3; o Figma tem "29 Jul, 2026", em inglês).
5. **Mensagem:** `Transação confirmada na {networkLabel(order.network)}. A propriedade foi transferida para sua carteira conectada e registrada na rede.`
6. **Explorador:** só renderiza o botão se `order.explorerUrl !== undefined && isExplorerUrl(order.explorerUrl)`. `Button asChild` com `<a href={order.explorerUrl} target="_blank" rel="noopener noreferrer">`; texto `Ver no {explorerName(order.network)}` + `<span className="sr-only"> (abre em nova aba)</span>`. Abaixo do botão, legenda visível **"Transação simulada"** (`text-caption` `muted-foreground`, `mt-2`): o link aponta para um hash fictício. Desktop: botão `w-[186px] h-12`; mobile: `variant="gradient"`, `h-[60px] w-full rounded-full`.
7. **Mobile** (adaptado, não existe no Figma; margem lateral de 28 px dada pela página, conteúdo de 358 px): sem as linhas de 1 px do cabeçalho; faixa em grade **2 × 2** dentro de um cartão (`bg-card rounded-card p-4 gap-y-4`, sem separadores verticais); itens como cartões (`rounded-card`, via `LineItemList`); mensagem em 14 px (`text-sm`); botão de 358 × 60 px em pílula.
8. Só tokens de cor (`primary/60` é o token com opacidade); `cn`; sem hexadecimal; sem `ref` lido no render. Nenhum dado fora do `order` (sem `useQuery`, sem `GET /nfts`).
9. Fechamento: prettier; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0 (se falhar por arquivo de **outro** agente em andamento, esperar e repetir, sem mexer nele). Commit: `git commit -m "12-009: OrderReceipt" -- <arquivo>`.

## Critérios de aceite
- [ ] Com `status !== 'confirmed'` nada é renderizado.
- [ ] O recibo reproduz só o snapshot: nomes, imagens, edições, quantidades, subtotais, taxa e total saem de `order`.
- [ ] A 1440 px o botão tem 186 × 48 px e a faixa 65 px de altura (DOM e recorte).
- [ ] O botão do explorador usa o nome da rede do pedido (Etherscan, Polygonscan, Solscan), abre em nova aba com `rel="noopener noreferrer"` e some se a URL não for de um explorador conhecido.
- [ ] O ID abreviado tem o valor completo acessível e o botão de copiar anuncia o resultado.
- [ ] Sem cor hexadecimal fora dos tokens; sem `any`, `as`, `!`, `@ts-ignore` nem `eslint-disable`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Visual e comportamento: 12-017 a 12-019.

# 08-010 — `CouponField`, `PriceSummary` e `CartSummaryPanel`

**Status:** pendente
**Fluxo / subitem:** Carrinho › 4 (cupom), 5 (resumo pela cotação), 9 (ir para o pagamento)
**Depende de:** 08-007, 08-008

## Objetivo
Campo de cupom, resumo de valores e o painel "Resumo do pedido" (desktop e mobile) que junta os dois com os botões de finalizar.

## Arquivos
- criar: `src/components/shared/CouponField.tsx`
- criar: `src/components/shared/PriceSummary.tsx`
- criar: `src/components/shared/CartSummaryPanel.tsx`

## Referências
- Telas: `desktop-carrinho.png` (painel à direita) e `mobile-carrinho.png` (painel inferior, campo em pílula com gradiente); correção do Figma: título **"Resumo do pedido"** (não "Resumo da carteira")
- docs/design/componentes.md (`CouponField`, `PriceSummary`); docs/fluxos/carrinho.md (subitens 4, 5, 9)
- `Input`, `Button` (variantes `default` e `gradient`), `Label`, `FormField` (`src/components/shared/FormField.tsx`), `useDeferredEmptyValidation`, `couponFormSchema` (08-007), `formatEth`, `Skeleton`, `ErrorState`

## Instruções
1. **`CouponField`** — props: `coupon?: { code: string; status: 'applied' | 'expired'; message?: string }`, `onApply(code)`, `onRemove()`, `isApplying`, `isRemoving`, `error: { message: string } | null`, `labelHidden?: boolean` (mobile: rótulo só para leitor de tela, como no Figma), `variant: 'desktop' | 'mobile'`.
   - `react-hook-form` + `zodResolver(couponFormSchema)` com **`useDeferredEmptyValidation`** (campo vazio só é validado no envio: chamar `markSubmitAttempt()` antes de `handleSubmit`).
   - Campo com rótulo "Código promocional", placeholder "Digite o código promocional..." e botão "Aplicar" (`type="submit"`, `aria-busy` e clique ignorado enquanto `isApplying`).
   - Aplicado: no lugar do campo, "Cupom {CÓDIGO} aplicado" (ou a `message` quando `status: 'expired'`, em texto de aviso) e botão-texto "Remover cupom" (`aria-label` "Remover cupom {CÓDIGO}").
   - Erro de formato ou do servidor (`error`): mensagem abaixo do campo ligada por `aria-describedby`, `aria-invalid="true"`, e **foco no campo** quando o `error` muda (efeito; sem `ref` lido no render).
2. **`PriceSummary`** — props: `quote?: Quote`, `isUpdating: boolean`, `isError: boolean`, `onRetry()`. Lista de definição (`dl`): **Subtotal**, **Desconto do lançamento** (valor `(-) {discount} ETH`, hífen como no Figma), **Taxa de rede** (com "Taxa estimada" pequeno quando `networkFeeEstimated`), **Total** (destaque, cor primária). **Exatamente as strings da cotação**, só passando por `formatEth`. `aria-busy={isUpdating}`; durante a atualização mantém os valores antigos com opacidade reduzida e um texto só para leitor de tela "Atualizando valores". Sem `quote` e sem erro: skeleton das 4 linhas. `isError` sem `quote`: "Não foi possível calcular os valores." + "Tentar novamente".
3. **`CartSummaryPanel`** — props: `variant: 'desktop' | 'mobile'`, as props do `CouponField` (`coupon`, `onApply`, `onRemove`, `isApplying`, `isRemoving`, `couponError`), as do `PriceSummary` (`quote`, `isUpdating`, `isQuoteError`, `onRetryQuote`), e `checkout: { canCheckout: boolean; reason: string | null; onCheckout(): void }`.
   - Desktop: `section` com `aria-labelledby`, título `h2` **"Resumo do pedido"** com linha divisória, `CouponField`, `PriceSummary`, botão **"Conectar e finalizar"** (largura total) e link **"Continuar explorando"** para o catálogo da Início (`/` com `hash="catalogo"`). Mobile: painel inferior arredondado no topo, **sem** título nem "Continuar explorando", botão `gradient` em pílula.
   - O botão fica `disabled` quando `!canCheckout`; o texto `reason` aparece **junto ao botão** (ligado por `aria-describedby`). O texto do botão é sempre "Conectar e finalizar", logado ou não.
   - Mobile: `sticky bottom-0` com `max-h-[60dvh] overflow-y-auto` e `padding-bottom` com `env(safe-area-inset-bottom)` (proposta; ver pergunta ao usuário).
4. Fechamento: prettier nos 3; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `08-010: cupom, resumo e painel do carrinho`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; **nenhuma** operação numérica sobre ETH; sem cor hexadecimal fora dos tokens; `cn` sem `!`.
- [ ] "Aplicar" com o campo vazio só mostra "Informe o código promocional." depois do envio, e leva o foco ao campo.
- [ ] Com cupom aplicado: código e "Remover cupom" aparecem; sem cupom: campo e "Aplicar".
- [ ] Acessibilidade: campo com rótulo, erro ligado ao campo, botões ≥ 44 px, `aria-busy` no resumo, sem overflow em 320 px.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Visual no 08-013.

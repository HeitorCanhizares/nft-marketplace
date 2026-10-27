# 11-014 — Coluna do colecionador (desktop) e tipos das telas

**Status:** pendente
**Fluxo / subitem:** Pagamento › 2, 3
**Depende de:** 11-007, 11-009
**Toca:** `src/pages/Checkout/viewProps.ts` (novo), `src/pages/Checkout/CollectorSection.tsx` (novo)
**Paralelo:** pode rodar com 11-012 e 11-013. Os blocos 11-015 e 11-016 esperam este (os tipos de `viewProps.ts`).
**Lote:** J (seguido do 11-015)

## Objetivo
Os tipos compartilhados pelas duas telas do Pagamento e a coluna esquerda do desktop: "Perfil do colecionador" (`WalletForm variant="checkout"`), "Usar outra carteira?", "Salvar como carteira secundária" e a observação.

## Arquivos
- criar: `src/pages/Checkout/viewProps.ts`
- criar: `src/pages/Checkout/CollectorSection.tsx`

## Referências
- docs/fluxos/pagamento.md subitens 2 e 3; tela `docs/design/telas/desktop-pagamento.png` (1:1; **medir com recorte**)
- `src/components/shared/WalletForm.tsx` (props `variant`, `form`, `serverErrors`, `disabled`, `className`; o `className` entra por `cn`), `FormField` (`plain`), `src/components/ui/{checkbox,radio-group,textarea}.tsx`, `src/pages/Wallets/PrimaryWalletSection.tsx` (padrão de seção), `src/hooks/useCheckoutForm.ts` (11-007), `src/pages/Cart/viewProps.ts` (padrão dos tipos de tela)

## Medidas do Figma (desktop, 1440 px, container x 120–1320)
- Duas colunas: esquerda **763 px** (x 120–883), direita **405 px** (x 915–1320), espaço de 32 px. (A direita é do 11-015.)
- Título "Perfil do colecionador" em negrito (≈ 17 px), centro em y 158. Primeiro rótulo em y 192; primeiro campo começa em y 206.
- Grade do `WalletForm`: duas colunas de **369 e 370 px** com **24 px** de espaço; campos de **40 px** de altura; **passo entre linhas de 81 px** (campos em y 206, 287, 368, 449, 530). Para isso passar `className="lg:gap-x-6 lg:gap-y-[23px]"` ao `WalletForm` (o padrão dele, de Carteiras, dá 89 px); **conferir no navegador** com `getBoundingClientRect` a 1440 px e ajustar só esse `className` até bater (passo 81, campos 40, colunas 369/370). Seletor "Nome ENS": gatilho `.eth` de 78 px (x 513–592).
- "Usar outra carteira?": controle **circular** de 16 px (borda `primary`, x 120–136, centro y 602) e texto a 7 px dele (x 143); começa **24 px** abaixo do último campo (y 570).
- "Observação do colecionador (opcional)" (rótulo regular, centro y 645, ≈ 27 px abaixo do controle anterior) e o `Textarea` de **350 × 152 px** (x 120–470, y 665–817), borda 1 px, sem redimensionar.

## Instruções
1. `viewProps.ts` (**só tipos**, sem JSX), usados também por 11-015, 11-016 e 11-017:
```ts
export type CheckoutFormApi = ReturnType<typeof useCheckoutForm>
export type CheckoutWalletApi = ReturnType<typeof useCheckoutWallet>
export type CheckoutQuoteView = { quote: Quote | undefined; isUpdating: boolean; isError: boolean; onRetry: () => void }
export type CheckoutCouponView = Pick<CartSummaryPanelProps, 'coupon' | 'onApply' | 'onRemove' | 'isApplying' | 'isRemoving' | 'couponError'>
export type CheckoutConfirmView = { onConfirm: () => void; isChecking: boolean; message: string | null }
export type CheckoutViewProps = {
  items: CartItem[]
  form: CheckoutFormApi
  wallet: CheckoutWalletApi
  quote: CheckoutQuoteView
  coupon: CheckoutCouponView
  confirm: CheckoutConfirmView
  onEditWallet: () => void   // mobile: "Editar carteira" do menu "⋮"
}
```
2. `CollectorSection({ form }: { form: CheckoutFormApi })`:
   - `<section aria-labelledby>` com `h2` "Perfil do colecionador" e `WalletForm variant="checkout" form={form.form} serverErrors={form.serverErrors}` (+ o `className` acima).
   - Controle "Usar outra carteira?": `Checkbox` com `rounded-full` (aspecto do Figma), `checked={form.useOther}`, `onCheckedChange={(on) => form.setUseOther(on === true)}`, rótulo clicável.
   - Com `useOther`: `RadioGroup` (`value={form.mode}`, `onValueChange` → `form.setMode`) com as opções **"Carteira secundária"** (só se `form.hasSecondary`) e **"Preencher outra carteira"** (valor `manual`), mesmo estilo circular de 16 px.
   - Em `manual`: `Checkbox` "Salvar como carteira secundária" (desmarcado por padrão); se `form.replacesSecondary`, o texto vira "Substituir a carteira secundária" com o aviso "A carteira secundária atual será substituída." (`role="note"`).
   - Observação: `FormField` `plain` com rótulo "Observação do colecionador (opcional)", `Textarea` controlado por `form.note`/`form.setNote`, `maxLength={500}`, erro `form.noteError`.
3. A seção **não** renderiza botão nem faz envio. Só tokens de cor; `cn`; Radix com `data-[state=…]`; sem `ref` no render.
4. Fechamento: prettier nos 2; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0 (se falhar por arquivo de **outro** agente, esperar e repetir). Commit só dos 2: `git commit -m "11-014: coluna do colecionador e tipos do checkout" -- <arquivos>`.

## Critérios de aceite
- [ ] A 1440 px: passo de 81 px, campos de 40 px, colunas de 369/370 px, `Textarea` de 350 × 152 px (medido no DOM e no recorte).
- [ ] Marcar "Usar outra carteira?" mostra as opções; "Preencher outra carteira" limpa o formulário e mostra "Salvar como carteira secundária".
- [ ] Observação com mais de 500 caracteres não é aceita.
- [ ] Sem cor hexadecimal fora dos tokens; sem `any`, `as` ou `@ts-ignore`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Visual no 11-019.

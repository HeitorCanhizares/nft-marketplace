# 11-007 — Hook do formulário do checkout (colecionador, outra carteira, rascunho)

**Status:** pendente
**Fluxo / subitem:** Pagamento › 2, 3, 4, 10
**Depende de:** 11-004
**Toca:** `src/hooks/useCheckoutForm.ts` (novo)
**Paralelo:** pode rodar com 11-005, 11-006, 11-008, 11-010. Os blocos 11-013, 11-014 e 11-016 esperam este.
**Lote:** G

## Objetivo
Um único dono do estado do formulário do Pagamento, usado pelo desktop (com `WalletForm`) e pelo mobile (sem formulário, só a carteira escolhida): valores, modo da carteira, "Salvar como secundária", observação, provedor e rascunho.

## Arquivos
- criar: `src/hooks/useCheckoutForm.ts`

## Referências
- docs/fluxos/pagamento.md subitens 2, 3, 4 e 10
- `src/pages/Wallets/useWalletSlotForm.ts` (padrão `useForm` + `zodResolver` + `useDeferredEmptyValidation` + `setError` do servidor + `setFocus`), `src/hooks/useDeferredEmptyValidation.ts`, `src/hooks/useDebounce.ts`, `src/schemas/wallet.ts` (`checkoutWalletFormSchema`, `toWalletFormValues`, `copyWalletValues`, `WalletFormValues`), `src/hooks/useWallets.ts` (`useWallets`), `src/contexts/auth.ts` (`useAuth`), 11-004 (`readDraft`, `writeDraft`, `clearDraft`, `toCollector`, `toSecondaryBody`, `CheckoutMode`, `checkoutNoteSchema`)

## Instruções
1. `useCheckoutForm(wallets: WalletsResponse, user: User)` (a página só monta o hook depois de `useWallets` ter dados):
   - `form = useForm<WalletFormValues>({ resolver: deferred(zodResolver(checkoutWalletFormSchema)), mode: 'onTouched', defaultValues })`. Padrão idêntico ao `useWalletSlotForm`: `markSubmitAttempt()` antes de `handleSubmit`.
   - **Valores iniciais:** rascunho de `readDraft(user.id)` se existir **e** o modo ainda for possível (`secondary` exige secundária cadastrada, senão volta a `primary`); sem rascunho: `toWalletFormValues(wallets.primary, user)` (**sem carteira principal, pré-preenche com os dados do perfil**: nome de exibição, e-mail e ENS, como em Carteiras; `user` vem do argumento, que a página lê de `useAuth().user`). O modo `primary` sem principal reaplica `toWalletFormValues(null, user)`.
   - `mode: CheckoutMode`, `useOther = mode !== 'primary'`.
   - `setUseOther(on: boolean)`: ligar → `secondary` se existir, senão `manual`; desligar → `primary`. Reaplica os valores com `form.reset(values)` (`primary`: `toWalletFormValues(primary, user)`; `secondary`: `toWalletFormValues(secondary, null)`; `manual`: `toWalletFormValues(null, null)`), limpa `serverErrors` e `saveAsSecondary`.
   - `setMode(next: CheckoutMode)` (rádio "Carteira secundária" / "Preencher outra carteira" no desktop e cartão escolhido no mobile): mesma reaplicação. Mobile usa só `primary` e `secondary`.
   - `saveAsSecondary` / `setSaveAsSecondary` (só vale em `manual`; fora dele sempre `false`); `replacesSecondary = wallets.secondary !== null` (para o texto "Substituir a carteira secundária").
   - `note` / `setNote` (`useState`, máx. 500; `noteError` vem de `checkoutNoteSchema`).
   - `provider` / `setProvider` (`WalletProvider | null`; inicial do rascunho).
   - `network = parse de form.watch('network')` → `Network | null` (`'' → null`).
   - `serverErrors` / `setServerErrors` (erros da API fora do RHF, como no `useWalletSlotForm`).
2. `collect(): Promise<CheckoutCollected | null>`: `markSubmitAttempt()`, `await form.trigger()`; inválido → `form.setFocus(<primeiro campo com erro>)` (ordem visual: displayName, username, network, profileName, address, provider, referralCode, email, ensLabel) e `null`; nota inválida → `null`. Válido: `{ collector: toCollector(values), values, note: note.trim() || undefined, walletId: <id da carteira salva> só nos modos primary/secondary, saveAsSecondary, secondaryBody: saveAsSecondary ? toSecondaryBody(values) : undefined }`.
3. **Rascunho:** `useWatch({ control })` + `useDebounce(…, 400)` + `useEffect` que chama `writeDraft({ userId, mode, saveAsSecondary, note, provider, values })`. Mais um efeito com **cleanup** que grava `form.getValues()` na desmontagem (a sessão expirada desmonta a página; a última digitação não pode se perder). `discardDraft()`: `clearDraft()` e marca um `useRef` `discarded` (escrito só em callbacks) para que o debounce e o cleanup **não regravem** (usado depois de criar o pedido). Ler esse `ref` só dentro dos efeitos, nunca no render.
4. Devolve `{ form, serverErrors, setServerErrors, mode, setMode, useOther, setUseOther, saveAsSecondary, setSaveAsSecondary, replacesSecondary, note, setNote, noteError, provider, setProvider, network, hasPrimary, hasSecondary, collect, discardDraft }`.
5. Fechamento: prettier; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0 (se falhar por arquivo de **outro** agente, esperar e repetir). Commit: `git commit -m "11-007: hook do formulário do checkout" -- <arquivo>`.

## Critérios de aceite
- [ ] Usuário com principal: formulário vem preenchido com ela; sem principal: pré-preenchido com nome de exibição, e-mail e ENS do perfil.
- [ ] Alternar "Usar outra carteira?" troca os valores; desligar volta aos da principal.
- [ ] `collect()` inválido foca o primeiro campo com erro e devolve `null`; campo obrigatório vazio só acusa no envio (regra `useDeferredEmptyValidation`).
- [ ] Recarregar a página restaura valores, modo, observação e provedor (mesmo usuário); outro usuário não vê o rascunho.
- [ ] Sem `any`, `as` ou `@ts-ignore`; sem `ref` lido no render.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Caminho principal no 11-018; sessão expirada com rascunho e validações no 11-020.

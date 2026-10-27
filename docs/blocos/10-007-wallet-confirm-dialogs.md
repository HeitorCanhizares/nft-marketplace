# 10-007 — Diálogos "Remover carteira secundária" e "Tornar principal"

**Status:** concluído
**Fluxo / subitem:** Carteiras › 4, 5
**Depende de:** 10-003

## Objetivo
Dois diálogos de confirmação que chamam `DELETE /wallets/secondary` e `POST /wallets/swap` e informam o resultado.

## Arquivos
- criar: `src/pages/Wallets/WalletConfirmDialogs.tsx`

## Referências
- Padrão: `src/components/shared/UnsavedChangesGuard.tsx` e `ConfirmPasswordDialog.tsx` (estrutura do `Dialog`, `onOpenAutoFocus`), `AvatarUploader.tsx` ("Remover foto?")
- `useWalletMutations` (10-003: já anuncia e mostra o toast de sucesso)
- `Dialog*`, `Button` (`variant="outline"`, `destructive` se existir no `button.tsx`)

## Instruções
1. Exporta dois componentes controlados, ambos com props `{ open: boolean; onOpenChange: (open: boolean) => void; onDone?: () => void }`:
   - **`RemoveSecondaryDialog`**: título "Remover carteira secundária?", descrição "Ela deixará de aparecer no pagamento. Você pode cadastrar outra depois.", botões "Cancelar" (`outline`, recebe o foco inicial) e "Remover" (`destructive` ou `primary`). "Remover" chama `removeSecondary()`; em sucesso fecha e chama `onDone` (a página leva o foco ao "Adicionar" da secundária).
   - **`SwapWalletsDialog`**: título "Tornar principal?", descrição "A carteira secundária passa a ser a principal e a principal passa a ser a secundária.", botões "Cancelar" e "Tornar principal". Chama `swap()`; em sucesso fecha e chama `onDone`.
2. Em ambos: botão de confirmar com `Loader2Icon` e `aria-busy` enquanto envia, **desabilitado** durante o envio (a trava de clique repetido já vem do hook); em erro o diálogo **continua aberto** com `role="alert"` e "Não foi possível concluir. Tente novamente."; `Esc`/`Cancelar` fecham sem chamar a API; o foco volta ao botão que abriu o diálogo (comportamento padrão do Radix; não sobrescrever).
3. Fechamento: prettier; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `10-007: diálogos de remover e trocar carteiras`.

## Critérios de aceite
- [ ] Confirmar chama a API uma única vez, mesmo com cliques repetidos; cancelar não chama.
- [ ] Erro mantém o diálogo aberto e a tela intacta.
- [ ] Acessibilidade: `DialogTitle` e descrição presentes; foco preso no diálogo e devolvido ao fechar.
- [ ] Sem cor hexadecimal fora dos tokens; sem `any`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Fluxo exercitado pelo spec do 10-010.

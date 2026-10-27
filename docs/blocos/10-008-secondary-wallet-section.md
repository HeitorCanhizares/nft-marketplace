# 10-008 — Seção "Carteira secundária"

**Status:** pendente
**Fluxo / subitem:** Carteiras › 3, 4, 5
**Depende de:** 10-004, 10-005, 10-006, 10-007

## Objetivo
O bloco da secundária: estado vazio do Figma, "Adicionar", "Igual à carteira principal" (copia uma vez), edição, "Remover carteira secundária" e "Tornar principal".

## Arquivos
- criar: `src/pages/Wallets/SecondaryWalletSection.tsx`

## Referências
- Tela: `docs/design/telas/desktop-carteiras.png` (1:1); mobile adaptado
- `WalletForm`, `WalletSaveButton`, `useWalletSlotForm` (10-004 a 10-006), `RemoveSecondaryDialog`/`SwapWalletsDialog` (10-007), `copyWalletValues` (10-001)
- `RadioGroup`/`RadioGroupItem` (`src/components/ui/radio-group.tsx`), `Button`

## Medidas do Figma (desktop, estado vazio)
- Título "Carteira secundária": 16 px bold, `text-foreground`, **≈ 35 px** abaixo do fim do botão "Salvar carteira" (botão termina em 664; glyph do título em 699).
- Texto "Você ainda não adicionou uma carteira secundária.": **14 px**, `tan`, glyph **28 px** abaixo do glyph do título (699 → 727).
- À direita, na linha do título: **rádio de 16 px** (círculo vazio, borda `primary`), **10 px** de espaço, texto "Igual à carteira principal" **14 px**, `foreground`, **10 px** de espaço, link **"Adicionar" 16 px bold `primary`**, encostado na borda direita (x 1320).
- Mobile (adaptado): título e link na mesma linha; abaixo, o texto de apoio; o rádio em linha própria com alvo ≥ 44 px; formulário e botão como no 10-006.

## Instruções
1. Props: `{ wallet: Wallet | null; primary: Wallet | null; slotForm: ReturnType<typeof useWalletSlotForm>; anyDirty: boolean; onSwapDone?: () => void }` (`anyDirty` = principal **ou** secundária com alterações). Estado local: `adding` (boolean), `sameChecked` (boolean), `removeOpen`, `swapOpen`. Nenhum `ref` lido no render.
2. **Estados:**
   - `wallet === null && !adding`: **vazio** (texto de apoio, sem formulário).
   - `adding` ou `wallet !== null`: mostra `<form noValidate>` com `WalletForm variant="wallets"` e `WalletSaveButton` (como o 10-006, `disabled={!slotForm.isDirty}`), mais a mensagem `slotForm.message`.
3. **Link da linha do título:** sem secundária → "Adicionar" (`type="button"`): `setAdding(true)` e, depois de renderizar, `slotForm.focusFirst()` (via `useEffect` que reage a `adding`, sem ref). Com secundária → "Editar" (só foca o primeiro campo).
4. **"Igual à carteira principal"** (só enquanto não há secundária salva): `RadioGroup` com um item; ao escolher, **copia uma única vez**: `slotForm.applyValues(copyWalletValues(primary))`, `setAdding(true)`, `sameChecked = true`, foco no primeiro campo. Depois disso o rádio fica marcado como indicador e **não** copia de novo nem acompanha a principal. Sem `primary` salva: rádio **desabilitado** e texto visível (`text-xs`, `tan`) "Cadastre a carteira principal primeiro." ligado por `aria-describedby`. Copia os dados **salvos** da principal (não os não salvos).
5. **Ações com secundária salva** (abaixo do botão "Salvar carteira", em linha, desktop e mobile em coluna se faltar espaço): botão **"Remover carteira secundária"** (`outline`, abre `RemoveSecondaryDialog`) e botão **"Tornar principal"** (`outline`, abre `SwapWalletsDialog`; **desabilitado enquanto `anyDirty`**, com texto visível `text-xs` "Salve ou descarte as alterações para trocar." ligado por `aria-describedby`). Após remover: `setAdding(false)`, `sameChecked = false` e o foco vai ao link "Adicionar" (`onDone` do diálogo + `useEffect`). Após trocar: `onSwapDone`.
6. **Sincronização:** quando `wallet` passar de `null` para salvo (salvar) → `adding = false`; de salvo para `null` (remover) → volta ao vazio.
7. Fechamento: prettier; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `10-008: seção da carteira secundária`.

## Critérios de aceite
- [ ] Vazio: texto, rádio "Igual à carteira principal" e "Adicionar", como no Figma.
- [ ] "Adicionar" abre o formulário (pré-preenchido do perfil) e foca o primeiro campo; "Igual à carteira principal" abre o formulário com os dados da principal copiados uma vez.
- [ ] Sem principal salva: rádio desabilitado com o motivo visível.
- [ ] Remover: confirmação, volta ao vazio, foco em "Adicionar". Tornar principal: confirmação, as duas trocam, desabilitado com alterações não salvas.
- [ ] Acessibilidade: `h2` ligado à seção; rádio com nome; motivos por `aria-describedby`; alvos ≥ 44 px no mobile; sem overflow em 320 px.
- [ ] Sem cor hexadecimal fora dos tokens; sem `ref` lido no render.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Fluxo exercitado pelo spec do 10-010.

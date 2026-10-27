# 10-006 — Seção "Carteira principal" e botão "Salvar carteira"

**Status:** pendente
**Fluxo / subitem:** Carteiras › 2, 6
**Depende de:** 10-004, 10-005

## Objetivo
O bloco da carteira principal como no Figma: título, texto de apoio, link "Adicionar"/"Editar", `WalletForm` sempre visível e "Salvar carteira".

## Arquivos
- criar: `src/pages/Wallets/WalletSaveButton.tsx`
- criar: `src/pages/Wallets/PrimaryWalletSection.tsx`

## Referências
- Tela: `docs/design/telas/desktop-carteiras.png` (1:1); mobile adaptado
- Padrão: `src/pages/Profile/ProfileDataSection.tsx` (título `h2`, `aria-labelledby`), botão "Salvar" de `src/pages/Profile/ProfileForm.tsx` (`Loader2Icon`, `aria-busy`, movimento reduzido), `AUTH_SUBMIT_CLASS`
- `WalletForm` (10-004), retorno de `useWalletSlotForm` (10-005)

## Medidas do Figma (desktop; glyphs lidos na captura)
- Coluna de 862 px. Título "Carteira principal": **16 px, bold**, `text-foreground`, `leading-none`, topo alinhado ao topo do menu lateral (y 101). Link **"Adicionar"/"Editar"** à direita na mesma linha: **16 px, bold, `primary`**, borda direita em x 1320.
- Texto de apoio "Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.": **14 px**, `tan`, **24 px** abaixo do topo do título (glyphs 103 → 127).
- Primeiro rótulo a **≈ 40 px** abaixo do fim do texto de apoio (glyph do texto termina em 139; glyph do rótulo começa em 179); ajustar ao pixel na verificação.
- **"Salvar carteira": 131 × 40 px**, `primary`, texto 14 px bold, alinhado à esquerda, **32 px** abaixo do último campo (campo termina em 593, botão começa em 625).
- Mobile (adaptado): título e link na mesma linha, texto de apoio abaixo, formulário em uma coluna; botão **60 px** `rounded-4xl` largura total (`AUTH_SUBMIT_CLASS`), 32 px acima; margens de 28 px vêm da página.

## Instruções
1. **`WalletSaveButton`** — props `{ isSaving: boolean; disabled: boolean }`; `type="submit"`, texto "Salvar carteira", `Loader2Icon` girando quando salvando (movimento reduzido: sem giro), `aria-busy`, `disabled` quando `disabled || isSaving`. Classes: `h-10 w-[131px] text-sm font-bold` no desktop; `AUTH_SUBMIT_CLASS` no mobile (`max-lg:`). Largura do texto "Salvar carteira" cabe nos 131 px; sem quebra.
2. **`PrimaryWalletSection`** — props `{ wallet: Wallet | null; slotForm: ReturnType<typeof useWalletSlotForm> }`. `<section aria-labelledby>` com `h2` "Carteira principal" (id via `useId`).
   - Link: `wallet === null` → "Adicionar"; senão "Editar". É um `button type="button"` (estilo de link, `text-base font-bold text-primary`, foco visível) que chama `slotForm.focusFirst()`. Não abre nada: o formulário **sempre** está visível.
   - Mensagem de erro de rede/5xx (`slotForm.message`) acima do formulário, `role="alert"`, estilo dos erros do Perfil.
   - `<form noValidate onSubmit={slotForm.submit}>` com `WalletForm variant="wallets"` (`form`, `serverErrors`) e, **32 px abaixo**, `WalletSaveButton` (`disabled={!slotForm.isDirty}`).
3. Fechamento: prettier nos 2; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `10-006: seção da carteira principal`.

## Critérios de aceite
- [ ] Sem principal: link "Adicionar", formulário pré-preenchido com os dados do perfil; com principal: link "Editar", formulário preenchido.
- [ ] "Adicionar"/"Editar" leva o foco ao primeiro campo.
- [ ] "Salvar carteira" desabilitado sem alterações e durante o envio, com `aria-busy`.
- [ ] Acessibilidade: `h2` ligado à seção; erros anunciados; foco no primeiro campo com erro; sem overflow em 320 px.
- [ ] Sem cor hexadecimal fora dos tokens; sem `ref` lido no render.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Visual no 10-010 / 10-011.

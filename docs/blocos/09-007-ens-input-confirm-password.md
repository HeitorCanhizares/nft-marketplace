# 09-007 — `EnsInput` e `ConfirmPasswordDialog`

**Status:** concluído
**Fluxo / subitem:** Perfil › 2 (Nome ENS), 3 (troca de e-mail)
**Depende de:** 09-001

## Objetivo
O campo de ENS (sufixo + nome) e o diálogo que pede a senha atual ao trocar o e-mail.

## Arquivos
- criar: `src/components/shared/EnsInput.tsx`
- criar: `src/components/shared/ConfirmPasswordDialog.tsx`

## Referências
- Tela: `docs/design/telas/desktop-perfil.png` (1:1; medidas abaixo lidas nela)
- docs/design/componentes.md (`EnsInput`, `ConfirmPasswordDialog`); docs/fluxos/perfil.md (subitem 3)
- `src/components/ui/select.tsx`, `input.tsx`, `dialog.tsx`, `button.tsx`; `FormField` (`FieldProps`), `PasswordInput`, `authStyles.ts` (`AUTH_INPUT_CLASS`); `useDeferredEmptyValidation`; `passwordSchema` **não** (aqui só "obrigatório")

## Instruções
1. **`EnsInput`** — props: `{ value: string; onChange(value: string): void; onBlur?: () => void; suffix?: string; field: FieldProps; disabled?: boolean; name?: string }` (`field` leva `id`, `aria-describedby`, `aria-invalid`, `aria-required`, aplicados ao **campo de nome**; `suffix` padrão `ENS_SUFFIX`).
   - Medidas do Figma (desktop): linha de 40 px de altura; `Select` à esquerda com **78 px** de largura mostrando ".eth" (texto 14 px) e a seta; **10 px** de espaço; campo de nome ocupando o resto (**329 px** na coluna de 417 px). Mobile (adaptado): select 84 px, altura 50 px, `rounded-3xl` como os demais campos do mobile, mesmo espaço de 10 px.
   - O `Select` tem uma única opção (o sufixo) e `aria-label="Sufixo ENS"`; é controlado pela prop `suffix`. O campo de nome usa `AUTH_INPUT_CLASS`, `autoCapitalize="none"`, `autoComplete="off"`, `spellCheck={false}`; `onChange` entrega o texto como digitado.
2. **`ConfirmPasswordDialog`** — props: `{ open: boolean; onOpenChange(open: boolean): void; onConfirm(password: string): void; submitting: boolean; error?: string }`.
   - `Dialog` com título "Confirme sua senha", descrição "Para alterar o e-mail, informe sua senha atual.", um `FormField` "Senha atual" (obrigatório) com `PasswordInput` (`autoComplete="current-password"`), foco inicial no campo, botões "Confirmar" (estado de carregamento com `Loader2Icon`, `aria-busy`) e "Cancelar".
   - Formulário próprio com react-hook-form + `useDeferredEmptyValidation` (vazio só acusa ao enviar: "Informe sua senha atual."). Enter envia. `submitting` bloqueia o segundo envio e os botões. `error` (vindo da API, ex.: "Senha atual incorreta.") aparece no campo e devolve o foco a ele.
   - Ao fechar (`onOpenChange(false)`), o campo é limpo. Estados Radix com `data-[state=…]` já vêm do `dialog.tsx`.
3. Fechamento: prettier nos 2; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `09-007: EnsInput e ConfirmPasswordDialog`.

## Critérios de aceite
- [ ] Select e campo de ENS alinhados e nas medidas acima; sem cor hexadecimal fora dos tokens; `cn` com tokens.
- [ ] Acessibilidade: select com nome; diálogo com título e descrição associados; foco preso no diálogo e devolvido ao fechar; erro com `role="alert"`; alvos ≥ 44 px no mobile.
- [ ] Nenhum `ref` lido no render.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Visual no 09-014 (uma captura por tela).

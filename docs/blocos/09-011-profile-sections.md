# 09-011 — Seções do formulário: dados e senha

**Status:** concluído
**Fluxo / subitem:** Perfil › 2 (dados), 5 (senha), 9 (erros por campo)
**Depende de:** 09-007, 09-008

## Objetivo
As duas seções visuais do formulário ("Perfil do colecionador" e "Alterar senha"), presentacionais, ligadas ao mesmo `useForm`.

## Arquivos
- criar: `src/pages/Profile/ProfileDataSection.tsx`
- criar: `src/pages/Profile/PasswordSection.tsx`

## Referências
- Tela: `docs/design/telas/desktop-perfil.png` (1:1; medidas abaixo). Mobile adaptado de `docs/design/telas/mobile-cadastro.png` (margem 28 px, campos de 50 px de altura, `rounded-3xl`, espaço de 12 px entre campos)
- docs/fluxos/perfil.md (subitens 2, 3, 5, 9)
- `FormField`, `PasswordInput`, `PasswordRequirements`, `EnsInput` (09-007), `AvatarUploader` (09-008), `useAvailability` (`src/hooks/useAvailability.ts`), `authStyles.ts` (`AUTH_INPUT_CLASS`), `ProfileFormValues` (09-001)
- **Padrão de disponibilidade e erros:** `src/components/shared/SignupForm.tsx` (`syncAvailability`, mensagens `TAKEN_MESSAGE`, erros do servidor fora do react-hook-form)

## Medidas do Figma (desktop, 1440 px; coluna de conteúdo a partir de x = 458 px, 862 px de largura)
- **Duas colunas de 417 px, espaço de 28 px entre elas.** Esquerda: Nome de exibição, E-mail, Apelido da carteira. Direita: Nome de usuário, Nome ENS, Avatar. Ordem do DOM (e do Tab): Nome de exibição, Nome de usuário, E-mail, Nome ENS, Apelido da carteira, Avatar.
- Título "Perfil do colecionador": 16 px, bold; centro a 8 px do topo da coluna. Primeiro rótulo: centro a 62 px do topo.
- Rótulos: 15 px; asterisco `required` colado ao texto. Campo: **40 px** de altura, borda de 1 px `border`, fundo transparente, texto 14 px (`AUTH_INPUT_CLASS`).
- **Grupo de dados:** rótulo (linha de 20 px) → campo: **15 px**; campo → próximo rótulo: **28 px** (passo de 103 px entre campos).
- Bloco Avatar: rótulo 7 px acima do rótulo do Apelido (conferir no Figma; a linha do Apelido está em y = 369, a do Avatar em y = 362).
- Título "Alterar senha": 16 px, bold; centro a **40 px** abaixo da base do campo do Apelido. **Grupo de senha:** 1º rótulo com centro a 39 px do centro do título; rótulo → campo: **10 px**; campo → próximo rótulo: **21 px** (passo de 91 px). Campos de senha na **coluna esquerda (417 px)**, olho do `PasswordInput` a ~27 px da borda direita.
- Mobile: uma coluna, rótulos visíveis acima dos campos (14 px, bold, 8 px de espaço), campos de 50 px com 16 px entre eles, 32 px entre as seções.

## Instruções
1. **`ProfileDataSection`** — props:
   ```ts
   type ProfileDataSectionProps = {
     form: UseFormReturn<ProfileFormValues>
     currentUser: { username: string; email: string }
     usernameAvailability: ReturnType<typeof useAvailability>
     emailAvailability: ReturnType<typeof useAvailability>
     serverErrors: Partial<Record<'displayName' | 'username' | 'email' | 'ensLabel' | 'walletNickname', string>>
     formMessage: string | null
     avatarSlot: ReactNode
   }
   ```
   - Seção `<section aria-labelledby>` com `h2` "Perfil do colecionador". Campos com `FormField` + `Input`/`EnsInput` registrados no `form` (`register`, `Controller` para o ENS). **Obrigatórios com asterisco:** Nome de exibição, Nome de usuário, E-mail. **Opcionais, sem asterisco** (decisão do usuário; o Figma mostrava asterisco): Nome ENS (rótulo "Nome ENS") e Apelido da carteira. `autoComplete`: `nickname` no nome de exibição, `username`, `email`, `off` nos demais.
   - Disponibilidade ao sair do campo (`onBlur`): se o valor (sem espaços, sem diferenciar maiúsculas) é igual ao `currentUser` → `cancel()`; senão `check(valor)`. `status === 'taken'` vira erro do campo (mesmas mensagens do cadastro: "Este nome de usuário já está em uso" / "Este e-mail já está cadastrado") com a sincronização do `SignupForm`. `serverErrors` mostram o erro do servidor (campo `ensLabel` recebe o erro de `ensName`).
   - `formMessage` (rede/5xx): `<p role="alert">` com ícone, acima do botão do formulário **dentro da seção**.
   - `avatarSlot` renderizado na posição do Avatar (coluna direita, 3ª linha).
2. **`PasswordSection`** — props: `{ form; serverErrors: Partial<Record<'currentPassword' | 'newPassword', string>>; formMessage: string | null }`.
   - `h2` "Alterar senha". Campos: "Senha atual" (`autoComplete="current-password"`), "Nova senha" (`new-password`) e "Confirmar nova senha" (`new-password`), todos `PasswordInput`, **sem asterisco** (são obrigatórios só se algum for preenchido). `PasswordRequirements` abaixo de "Nova senha", **só depois que o campo tiver valor ou foco** (vazio, o layout é o do Figma), ligado por `aria-describedby`.
   - `serverErrors.currentPassword` no campo "Senha atual" (o foco é movido pelo 09-012); `formMessage` como na outra seção.
3. Campos com `lg:` para as medidas do Figma e classes `max-lg:` para o mobile; `cn` com tokens; nenhuma cor hexadecimal.
4. Fechamento: prettier nos 2; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `09-011: seções de dados e senha do perfil`.

## Critérios de aceite
- [ ] Posições e tamanhos do Figma no desktop (±2 px); ENS e Apelido sem asterisco.
- [ ] Erros por campo com `role="alert"` ligado por `aria-describedby`; requisitos da senha sem anúncio a cada tecla.
- [ ] Acessibilidade: rótulos associados, `autoComplete` correto, alvos ≥ 44 px no mobile, sem overflow em 320 px.
- [ ] Sem `ref` no render; Radix com `data-[state=…]`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Visual no 09-014.

# 05-024 — SignupForm

**Status:** concluído
**Fluxo / subitem:** Cadastro › 2, 3, 4 e 6 (formulário, requisitos da senha, disponibilidade, conflito, erros)
**Depende de:** 05-001, 05-013, 05-014, 05-015, 05-023
**Depende de decisão:** perguntas 6, 18 e 19 do relatório da fase 05

## Objetivo
Criar o formulário de cadastro: quatro campos com label só para leitor de tela, requisitos da senha visíveis, checagem de disponibilidade ao sair do campo, e tratamento dos conflitos e erros do servidor.

## Arquivos
- criar: `src/components/shared/SignupForm.tsx`

## Referências
- docs/fluxos/cadastro.md (subitens 2, 3, 4 e 6) e docs/api-mock/contratos.md (`409 EMAIL_TAKEN` / `USERNAME_TAKEN` com `fields`; `422` com `fields`)
- `src/schemas/auth.ts`, `src/components/shared/FormField.tsx`, `PasswordInput.tsx`, `PasswordRequirements.tsx`, `src/hooks/useAvailability.ts`, `authStyles.ts`
- Capturas (1:1): desktop-cadastro.png (campos em `y` 322–361, 374–413, 426–465, 478–517; botão 542–586) e mobile-cadastro.png (campos 312–361, 374–423, 436–485, 498–547; botão 588–647)

## Medidas lidas nas capturas
| Elemento | Desktop | Mobile |
|---|---|---|
| Campos | 340 × 40 px, 12 px entre eles; placeholders "Nome de usuário", "Digite seu e-mail", "Senha", "Confirmar senha" (tan, 14 px) | 358 × 50 px, 12 px entre eles; o Figma **centraliza** o placeholder de "Nome de usuário" (os outros ficam à esquerda): corrigido para a esquerda nos quatro (pergunta 19) |
| Olho | nos dois campos de senha | idem |
| Botão | "Criar conta", 24 px abaixo do último campo (`mt-6`), 45 px | "Criar perfil", 40 px abaixo (`max-lg:mt-10`), 60 px, sem gradiente |
| Requisitos da senha | **não desenhados**: logo abaixo do campo de senha, 8 px (`mt-2`); empurram o resto para baixo (`PasswordRequirements`, 05-015) | idem |
| Indicador "verificando" | **não desenhado**: ícone `Loader2Icon` de 16 px girando (`animate-spin`, `text-tan`), dentro do campo, à direita (`adornment` do `FormField`) | idem |

## Instruções
1. Props: `variant: 'desktop' | 'mobile'` (rótulo do botão: "Criar conta" / "Criar perfil"), `onSubmit: (values: SignupFormValues) => Promise<void>` (**lança `ApiError`**), `redirect?: string` (para o link "Entrar com este e-mail"), `className?`.
2. `useForm<SignupFormValues>` com `zodResolver(signupFormSchema)`, `mode: 'onTouched'`. `form noValidate`.
3. Campos em `FormField` com `hideLabel`: **"Nome de usuário"** (`autoComplete="username"`; **sem** `maxLength`: quem avisa do limite é o zod), **"E-mail"** (`type="email"`, `autoComplete="email"`), **"Senha"** (`PasswordInput`, `autoComplete="new-password"`, com `PasswordRequirements value={watch('password')}` como `description`) e **"Confirmar senha"** (`PasswordInput`, `autoComplete="new-password"`). Todos `required` e com `AUTH_INPUT_CLASS`.
4. **Disponibilidade:** dois `useAvailability` (`username` e `email`). No `onBlur` de cada campo, **depois** da validação do zod passar, `check(valor)`; ao digitar, `cancel()`. Efeito: `'taken'` → `setError(campo, { type: 'availability', message })` com **"Este nome de usuário já está em uso"** / **"Este e-mail já está cadastrado"**; `'available'` ou `'idle'` limpam só um erro do tipo `availability`; `'checking'` mostra o indicador e põe `aria-busy` no campo; `'unknown'` não faz nada.
5. Botão e envio como no `LoginForm`: `Button` variante `default`, `AUTH_SUBMIT_CLASS`, "Criando conta…" com `aria-busy`, `aria-disabled` durante o envio, duplo envio ignorado.
6. Erros do envio (`isApiError`):
   - `EMAIL_TAKEN` / `USERNAME_TAKEN`: `setError` nas chaves de `error.fields` (`email`, `username`); sem `fields`, usa o código; foco no primeiro campo com erro. Com e-mail em uso, abaixo do erro um link **"Entrar com este e-mail"** (`Link to="/entrar"`, `search={{ redirect }}`, `state={{ email }}`): o e-mail vai pelo **estado de navegação**, nunca pela URL;
   - `VALIDATION_ERROR`: `setError` nas chaves conhecidas (`username`, `email`, `password`); se nenhuma é conhecida, mensagem de formulário "Revise os dados informados.";
   - `NETWORK_ERROR`, `TIMEOUT` ou `status >= 500`: mensagem de formulário no topo "Não foi possível criar a conta agora. Verifique sua conexão e tente novamente." + "Tentar novamente" (reenvia); **todos os campos, as senhas inclusive, ficam preenchidos**;
   - outro: a `message` do erro.
   A mensagem de formulário tem o mesmo estilo do `LoginForm` (05-022, item 7).
7. Fechamento: `npx prettier --write src/components/shared/SignupForm.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/shared/SignupForm.tsx` e `git commit -m "05-024: SignupForm"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; export nomeado `SignupForm`; não importa Axios nem `services/api` (o hook faz).
- [ ] Regras: usuário 3–20 em ASCII (sem acento), números, `_` e `.`; senha 8+ com letra (qualquer letra Unicode) e número; confirmação igual.
- [ ] Requisitos da senha mudam ao digitar, sem anúncio por tecla; a descrição do campo os inclui.
- [ ] Sair do campo com valor já em uso mostra o erro; resposta de valor antigo não aparece; falha da consulta não impede enviar.
- [ ] 409 coloca o erro no campo certo, com foco; o link "Entrar com este e-mail" não põe o e-mail na URL.
- [ ] Falha de rede preserva todos os campos.
- [ ] Sem cor hexadecimal, `oklch()` ou `rgb()`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Probe **não commitado** com `onSubmit` de teste e `useAvailability` real contra o mock; capturas ao lado de `desktop-cadastro.png` e `mobile-cadastro.png` (campos e botão; os requisitos da senha e o indicador não existem no Figma). Coberto no 05-044.

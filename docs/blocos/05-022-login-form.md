# 05-022 — LoginForm

**Status:** pendente
**Fluxo / subitem:** Login › 2 e 3 (formulário, validação, erros, bloqueio)
**Depende de:** 04-016, 05-001, 05-013, 05-014, 05-016
**Depende de decisão:** perguntas 6, 18 e 21 do relatório da fase 05

## Objetivo
Criar o formulário de login: campos com label só para leitor de tela, validação com zod, envio com carregamento, e os erros de credencial, bloqueio por tentativas e rede.

## Arquivos
- criar: `src/components/shared/LoginForm.tsx`

## Referências
- docs/fluxos/login.md (subitens 2 e 3) e docs/qualidade/acessibilidade.md (erros ligados por `aria-describedby`, foco no primeiro erro, `aria-busy` no envio)
- `src/schemas/auth.ts` (`loginFormSchema`, `LoginFormValues`), `src/components/shared/FormField.tsx`, `PasswordInput.tsx`, `RetryCountdown.tsx`, `ComingSoon.tsx`, `src/components/shared/authStyles.ts`
- `src/services/http/ApiError.ts` (`isApiError`; é o único import de `services` permitido num componente `shared`)
- Capturas (1:1): desktop-login.png, mobile-login.png

## Medidas lidas nas capturas
| Elemento | Desktop | Mobile |
|---|---|---|
| E-mail | placeholder "contato@email.com" (tan, 14 px), 40 px | idem, 50 px |
| Senha | 40 px, com o olho; placeholder proposto "Senha" (o Figma mostra a senha já digitada com a borda em foco) | 50 px |
| "Esqueceu a senha?" | à direita, alinhado à borda direita do campo, 14 px (`text-sm`), cor **`price`** (`#e89b55`), altura de linha 20 px, 8 px abaixo do campo (`mt-2`); `ComingSoon` (cor cheia) | idem |
| Botão "Entrar" | 24 px abaixo do "Esqueceu" (`mt-6`), 45 px (`AUTH_SUBMIT_CLASS`) | 40 px abaixo (`max-lg:mt-10`), 60 px, sem gradiente |

## Instruções
1. Props: `variant: 'desktop' | 'mobile'` (só escolhe espaçamentos; as classes `max-lg:` já cuidam do resto), `onSubmit: (values: LoginFormValues) => Promise<void>` (**lança `ApiError`** em falha; quem usa liga o `signIn`), `defaultEmail?: string`, `className?`.
2. `useForm<LoginFormValues>` com `zodResolver(loginFormSchema)`, `mode: 'onTouched'`, `defaultValues: { email: defaultEmail ?? '', password: '' }`. `form noValidate`.
3. Campos dentro de `FormField` com `hideLabel`: **"E-mail"** (`Input`, `type="email"`, `inputMode="email"`, `autoComplete="email"`, `AUTH_INPUT_CLASS`, `placeholder="contato@email.com"`) e **"Senha"** (`PasswordInput`, `autoComplete="current-password"`, `placeholder="Senha"`), `required`. Espaço de 12 px entre eles (`gap-3`).
4. "Esqueceu a senha?": `ComingSoon` (`self-end`, `mt-2`, `text-sm leading-5 text-price`).
5. Botão `Button` (variante `default`, **não** `gradient`) com `AUTH_SUBMIT_CLASS`, `type="submit"`, texto "Entrar" (carregando: "Entrando…" com `aria-busy`). Durante o envio ou a contagem do bloqueio usa `aria-disabled="true"` e **ignora** o submit (não `disabled`, para não perder o foco) — bloqueia duplo envio.
6. Envio: `await onSubmit(values)` num `try/catch`; erro tratado por `isApiError`:
   - `INVALID_CREDENTIALS`: mensagem de formulário **"E-mail ou senha incorretos"** (sem dizer qual campo), `resetField('password')` e foco na senha; o e-mail é mantido;
   - `TOO_MANY_ATTEMPTS`: lê `details.retryAfterSeconds` (padrão 30), mostra o `RetryCountdown` (com `key` novo a cada bloqueio), deixa o botão `aria-disabled` até o `onFinish`, limpa a senha;
   - `NETWORK_ERROR`, `TIMEOUT` ou `status >= 500`: mensagem "Não foi possível entrar agora. Verifique sua conexão e tente novamente." e botão de link **"Tentar novamente"** que reenvia os mesmos valores; o formulário (inclusive a senha) é preservado;
   - `VALIDATION_ERROR` com `fields`: `setError` nas chaves `email` e `password`; sem chave conhecida, mensagem "Revise os dados informados.";
   - qualquer outro: a `message` do erro.
7. Mensagem de formulário: bloco no **topo** do formulário (acima dos campos), `role="alert"`, `flex items-start gap-2 text-sm text-destructive`, `CircleAlertIcon` de 16 px `aria-hidden`, `mb-4`. Some ao digitar de novo ou ao reenviar.
8. Fechamento: `npx prettier --write src/components/shared/LoginForm.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/shared/LoginForm.tsx` e `git commit -m "05-022: LoginForm"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; export nomeado `LoginForm`; não importa Axios nem `services/api`.
- [ ] `getByLabel('E-mail')` e `getByLabel('Senha')` funcionam; os labels não aparecem na tela.
- [ ] Validação ao sair do campo e no envio; foco no primeiro campo com erro; erros ligados por `aria-describedby`.
- [ ] Duplo clique em "Entrar" envia **uma** requisição.
- [ ] Credenciais erradas: mensagem sem apontar o campo, e-mail mantido, senha limpa e com foco.
- [ ] Bloqueio: contagem visível, botão `aria-disabled`, volta ao normal no fim.
- [ ] Falha de rede: mensagem + "Tentar novamente"; nenhum campo perdido.
- [ ] Sem cor hexadecimal, `oklch()` ou `rgb()`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Probe **não commitado** com um `onSubmit` de teste que lança cada tipo de `ApiError`; capturas ao lado de `desktop-login.png` e `mobile-login.png` (campos 40/50 px, botão 45/60 px, "Esqueceu" em `price`). Coberto no 05-043.

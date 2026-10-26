# 05-001 — Schemas de autenticação

**Status:** concluído
**Fluxo / subitem:** Login › 2 e Cadastro › Regras de validação
**Depende de:** 03-002, 03-005

## Objetivo
Criar os schemas zod dos corpos de `login`, `register` e `availability` e dos formulários de Login e Cadastro, para o app e o mock validarem exatamente as mesmas regras.

## Arquivos
- criar: `src/schemas/auth.ts`

## Referências
- docs/fluxos/cadastro.md (Regras de validação) e docs/fluxos/login.md (subitem 2)
- docs/api-mock/contratos.md (Sessão e conta) e docs/arquitetura/estado.md (Formulários: um schema por formulário, mensagens em PT-BR no schema)
- `src/schemas/common.ts` (`emailSchema`, `usernameSchema`, `passwordSchema` já existem e **não** mudam)

## Instruções
1. `loginBodySchema = z.object({ email: emailSchema, password })`, com `password` = string obrigatória (`min(1)`, mensagem "Informe sua senha."). **Não** aplicar a regra de composição da senha no login (só `required`).
2. `registerBodySchema = z.object({ username: usernameSchema, email: emailSchema, password: passwordSchema })`.
3. `availabilityBodySchema`: `z.union` de dois objetos **estritos**: `{ email: emailSchema }` ou `{ username: usernameSchema }`.
4. `loginFormSchema = loginBodySchema`.
5. `signupFormSchema = registerBodySchema.extend({ confirmPassword })` com `confirmPassword` obrigatório (mensagem "Confirme sua senha.") e a verificação de igualdade com `password`, erro em `path: ['confirmPassword']`, mensagem "As senhas não coincidem.". **Conferir** que o erro de `confirmPassword` aparece mesmo quando outro campo (ex.: `username`) está inválido; se o `refine` não rodar nesse caso, trocar por `.check()` do zod 4.
6. Tipos exportados: `LoginFormValues` e `SignupFormValues` (`z.input<…>`), `LoginBody`, `RegisterBody` (`z.output<…>`).
7. `PASSWORD_RULES`: lista `readonly` com `{ id: 'length' | 'letter' | 'number', label, test(value: string): boolean }` — rótulos "8+ caracteres", "letra" e "número"; testes: `value.length >= 8`, `/\p{L}/u` e `/\d/`. É a fonte do `PasswordRequirements` (05-015) e tem de concordar com o `passwordSchema`.
8. Fechamento: `npx prettier --write src/schemas/auth.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/schemas/auth.ts` e `git commit -m "05-001: schemas de autenticação"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; mensagens em PT-BR; nomes em inglês.
- [ ] Usuário `açúcar` e `com espaço` inválidos; `Heito_1.x` válido. Senha `Açaí1234` válida; `semnumero`, `12345678` e `curta1` inválidas.
- [ ] `availabilityBodySchema` rejeita `{}`, `{ email, username }` e `{ email: 'x' }`.
- [ ] Senhas diferentes + `username` inválido → o erro de `confirmPassword` existe.
- [ ] `src/schemas/common.ts` não foi alterado.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Casos acima exercitados em `page.evaluate` pela ponte (`window.__kurio.schemas`, ampliada no 05-042) e usados pelos handlers (05-008 a 05-010).

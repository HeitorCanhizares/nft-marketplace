# 05-013 — FormField e estilos dos campos de autenticação

**Status:** pendente
**Fluxo / subitem:** Login › 2 e Cadastro › 2 (labels só para leitor de tela, erros ligados por `aria-describedby`)
**Depende de:** 01-005
**Depende de decisão:** pergunta 18 do relatório da fase 05 (erro de campo com ícone: não desenhado)

## Objetivo
Criar o `FormField` (label, campo, descrição e erro ligados por `aria-describedby`, integrado ao react-hook-form) e as classes compartilhadas dos campos e do botão de envio das telas de autenticação.

## Arquivos
- criar: `src/components/shared/FormField.tsx`, `src/components/shared/authStyles.ts`

## Referências
- docs/design/componentes.md (`FormField`: label, asterisco de obrigatório, campo, mensagem de erro ligada por `aria-describedby`) e docs/qualidade/acessibilidade.md (Semântica, labels e erros: `aria-invalid`, `aria-describedby`, `required`/`aria-required`, erro com cor + ícone + texto; no Login e no Cadastro o label é **apenas para leitor de tela**)
- `src/components/ui/label.tsx`, `src/components/ui/input.tsx`
- Capturas (1:1): desktop-login.png e mobile-login.png

## Medidas lidas nas capturas
| Elemento | Desktop (modal, 1440) | Mobile (414) |
|---|---|---|
| Campo | 340 × 40 px, borda 1 px `border` (`#3f2319`), fundo **transparente** (o do modal/página), raio ≈ 4 px (`lg`) | 358 × 50 px, borda 1 px `border`, fundo transparente, raio ≈ 9 px (`max-lg:rounded-3xl` = 8,8 px) |
| Texto digitado e placeholder | 14 px (`text-sm`); texto em `foreground`; placeholder em `tan` (`#b39463`); recuo à esquerda de 16 px (`px-4`) | idem |
| Espaço entre campos | 12 px | 12 px |
| Botão de envio | 340 × 45 px, raio ≈ 4 px, texto 16 px bold `primary-foreground` sobre `primary` **liso** | 358 × 60 px, raio ≈ 10 px (`max-lg:rounded-4xl` = 10,4 px), **sem gradiente** (cor igual em toda a largura) |

O primitivo `Input` usa `text-base` e `placeholder:text-muted-foreground`; as classes abaixo os sobrescrevem **só nas telas de autenticação**. O anel de foco do primitivo permanece (a captura mostra só a borda `primary`; o anel é exigência de acessibilidade).

## Instruções
1. `authStyles.ts` (sem JSX): `export const AUTH_INPUT_CLASS = 'bg-transparent px-4 text-sm placeholder:text-tan max-lg:rounded-3xl'` e `export const AUTH_SUBMIT_CLASS = 'h-11.25 w-full text-base max-lg:h-15 max-lg:rounded-4xl'`.
2. `FormField` — props: `label: string`, `hideLabel?: boolean`, `required?: boolean`, `error?: ReactNode`, `description?: ReactNode`, `adornment?: ReactNode`, `className?`, `children: (field: FieldProps) => ReactNode`, onde `FieldProps = { id: string; 'aria-describedby'?: string; 'aria-invalid'?: true; 'aria-required'?: true }`. Gera os ids com `useId`.
3. Estrutura: `div.flex.flex-col` → `Label` (primitivo, `htmlFor`; com `hideLabel` usa `sr-only`; com `required` e label visível, asterisco `aria-hidden` + `sr-only` "(obrigatório)") → `div.relative` com `children(fieldProps)` e o `adornment` (posicionado `absolute inset-y-0 right-4 flex items-center`) → `description` (wrapper com o id de descrição) → `error` (wrapper com o id de erro, `role="alert"`, `mt-1 flex items-start gap-1.5 text-caption text-destructive`, ícone `CircleAlertIcon` do lucide de 14 px `aria-hidden`).
4. `aria-describedby` = ids de descrição e de erro presentes (nessa ordem), ou ausente; `aria-invalid` só com erro; `aria-required` só com `required`.
5. Sem lógica de formulário dentro (quem liga o react-hook-form é o `LoginForm` / `SignupForm`).
6. Fechamento: `npx prettier --write` nos 2 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/shared/FormField.tsx src/components/shared/authStyles.ts` e `git commit -m "05-013: FormField e estilos de autenticação"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; export nomeado `FormField`.
- [ ] `getByLabel('E-mail')` encontra o campo com o label `sr-only` (sem ocupar espaço visível).
- [ ] Com erro: `aria-invalid="true"`, `aria-describedby` aponta para o texto do erro, e o erro tem ícone + texto + cor.
- [ ] Sem cor hexadecimal, `oklch()` ou `rgb()`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Probe **não commitado** com campo normal, com erro e com descrição; leitor de acessibilidade por `getByLabel`. Coberto nos testes 05-043, 05-044 e 05-047.

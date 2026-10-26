# 05-014 — PasswordInput

**Status:** pendente
**Fluxo / subitem:** Login › 2 e Cadastro › 2 (botão olho)
**Depende de:** 01-005, 05-013
**Depende de decisão:** pergunta 7 do relatório da fase 05 (cor do olho no mobile)

## Objetivo
Criar o campo de senha com o botão olho que mostra e oculta o texto.

## Arquivos
- criar: `src/components/shared/PasswordInput.tsx`

## Referências
- docs/fluxos/login.md (subitem 2: botão olho com `aria-label` "Mostrar senha" / "Ocultar senha" e `aria-pressed`) e docs/design/componentes.md (`PasswordInput`: LO, CD, PE)
- `src/components/ui/input.tsx`; `src/components/shared/authStyles.ts` (05-013)
- Capturas: desktop-login.png (olho em `x` 858–876, `y` 389–403, a 13 px da borda direita do campo) e mobile-login.png (olho em `x` 353–368)

## Medidas lidas nas capturas
| Elemento | Valor |
|---|---|
| Ícone | olho riscado quando a senha está **oculta**, olho aberto quando visível: `EyeOffIcon` / `EyeIcon` do lucide, 22 px (`size-5.5`), caixa visível ≈ 19 × 15 px |
| Botão | 40 px de largura (`w-10`), altura do campo, colado à direita (`absolute inset-y-0 right-0`); ícone centrado |
| Cor | `tan` (`#b39463`, contraste 6,1:1 sobre `card`). O Figma mobile usa `#55321f` (`border-soft`, contraste 1,7:1, abaixo dos 3:1 exigidos): **corrigido para `tan` nos dois**, aguardando a pergunta 7 |
| Texto | recuo à direita `pr-12` para o texto não passar sob o botão |

## Instruções
1. Props: `React.ComponentProps<'input'>` **sem** `type` (`ref` e `className` vão para o `Input`). Estado local `visible` (padrão `false`).
2. `div.relative` → `Input` com `type={visible ? 'text' : 'password'}`, `className` = `cn(AUTH_INPUT_CLASS, 'pr-12', className)` → botão `type="button"` (`Button variant="ghost"`, sem fundo no hover) com `aria-pressed={visible}` e `aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}`.
3. Alternar não perde o foco nem a posição do cursor do campo: ao clicar no botão, devolver o foco ao `Input` (`ref` interno combinado com o `ref` recebido).
4. O botão tem anel de foco visível (primitivo) e alvo de toque ≥ 40 px.
5. `autoComplete` é repassado pelo chamador (`current-password` no login, `new-password` no cadastro).
6. Fechamento: `npx prettier --write src/components/shared/PasswordInput.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/shared/PasswordInput.tsx` e `git commit -m "05-014: PasswordInput"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; export nomeado `PasswordInput`.
- [ ] Botão acessível por Tab e Enter/Espaço; `aria-pressed` e `aria-label` coerentes com o estado.
- [ ] Funciona com `register` do react-hook-form (aceita `ref`, `onChange`, `onBlur`, `name`).
- [ ] Sem cor hexadecimal, `oklch()` ou `rgb()`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Probe **não commitado** em 1440×900 e 414×896; captura do olho ao lado de desktop-login.png (posição com tolerância de 2 px; a cor é a corrigida).

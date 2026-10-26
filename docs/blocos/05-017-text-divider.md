# 05-017 — TextDivider ("Ou continue com")

**Status:** concluído
**Fluxo / subitem:** Login/Cadastro › divisor antes dos botões sociais
**Depende de:** 01-001

## Objetivo
Criar o divisor com texto centralizado ("Ou continue com") das telas de autenticação.

## Arquivos
- criar: `src/components/shared/TextDivider.tsx`

## Referências
- docs/design/componentes.md (`Divider` com texto: LO, CD)
- Capturas (1:1): desktop-login.png (linha em `y` 544, de `x` 470 a 649 e de 791 a 969; texto 661–777) e mobile-login.png (linha em `y` 599, de `x` 28 a 137 e de 276 a 385; texto 148–264)

## Medidas lidas nas capturas
| Elemento | Valor |
|---|---|
| Texto | 13 px (`text-caption-md`), `foreground`, altura de linha 16 px, 15 caracteres |
| Linhas | 1 px, cor `border` (`#3f2319`), uma de cada lado, ocupando o resto da largura |
| Intervalo texto ↔ linha | ≈ 12 px (`gap-3`) |
| Largura | desktop: **de ponta a ponta do modal** (500 px; quem usa aplica `-mx-20` para romper o recuo); mobile: a largura do conteúdo (358 px) |

## Instruções
1. Props: `children: ReactNode`, `className?`.
2. `div.flex.items-center.gap-3.text-caption-md.leading-4.text-foreground` com duas linhas decorativas (`span aria-hidden` `h-px flex-1 bg-border`) e o texto no meio (`span`). O texto continua legível por leitor de tela; sem `role="separator"` (o texto é conteúdo).
3. Fechamento: `npx prettier --write src/components/shared/TextDivider.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/shared/TextDivider.tsx` e `git commit -m "05-017: TextDivider"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; export nomeado `TextDivider`.
- [ ] Linhas e texto alinhados no centro vertical; sem cor hexadecimal, `oklch()` ou `rgb()`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Probe **não commitado**; coberto pela captura do 05-048.

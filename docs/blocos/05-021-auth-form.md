# 05-021 — AuthForm (estrutura de Login e Cadastro, desktop e mobile)

**Status:** concluído
**Fluxo / subitem:** Login › 1 e Cadastro › 1 (estrutura das duas telas)
**Depende de:** 03-001, 04-010, 05-003, 05-017, 05-018, 05-019
**Depende de decisão:** perguntas 8 (tamanho do título mobile), 10 e 19 (correções do Figma) do relatório da fase 05

## Objetivo
Criar a estrutura visual comum de Login e Cadastro, com uma variante `desktop` (dentro do `AuthDialog`: abas, texto de apoio) e uma `mobile` (página: logo, título, link para trocar de tela). O formulário em si entra como `children`.

## Arquivos
- criar: `src/components/shared/AuthForm.tsx`

## Referências
- docs/design/componentes.md (`AuthForm`: usado dentro do Dialog no desktop e da página no mobile; um componente com variantes, nunca dois copiados) e docs/fluxos/login.md e cadastro.md (subitem 1)
- Capturas (1:1): desktop-login.png, desktop-cadastro.png, mobile-login.png, mobile-cadastro.png

## Medidas lidas nas capturas
**Desktop** (origem = canto superior esquerdo do modal; coluna de conteúdo 340 px, recuo lateral de 80 px = `px-20`)
| Elemento | Valor |
|---|---|
| Abas | topo do conjunto a **48 px** do topo do modal (`pt-12`), altura 20 px |
| Texto de apoio | 13 px (`text-caption-md`), altura de linha 16 px, `foreground`, centrado, **2 linhas** (largura útil de 397 a 419 px; usar `max-w-102.5` = 410 px), topo a **108 px** (40 px abaixo das abas: `mt-10`) |
| Formulário (`children`) | topo a **164 px** (24 px abaixo do texto de apoio: `mt-6`) |
| Divisor "Ou continue com" | 24 px abaixo do botão de envio (`mt-6`), **de ponta a ponta** do modal (`-mx-20`) |
| Botões sociais | 13 px abaixo do divisor (`mt-3.25`) |
| Base | recuo inferior de ≈ 70 px (`pb-17.5`) antes da faixa de 10 px; a altura final é a soma (login ≈ 582, mínimo 600 pelo `AuthDialog`; cadastro ≈ 656) |

**Mobile** (414 px; margem lateral 28 px = `px-7`; coluna de 358 px)
| Elemento | Valor |
|---|---|
| Logo "KURIO" | `text-logo` (32 px, 05-003), `font-bold`, `tracking-[0.1em]`, `foreground`, centrado, altura de linha 32 px (`leading-none`); **topo da caixa a 132 px** (`pt-[calc(8.25rem+env(safe-area-inset-top))]`), maiúsculas de `y` 137 a 160 |
| Título (`h1`) | 20 px bold (`text-xl font-bold leading-none`), `foreground`, centrado; topo da caixa a 254 px = **90 px abaixo do logo** (`mt-22.5`). Login: "Entrar". Cadastro: "Criar perfil de colecionador" (o Figma o mostra em 18 px e **cortado embaixo**; corrigido: 20 px, sem corte, quebra de linha permitida) |
| Formulário (`children`) | topo a **312 px** (38 px abaixo do título: `mt-9.5`) |
| Divisor | 40 px abaixo do botão (`mt-10`), na largura do conteúdo |
| Botões sociais | 13 px abaixo do divisor (`mt-3.25`) |
| Link de troca | 40 px abaixo dos botões (`mt-10`), centrado, 15 px (`text-body`), `muted-foreground`: "Novo na Kurio? **Crie uma conta**" (→ `/cadastro`) e "Já tem uma conta? **Entre**" (→ `/entrar`); só a parte em negrito é o link, com **sublinhado** (o Figma não distingue; o sublinhado cumpre "link não depende só de cor", pergunta 19) |
| Base | `pb-[calc(2.5rem+env(safe-area-inset-bottom))]` |

Textos de apoio do desktop: login "Entre para gerenciar sua carteira, coleção e perfil de criador."; cadastro "Crie seu perfil de colecionador e conecte uma carteira quando quiser." (o mobile **não** tem texto de apoio).

## Instruções
1. Props: `mode: 'login' | 'signup'`, `variant: 'desktop' | 'mobile'`, `redirect?: string`, `children: ReactNode`, `className?`.
2. **Desktop:** `div.px-20.pt-12.pb-17.5` → `AuthTabs` (`active` = `mode`, `redirect`) → `p` de apoio (`mt-10`, centrado) → `div` com `children` (`mt-6`) → `TextDivider` ("Ou continue com", `-mx-20 mt-6`) → `SocialAuthButtons` (`mt-3.25`). **Sem** `<h1>` (o título é o `sr-only` do `AuthDialog`).
3. **Mobile:** `div.px-7` com o logo (um `Link to="/"`, `aria-label="Kurio, página inicial"`), o `h1` visível, `children`, `TextDivider`, `SocialAuthButtons` e o parágrafo com o link de troca (mantém o `redirect`: `search={{ redirect }}`).
4. O componente **não** conhece o formulário nem a API; só layout e textos.
5. Fechamento: `npx prettier --write src/components/shared/AuthForm.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/shared/AuthForm.tsx` e `git commit -m "05-021: AuthForm"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; export nomeado `AuthForm`; um componente com duas variantes.
- [ ] Desktop: sem `h1`; abas, apoio, formulário, divisor de ponta a ponta e sociais nas posições da tabela (tolerância de 2 px verticais).
- [ ] Mobile: exatamente um `h1`; logo é link para `/`; link de troca mantém o `redirect` e tem sublinhado.
- [ ] Sem rolagem horizontal em 320 px; sem cor hexadecimal, `oklch()` ou `rgb()`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Probe **não commitado** com um formulário de teste: 1440×900 dentro de um `AuthDialog` e 414×896 / 320×700 como página; captura sobreposta a `desktop-login.png`, `desktop-cadastro.png`, `mobile-login.png` e `mobile-cadastro.png` (posições da tabela). Baseline final no 05-048.

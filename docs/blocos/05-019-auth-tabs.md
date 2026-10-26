# 05-019 — AuthTabs ("Entrar | Criar conta")

**Status:** concluído
**Fluxo / subitem:** Login › 1 e Cadastro › 1 (abas do modal; trocar de aba navega mantendo o `redirect`)
**Depende de:** 01-001, 05-002
**Depende de decisão:** pergunta 5 do relatório da fase 05 (links em `nav`, não o primitivo `Tabs`; sublinhado na aba ativa)

## Objetivo
Criar as duas "abas" do topo do modal de autenticação. Cada uma é um link para a rota correspondente (`/entrar` ou `/cadastro`), preservando o `redirect`.

## Arquivos
- criar: `src/components/shared/AuthTabs.tsx`

## Referências
- docs/fluxos/login.md e docs/fluxos/cadastro.md (subitem 1: "trocar de aba navega para `/cadastro` (ou `/entrar`) mantendo o `redirect`") e docs/design/componentes.md (`AuthTabs`: LO, CD d)
- docs/qualidade/acessibilidade.md (aba ativa: cor **+ sublinhado**; não depender só de cor)
- Capturas (1:1): desktop-login.png e desktop-cadastro.png (texto em `y` 211–225, separador em `x` 689–690, `y` 208–227)

## Medidas lidas nas capturas
| Elemento | Valor |
|---|---|
| Texto | 20 px (`text-xl`), peso `font-medium` (não mensurável na captura), altura de linha 20 px; conjunto **centrado** no modal (610–829 px, centro 719,5 = centro do modal) |
| Aba ativa | cor `price` (`#e89b55`) |
| Aba inativa | cor `foreground` (`#f5f1eb`) |
| Separador | barra vertical de **2 × 20 px**, cor `required` com 50 % de opacidade (`bg-required/50`, resulta em `#8a4b38` sobre `card`), decorativa |
| Intervalo texto ↔ separador | ≈ 9 px de cada lado (`gap-2.25`) |
| Sublinhado da aba ativa (acréscimo, pergunta 5) | 2 px, `primary`, colado à base do texto (`after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:bg-primary`) — **não existe no Figma**, exigido pela regra de acessibilidade |

## Instruções
1. Props: `active: 'login' | 'signup'`, `redirect?: string`, `className?`.
2. `nav aria-label="Entrar ou criar conta"` com `ul` de dois `li` (o separador fica entre eles, `aria-hidden`). Cada item é um `Link` do TanStack Router: "Entrar" → `to="/entrar"`, "Criar conta" → `to="/cadastro"`, ambos com `search={{ redirect }}` (valor `undefined` não vai para a URL). O ativo recebe `aria-current="page"`.
3. Ao trocar de aba **dentro do modal**, o campo de foco inicial é o primeiro campo da nova rota (resolvido pelo `AuthDialog`, 05-020); este componente não mexe em foco.
4. O link ativo continua um link (clicar nele não faz nada de novo e não quebra).
5. Fechamento: `npx prettier --write src/components/shared/AuthTabs.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/shared/AuthTabs.tsx` e `git commit -m "05-019: AuthTabs"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; export nomeado `AuthTabs`.
- [ ] Um único item com `aria-current="page"`; cor **e** sublinhado indicam o ativo.
- [ ] Os `href` mantêm o `redirect` (`/cadastro?redirect=%2Fcarrinho`) e omitem a chave quando não há.
- [ ] Navegável por teclado; foco visível; sem cor hexadecimal, `oklch()` ou `rgb()`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Probe **não commitado** em 1440×900; captura do topo ao lado de `desktop-login.png` (posição do texto e do separador, tolerância de 2 px). Coberto no 05-043 e no 05-047.

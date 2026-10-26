# 04-023 — Rodapé: destaques e newsletter

**Status:** pendente
**Fluxo / subitem:** Fase 04 › Layout (Footer, parte 1)
**Depende de:** 04-005, 04-016

## Objetivo
Criar a faixa superior do rodapé: três destaques (W, C, D) e a coluna da newsletter (desabilitada).

## Arquivos
- criar: `src/components/layout/FooterHighlights.tsx`, `src/components/layout/FooterNewsletter.tsx`

## Referências
- docs/design/componentes.md (`Footer`: destaques W/C/D, newsletter desabilitada) e docs/decisoes.md (newsletter do rodapé desabilitada)
- Capturas: desktop-carrinho.png (rodapé: painel `card` de 1200 px em `x` 120–1320; esta faixa em `y` 1120–1370)

## Medidas lidas nas capturas (relativas ao painel de 1200 px)
| Elemento | Valor |
|---|---|
| Colunas | 297 / 266 / 266 / 371 px → `lg:grid-cols-[297fr_266fr_266fr_371fr]` |
| Padding da faixa | 32 px em cima, 16 px embaixo |
| 1ª coluna | começa 48 px à direita da borda do painel (`pl-12`), sem linha |
| 2ª a 4ª colunas | linha vertical de 1 px `primary` à esquerda (`border-l border-primary`), conteúdo 17 px depois (`pl-4`) |
| Círculo | 74 px, fundo `primary`, letra W / C / D de 24 px (`text-heading`) bold em `primary-foreground`, centralizada |
| Título do destaque | 18 px (`text-lg`) bold, `foreground`, ≈ 12 px abaixo do círculo |
| Descrição | 14 px (`text-sm`), linha de 22 px, `muted-foreground` |
| Newsletter: título | "Antecipe-se ao próximo lançamento", 18 px bold, 2 linhas |
| Newsletter: campo | 240 × 40 px, fundo `background`, texto/placeholder `muted-foreground`; botão "Enviar" 85 × 40 px, `primary`, bold, 18 px |
| Newsletter: legenda | 14 px, 3 linhas, `muted-foreground` |

## Instruções
1. `FooterHighlights.tsx`: componente sem props com os 3 destaques fixos (texto do Figma):
   - W — "Segurança da carteira": "Proteja sua carteira e colecione arte digital verificada com confiança."
   - C — "Criadores em destaque": "Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede."
   - D — "Alertas de lançamentos": "Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado."
   O círculo com a letra é `aria-hidden="true"` (decorativo). Renderiza as 3 colunas + `FooterNewsletter` na 4ª, na grade da tabela. Abaixo de 1024 px o componente não aparece (o rodapé inteiro é desktop; o `AppShell` esconde).
2. `FooterNewsletter.tsx`: `form` com `aria-label="Newsletter"`: título (`h2`), `Input` com label só para leitor de tela ("E-mail para a newsletter"), placeholder "digite seu e-mail...", e o botão "Enviar". **Desabilitada** (decisão do usuário): o `Input` com `disabled`; o botão como `ComingSoon` (04-016) com o texto "Enviar" (visível, `aria-disabled`, dica "Em breve"); `onSubmit` sempre `preventDefault()`. Legenda: "Receba lançamentos selecionados, histórias de criadores e novidades do mercado."
3. Usar o `Button` e o `Input` dos primitivos para o visual; o `ComingSoon` recebe as classes do botão primário.
4. Fechamento: `npx prettier --write` nos 2 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/layout/FooterHighlights.tsx src/components/layout/FooterNewsletter.tsx` e `git commit -m "04-023: destaques e newsletter do rodapé"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; exports nomeados.
- [ ] Hierarquia de títulos sem saltos (`h2` para os 3 destaques e para a newsletter; o rodapé não tem `h1`).
- [ ] Campo e botão da newsletter desabilitados e visíveis; Enter não envia nada.
- [ ] Sem cor hexadecimal, `oklch()` ou `rgb()`.
- [ ] Em 1024 px as colunas não geram rolagem horizontal (textos quebram).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Probe **não commitado** dentro de um painel `container-page bg-card`; captura em 1440 px sobreposta ao trecho `y` 1120–1370 de `desktop-carrinho.png` (tolerância de 2 px); axe sem violações graves.

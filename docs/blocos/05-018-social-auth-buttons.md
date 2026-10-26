# 05-018 — SocialAuthButtons (Google e Facebook, desabilitados)

**Status:** concluído (SVGs definidos: `google.svg` do devicon e `facebook-color.svg` do Font Awesome com a cor da marca; ver decisoes.md, "Fase 05 — blocos aprovados")
**Fluxo / subitem:** Login › 1 e Cadastro › 1 (botões sociais desabilitados com "Em breve")
**Depende de:** 04-016

## Objetivo
Criar os botões "Continuar com Google" e "Continuar com Facebook", visíveis e desabilitados (`ComingSoon`, cor cheia, sem opacidade), com os ícones de marca.

## Arquivos
- criar: `src/components/shared/SocialAuthButtons.tsx`
- adicionar (fornecidos pelo usuário, o Haiku **não cria nem desenha**): `src/assets/icons/google.svg` e `src/assets/icons/facebook-color.svg` (o nome `facebook.svg` já é o "f" monocromático do rodapé)

## Referências
- docs/decisoes.md (botões sociais desabilitados; itens "Em breve" em **cor cheia**, estado no cursor, no tooltip e no `aria-disabled`) e docs/design/componentes.md (`SocialAuthButtons`: LO, CD, desabilitados)
- `src/components/shared/ComingSoon.tsx` (04-016; **não** aplica opacidade)
- Capturas (1:1): desktop-login.png (botões em `x` 550–889, `y` 565–604 e 617–656) e mobile-login.png (`x` 28–385, `y` 620–659 e 676–715)

## Medidas lidas nas capturas
| Elemento | Valor |
|---|---|
| Botão | altura 40 px (`h-10`), largura total (340 desktop / 358 mobile), borda 1 px `border`, fundo transparente, raio ≈ 4 px (`rounded-lg`, **nos dois**; o mobile não usa o raio grande) |
| Texto | 13 px (`text-caption-md`), `muted-foreground` (`#cfb28c`), centrado com o ícone |
| Ícone Google | 21 × 20 px, colorido; ícone Facebook 10 × 20 px, azul; intervalo ícone ↔ texto ≈ 12 px (`gap-3`) |
| Intervalo entre os dois botões | **16 px** (`gap-4`). O Figma mostra 12 px só no desktop-login; os outros 3 quadros mostram 16 px, valor adotado (pergunta 19) |
| Conteúdo | o Figma o desloca ≈ 9 px à esquerda do centro; o código centraliza (`justify-center`) |

## Instruções
1. Aguardar os 2 SVGs do usuário em `src/assets/icons/` (exportados do Figma). Se não existirem, **parar e perguntar**.
2. `SocialAuthButtons({ className })`: `div.flex.flex-col.gap-4` (`role="group"`, `aria-label="Entrar com outra conta"`) com dois `ComingSoon` (04-016), `className="flex h-10 w-full items-center justify-center gap-3 rounded-lg border border-border text-caption-md text-muted-foreground"`.
3. Dentro de cada um: `<img src={…} alt="" className="h-5 w-auto" />` (decorativa) e o texto "Continuar com Google" / "Continuar com Facebook". O `ComingSoon` já acrescenta "(em breve)" ao nome acessível e a dica "Em breve".
4. Nenhuma ação; nenhum `onClick`.
5. Fechamento: `npx prettier --write src/components/shared/SocialAuthButtons.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/shared/SocialAuthButtons.tsx src/assets/icons/google.svg src/assets/icons/facebook-color.svg` e `git commit -m "05-018: SocialAuthButtons"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; export nomeado `SocialAuthButtons`.
- [ ] Os dois botões recebem foco por Tab, mostram "Em breve" (foco e hover), têm `aria-disabled="true"`, **sem** `disabled`, e não navegam.
- [ ] Texto e borda em cor cheia (sem `opacity`).
- [ ] Sem cor hexadecimal no `.tsx` (as cores dos SVGs ficam nos arquivos).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Probe **não commitado** em 1440×900 e 414×896; captura ao lado de `desktop-login.png` e `mobile-login.png` (altura 40 px, intervalo 16 px, tolerância de 2 px). Coberto no 05-043 e no 05-047.

# 04-025 — Rodapé: colunas de links

**Status:** pendente (**quais links ficam habilitados: pergunta 15 do relatório da fase 04**)
**Fluxo / subitem:** Fase 04 › Layout (Footer, parte 3)
**Depende de:** 04-010, 04-016

## Objetivo
Definir os dados das três colunas de links do rodapé e o componente que desenha uma coluna.

## Arquivos
- criar: `src/components/layout/footerLinks.ts`, `src/components/layout/FooterLinkColumn.tsx`

## Referências
- docs/design/componentes.md (`Footer`: colunas de links) e docs/decisoes.md (itens sem tela: visíveis e desabilitados)
- Capturas: desktop-carrinho.png (colunas "Meu perfil", "Central de ajuda" e "Coleções")
- `src/mocks/seed/collections.ts` (ids das coleções: `arte-digital`, `fotografia`, `musica`, `arte-3d`, `utilidade`)

## Medidas lidas nas capturas
| Elemento | Valor |
|---|---|
| Título da coluna | 18 px (`text-lg`) bold, `foreground`; ≈ 30 px abaixo do topo da faixa de links |
| Link | 14 px (`text-sm`), `foreground`; **30 px entre linhas** (passo vertical) |

## Instruções
1. `footerLinks.ts`: `type FooterLink = { label: string; to?: '/' | '/perfil'; search?: { colecao?: string }; disabled?: boolean }` e `type FooterColumn = { title: string; links: FooterLink[] }`; exportar `FOOTER_COLUMNS` (textos do Figma, na ordem):
   - **Meu perfil:** Meu perfil (`to: '/perfil'`), Minha coleção, Atividade, Estúdio do criador, Lista de interesse (os 4 últimos `disabled: true`);
   - **Central de ajuda:** Central de ajuda, Como comprar NFTs, Carteira e segurança, Política do mercado, Denunciar item (todos `disabled: true`);
   - **Coleções:** Arte digital (`to: '/'`, `search: { colecao: 'arte-digital' }`), Fotografia (`fotografia`), Música (`musica`), Arte 3D (`arte-3d`), Utilidade (`utilidade`).
2. `FooterLinkColumn.tsx`: props `column: FooterColumn`. Renderiza `nav aria-label={column.title}` com `h2` (o título) e `ul` de links: `Link` do TanStack Router (com `search`) ou `ComingSoon` (04-016) quando `disabled`. Hover do link em `primary`, foco visível.
3. Fechamento: `npx prettier --write` nos 2 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/layout/footerLinks.ts src/components/layout/FooterLinkColumn.tsx` e `git commit -m "04-025: colunas de links do rodapé"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; exports nomeados.
- [ ] 3 landmarks `navigation` no rodapé, cada um com nome (o título da coluna).
- [ ] "Meu perfil" navega para `/perfil`; as coleções para `/?colecao=<id>`; os demais itens são `aria-disabled` com "Em breve".
- [ ] Sem cor hexadecimal, `oklch()` ou `rgb()`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Probe **não commitado**; captura sobreposta às colunas de `desktop-carrinho.png` (tolerância de 2 px em passo e posição).

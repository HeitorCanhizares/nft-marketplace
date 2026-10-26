# 04-024 — Rodapé: redes sociais e carteiras compatíveis

**Status:** pendente (SVGs definidos pelo usuário: Font Awesome Free 6.5.2, ver decisoes.md)
**Fluxo / subitem:** Fase 04 › Layout (Footer, parte 2)
**Depende de:** 04-003, 04-016

## Objetivo
Criar os botões das redes sociais (desabilitados) e o selo "METAMASK · WALLETCONNECT · COINBASE" (`WalletBadges`, também usado no Pagamento).

## Arquivos
- criar: `src/components/layout/SocialLinks.tsx`, `src/components/shared/WalletBadges.tsx`
- criar (assets, sem código; **fornecidos pelo usuário**): `src/assets/icons/facebook.svg`, `instagram.svg`, `twitter.svg`, `linkedin.svg`, `youtube.svg`
- alterar: `src/assets/icons/SvgIcon.tsx` (acrescentar os 5 nomes à tabela `ICONS`; é uma alteração de dados, sem lógica nova)

## Referências
- docs/design/componentes.md (`WalletBadges`: Footer, PG) e docs/design/tokens.md#ícones (ícones de marca são SVGs próprios)
- Capturas: desktop-carrinho.png (rodapé, coluna da direita: "Redes sociais" e "Carteiras compatíveis")

## Medidas lidas nas capturas
| Elemento | Valor |
|---|---|
| Título "Redes sociais" / "Carteiras compatíveis" | 18 px (`text-lg`) bold, `foreground` |
| Botão social | quadrado de 32 px, borda de 1 px `primary`, raio de 4 px, 8 px entre botões; ícone de 16 px em `primary` |
| Selo de carteiras | 228 × 26 px, fundo `background`, borda de 1 px `border-soft`, raio de 4 px; texto de 9 px (`text-tiny`) bold, maiúsculas, `primary`, separado por `·` |

## Instruções
1. Receber do usuário (via Opus) os 5 SVGs de marca e copiá-los **sem editar** para `src/assets/icons/` (mesmo procedimento e verificação de hash do 04-002). **Se os arquivos não existirem, parar e perguntar; não desenhar ícones nem usar texto no lugar.**
2. `SvgIcon.tsx`: acrescentar `facebook`, `instagram`, `twitter`, `linkedin`, `youtube` à tabela `ICONS` com o tamanho nativo de cada arquivo.
3. `SocialLinks.tsx`: lista (`ul`, `aria-label="Redes sociais"`) com os 5 botões, **desabilitados** (`ComingSoon`, 04-016: ainda não há endereço das redes), cada um com `aria-label` ("Facebook", "Instagram", "Twitter", "LinkedIn", "YouTube") e o `SvgIcon` correspondente de 16 px em `text-primary`. O `ComingSoon` recebe as classes do quadrado de 32 px.
4. `WalletBadges.tsx`: `ul` com `aria-label="Carteiras compatíveis"` e 3 itens ("MetaMask", "WalletConnect", "Coinbase"; texto em maiúsculas por CSS `uppercase`, para o leitor ler normalmente), com o separador `·` em `span aria-hidden="true"`. Props: `className?`. Sem dados externos.
5. Fechamento: `npx prettier --write` nos 3 arquivos de código; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/layout/SocialLinks.tsx src/components/shared/WalletBadges.tsx src/assets/icons` e `git commit -m "04-024: redes sociais e carteiras compatíveis"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; exports nomeados.
- [ ] Os 5 botões são `aria-disabled="true"` e focáveis, com "Em breve" no foco; nenhum `href`.
- [ ] O leitor de tela lê "MetaMask, WalletConnect, Coinbase" sem os pontos.
- [ ] Sem cor hexadecimal, `oklch()` ou `rgb()` fora dos arquivos `.svg`.
- [ ] O selo não estoura a coluna em 1024 px (quebra de linha permitida).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Probe **não commitado**; captura sobreposta à coluna direita do rodapé em `desktop-carrinho.png` (tolerância de 2 px).

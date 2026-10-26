# 04-002 — Copiar os 6 ícones SVG do Figma

**Status:** concluído
**Fluxo / subitem:** Fase 04 › Ícones
**Depende de:** 03-020

## Objetivo
Trazer para `src/assets/icons/` (pasta aprovada pelo usuário em 2026-10-26) os 6 SVGs exportados do Figma, com nomes em kebab-case, **sem alterar o conteúdo**.

## Arquivos
- criar (assets, sem código): `src/assets/icons/message.svg`, `x.svg`, `arrow-down.svg`, `search.svg`, `user.svg`, `shop.svg`

## Referências
- docs/decisoes.md (Workflow 2026-10-26: ícones)
- docs/design/tokens.md#ícones

## Instruções
Os nomes das pastas de origem **terminam com um espaço** (`Desktop ` e `Mobile `). Origem: `C:\Users\heito\AppData\Local\Temp\claude\C--Users-heito-Desktop-Projetos-nft-marketplace\8e4c3c27-28dc-4803-a128-d2e6dcbb478b\scratchpad\figma-export\`.

| Origem | Destino | Tamanho nativo | Uso previsto |
|---|---|---|---|
| `Desktop /Message.svg` | `src/assets/icons/message.svg` | 18 | e-mail (compartilhar, fase 07) |
| `Desktop /X.svg` | `src/assets/icons/x.svg` | 18 | fechar (Dialog e Sheet) |
| `Desktop /Arrow-Down.svg` | `src/assets/icons/arrow-down.svg` | 20 | seta do Select |
| `Mobile /Search.svg` | `src/assets/icons/search.svg` | 22 | busca do mobile |
| `Mobile /User.svg` | `src/assets/icons/user.svg` | 20 | aba Perfil da barra mobile |
| `Mobile /Shop.svg` | `src/assets/icons/shop.svg` | 20 | aba Carrinho da barra mobile |

1. Criar a pasta `src/assets/icons/` e copiar os 6 arquivos (PowerShell: `Copy-Item -LiteralPath "<origem>\Desktop \Message.svg" -Destination "src\assets\icons\message.svg"`; usar `-LiteralPath` por causa do espaço no fim do nome da pasta).
2. **Não editar** o conteúdo (as cores literais dentro dos SVGs são ignoradas: o `SvgIcon` do 04-003 usa o arquivo só como máscara e a cor vem da classe `text-*`).
3. Conferir que cada destino tem o mesmo `Get-FileHash` da origem.
4. Se o Prettier reclamar dos `.svg`, **não** formatá-los: acrescentar `src/assets/icons` ao `.prettierignore` (única alteração permitida fora da lista).
5. Commit: `git add src/assets/icons .prettierignore` (se alterado) e `git commit -m "04-002: ícones SVG do Figma"`.

## Critérios de aceite
- [ ] Exatamente 6 arquivos `.svg` em `src/assets/icons/`, nomes em kebab-case.
- [ ] Hash idêntico ao da origem.
- [ ] Nenhum arquivo de código criado neste bloco.

## Verificação (Sonnet)
- `Get-ChildItem src/assets/icons` lista os 6 arquivos; `Get-FileHash` confere com a origem.
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.

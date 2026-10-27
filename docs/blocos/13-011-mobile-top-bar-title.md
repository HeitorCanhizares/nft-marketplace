# 13-011 — Título do `MobileTopBar` alinhado ao Figma

**Status:** pendente
**Responsável:** Haiku (o Sonnet mede antes e confirma depois)
**Depende de:** —
**Toca:** `src/components/layout/MobileTopBar.tsx`
**Paralelo:** sim com 13-010 e 13-012.
**Lote:** B

## Objetivo
O título fica ~12 px à esquerda do Figma nas telas mobile que usam a barra (Carrinho, Pagamento, Perfil, Carteiras, Confirmação e outras).

## Medição (Sonnet, antes do Haiku)
- Em `docs/design/telas/mobile-carrinho.png` e `mobile-pagamento.png` (1:1, 414 px), medir o `x` de início e fim do título e do botão "Voltar". Em seguida medir o mesmo no app (414 px, `page.evaluate` de `getBoundingClientRect()` do `h1`). Escrever aqui o deslocamento exato e a causa (hoje: `grid-cols-[36px_1fr_36px]` com o título centralizado em `1fr`; o botão de ação à direita pode estar vazio e mudar a centralização; ler também `docs/blocos/04-019-mobile-top-bar.md`).
- Se o Figma centraliza o título na **tela** e não na coluna central, a correção é de grid; se ele tem margem própria, é `padding`/`margin` com token de espaçamento.

## Instruções
1. Aplicar a correção medida em `MobileTopBar.tsx` usando só utilitários com tokens de espaçamento (nada de `px` solto fora da escala já usada no arquivo).
2. Não mudar a API do componente (`title`, `backTo`, `fallbackTo`, `action`, `className`).
3. `npx prettier --write`; `npm run format:check && npm run lint && npm run typecheck && npm run build`.

## Critérios de aceite
- [ ] O `x` do título coincide com o Figma (± 1 px) em 414 px, com e sem `action`, e títulos longos (`break-words`) continuam quebrando sem sobrepor os botões.
- [ ] Sem overflow horizontal em 320 px.

## Verificação (Sonnet)
- `npm run test:e2e -- layout cart profile wallets --project=mobile`; baselines mobile afetadas regeneradas e levadas ao usuário.

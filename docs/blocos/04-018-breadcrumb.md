# 04-018 — Breadcrumb (componente de layout)

**Status:** concluído
**Fluxo / subitem:** Fase 04 › Layout
**Depende de:** 04-010

## Objetivo
Montar a migalha de navegação a partir de uma lista de itens, em cima do primitivo do shadcn, para Detalhes, Carrinho e Pagamento (desktop).

## Arquivos
- criar: `src/components/layout/Breadcrumb.tsx`

## Referências
- docs/design/componentes.md (`Breadcrumb`: DE, CA, PG d) e docs/fluxos/detalhes-nft.md (inclui o nome do NFT)
- Capturas: desktop-carrinho.png ("Início / Mercado / Carrinho": texto 14 px bold, o texto fica a 32 px abaixo da linha do cabeçalho; esse espaço é do `AppShell`, não deste componente)
- `src/components/ui/breadcrumb.tsx` (primitivo já estilizado, com `aria-label="Navegação estrutural"` e `aria-current="page"`)

## Instruções
1. Importar o primitivo com **namespace** para não colidir com o nome (`import * as Ui from '@/components/ui/breadcrumb'`) e o `Link` de `@tanstack/react-router`.
2. Tipo `BreadcrumbEntry = { label: string; link?: LinkProps }` (`LinkProps` importado como tipo de `@tanstack/react-router`). Props: `items: BreadcrumbEntry[]` e `className?`.
3. Renderizar `Ui.Breadcrumb` → `Ui.BreadcrumbList` → para cada item: `Ui.BreadcrumbItem` com `Ui.BreadcrumbLink asChild` envolvendo `<Link {...entry.link}>{label}</Link>` (itens com `link`) ou `Ui.BreadcrumbPage` (o **último** item, sempre página atual, mesmo que tenha `link`); `Ui.BreadcrumbSeparator` entre eles.
4. Visível só no desktop: aplicar `max-lg:hidden` por padrão (no mobile quem navega é o `MobileTopBar`); `className` pode sobrescrever.
5. Textos longos (nome de NFT) quebram linha; não truncar.
6. Se o tipo de `LinkProps` gerar erro de generics difícil de resolver sem `any`, **parar e perguntar** (alternativa: `to` como `string` + `<a>`, que perde a navegação tipada).
7. Fechamento: `npx prettier --write src/components/layout/Breadcrumb.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/layout/Breadcrumb.tsx` e `git commit -m "04-018: Breadcrumb"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; export nomeado `Breadcrumb`.
- [ ] `nav` com `aria-label="Navegação estrutural"`; último item com `aria-current="page"`.
- [ ] Itens com `link` navegam sem recarregar a página; foco visível; hover em `primary`.
- [ ] Oculto abaixo de 1024 px, visível a partir de 1024 px.
- [ ] Sem cor hexadecimal, `oklch()` ou `rgb()`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Probe **não commitado** com "Início / Mercado / Carrinho" e com 4 níveis e nome longo; captura 1440×900 comparada com `desktop-carrinho.png` (posição, tamanho e separador); em 414×896 não aparece.

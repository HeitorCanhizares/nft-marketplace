# 06-039 — `CatalogTabs` (abas e área do catálogo)

**Status:** concluído
**Fluxo / subitem:** Início › 4 (abas "Todos os NFTs", "Novos lançamentos", "Em alta")
**Depende de:** 01-010, 06-004
**Depende de decisão:** pergunta 14 do relatório da fase 06 (espaçamento das abas no mobile)

## Objetivo
Criar o componente das abas do catálogo: a lista de abas, um espaço à direita para a ordenação (desktop) e o painel com o conteúdo da aba ativa.

## Arquivos
- criar: `src/components/shared/CatalogTabs.tsx`

## Referências
- docs/design/componentes.md (`CatalogTabs`) e docs/fluxos/inicio.md (subitem 4: "Visual: cor + sublinhado na aba ativa"; ligadas a `?aba=`)
- `src/components/ui/tabs.tsx` (`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`: ativa em `primary` com sublinhado de 2 px; use `data-[state=…]`) e `src/lib/catalogOptions.ts` (`CATALOG_TABS`)
- Capturas 1:1. **Desktop:** abas em 15 px (`text-body`), 20 px entre elas, sublinhado de 2 px sob a ativa, y 650–669, à esquerda do catálogo (x 478); ordenação à direita (x até 1319); a grade começa 28 px abaixo. **Mobile:** 14 px (`text-sm`), x 24, sublinhado de 2 px em y 325–326, grade 17 px abaixo; as três abas somam ≈ 320 px de texto e precisam caber em 366 px

## Instruções
1. Props: `value: CatalogTab`, `onValueChange: (value: CatalogTab) => void`, `trailing?: ReactNode` (a ordenação no desktop), `children: ReactNode` (o painel), `className?`.
2. Estrutura: `Tabs` (`value`, `onValueChange`, `activationMode="manual"`: setas só movem o foco, **Enter/Espaço** ativam, para não disparar uma requisição por seta); uma linha `flex items-center justify-between` com `TabsList` (`aria-label="Categorias do catálogo"`, `gap-4 lg:gap-5`, `text-sm lg:text-body` nos gatilhos) e `trailing`; abaixo, `TabsContent value={value}` com `mt-4 lg:mt-7` e os `children`.
3. As abas vêm de `CATALOG_TABS` (rótulos e valores). O painel é **um só** (o da aba ativa), porque a aba filtra a mesma grade: o `aria-controls`/`aria-labelledby` do Radix fica válido.
4. Foco visível pelo anel padrão; contraste da aba inativa (`foreground`) e da ativa (`primary` + sublinhado) ≥ 4,5:1.
5. Fechamento: `npx prettier --write src/components/shared/CatalogTabs.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/shared/CatalogTabs.tsx` e `git commit -m "06-039: CatalogTabs"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; sem cor hexadecimal.
- [ ] Ativa: cor + sublinhado de 2 px; Tab entra na lista, setas movem o foco entre as abas, Enter ativa.
- [ ] Em 320 px as três abas **não** geram rolagem horizontal (quebram ou diminuem o espaço, sem cortar).
- [ ] `axe`: sem violação de `aria-controls`/`aria-labelledby`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Probe **não commitado** em 1440×900, 414×896 e 320×700; comparado com as capturas; axe.

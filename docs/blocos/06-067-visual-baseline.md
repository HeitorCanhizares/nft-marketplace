# 06-067 — Baseline visual da Início

**Status:** pendente
**Responsável:** Sonnet (o Haiku não escreve testes)
**Fluxo / subitem:** Início › baseline visual (aprovada pelo usuário)
**Depende de:** 06-066

## Objetivo
Criar a regressão visual da Início em desktop e mobile, com os estados não desenhados, e entregar ao usuário a comparação com as capturas do Figma para aprovar a baseline.

## Arquivos
- criar: `tests/visual/home.spec.ts`

## Referências
- docs/qualidade/testes.md (Regressão visual: `toHaveScreenshot()` nos dois projetos, dados do seed, animações desligadas; **a primeira baseline é aprovada pelo usuário** comparando com `docs/design/telas/`; estados não desenhados também ganham baseline; `maxDiffPixelRatio` ≤ 0,01; imagens e fontes carregadas antes da captura)
- Capturas: `desktop-inicio.png` (1440×3668) e `mobile-inicio.png` (414×896); `tests/visual/auth.spec.ts` (padrão: `settle`, `go`, `SHOT`; as baselines valem só no Windows, sufixo `-win32`)

## Instruções
O Sonnet escreve e gera as imagens.
1. **Determinismo:** `reducedMotion: 'reduce'` (o hero fica no slide 1 e sem bolinha pulsando), esperar `document.fonts.ready` e as imagens, `animations: 'disabled'`, `caret: 'hide'`, `maxDiffPixelRatio: 0.01`, mouse fora da tela, scroll no topo; seed fixo (as contagens dos filtros e os números do seed **não** são os do Figma: ver as diferenças aceitas).
2. **[d]** página inteira de `/` (1440 px de largura); recortes do hero, do `FilterPanel` + destaque, da grade, da paginação, dos promos e do blog; estados: card em hover (barra de ações), foco no nome do card, filtros ativos (coleção + rede + faixa aplicada), aba "Novos lançamentos", `SortSelect` aberto, `/?pagina=2`, vazio (`/?q=zzzz`), erro do catálogo, erro de `/home`, esqueleto (com `delayRoute` longo, capturando antes da resposta), `/?favoritos=1` logado (com itens e vazio), card "Esgotado" e com "Atualizado" (via `triggerStockChange`/`triggerPriceChange`), tooltip "Em breve" do blog.
3. **[m]** viewport de `/` (414×896) e página inteira; `/?pagina=2` (18 cards); drawer de filtros aberto (e com um filtro ativo); busca com texto; vazio; erro; esqueleto; `/?favoritos=1` (itens e vazio); card "Esgotado" e "Atualizado"; `/` em 320×700.
4. **Comparação com o Figma** (entregue ao usuário, não é asserção): para as 2 capturas, a baseline ao lado e a medição das posições das tabelas dos blocos 06-037, 06-038, 06-041 a 06-043, 06-046 a 06-049, 06-055 e 06-056 (hero 450/190 px, painel de filtros 310×785, card 258×300 e 175×200, passo de linha, paginação, promos 586×250, blog 368 px, barra de busca 313×45, abas, 96 px entre seções), com as diferenças apontadas. **Diferenças aceitas a listar ao usuário:** contagens e faixa de preço do seed (Figma: 33, 12, 65…, "0,02 - 12,30"); bolinhas do hero com ativa preenchida e as demais só com borda; botão de pausar do hero (não existe no Figma); opção de filtro ativa com check e barra; "Ordenar por" sem sobreposição com a seta; título do promo 2 quebrando dentro da coluna; blog em 4 colunas que preenchem os 1200 px; paginação com botões de 40 px (Figma 35); fundo do hero mobile (gradiente a 55 %, estimado); RARO 80×29/68×31; abas do mobile com 16 px de espaço; estados vazio, erro, esqueleto, "Esgotado", "Atualizado", favoritos e drawer (não desenhados).
5. **Só com o OK do usuário** as imagens entram como baseline; qualquer diferença depois disso quebra o teste. Registrar a aprovação no 06-068.
Fechamento: `npm run lint && npm run format:check && npm run typecheck` → exit 0. Commit: `git add tests/visual/home.spec.ts tests/visual/home.spec.ts-snapshots` e `git commit -m "06-067: baseline visual da Início"` (somente depois da aprovação).

## Critérios de aceite
- [ ] As capturas são determinísticas: duas execuções seguidas sem diferença.
- [ ] O usuário aprovou a baseline desktop e mobile.
- [ ] Nenhum teste da suíte E2E foi alterado por este bloco.

## Verificação (Sonnet)
- `npx playwright test tests/visual/home.spec.ts` verde nos dois projetos; `npm run lint && npm run format:check && npm run typecheck && npm run build` → exit 0.

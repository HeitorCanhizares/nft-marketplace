# Testes (Playwright)

Responsável: **Sonnet**. Cada bloco termina com testes passando; o Haiku não escreve testes.

## Configuração

- Projetos do Playwright: **desktop** (1440×900, Chromium) e **mobile** (414×896, Chromium com emulação de toque). Firefox e WebKit no desktop para a suíte E2E completa (não para a visual).
- O servidor de teste roda o build de preview com `.env.test`: MSW ligado, taxas aleatórias em `0`, latência fixa baixa, `VITE_MOCK_SEED_RESET=true`.
- Cada teste começa com o banco do mock limpo (novo contexto de navegador = IndexedDB novo).
- Cenário forçado por teste: decisão A6 (gravar no localStorage antes do `goto`).
- Seletores: `getByRole`, `getByLabel`, `getByText`. **Sem seletores CSS ou `data-testid`**, a não ser quando não houver alternativa acessível. Isso também testa a acessibilidade.

> **Modo enxuto (2026-10-26):** nas fases 06–12 cada fluxo testa só o caminho principal; os casos de borda da tabela abaixo e de `api-mock/cenarios.md` são escritos na **fase 13**. Ver `decisoes.md`.

## E2E (`tests/e2e/`)

Um arquivo por fluxo. Além do caminho feliz, **um teste por cenário obrigatório** de [cenarios.md](../api-mock/cenarios.md):

| Fluxo | Testes mínimos |
|---|---|
| Início | filtrar, buscar, ordenar, paginar e conferir a URL **e os parâmetros enviados à API**; filtros combinados; mudar filtro volta à página 1; refresh e voltar/avançar do navegador restauram o estado; catálogo vazio; erro de rede com "Tentar novamente"; respostas fora de ordem mostram o último filtro |
| Detalhes | acesso direto pela URL; trocar edição muda o preço; edição esgotada; stepper respeita o estoque descontando o carrinho; favoritar sem login → login → volta já favoritado; favorito persiste após refresh; 404 |
| Carrinho | adicionar, alterar, remover respeitando estoque; carrinho persiste após refresh; itens do visitante preservados no login; aplicar e remover cupom; cupom inválido e expirado; valores exibidos idênticos às strings da cotação; preço e estoque mudando em tempo real; carrinho vazio |
| Pagamento | validação dos campos; revisão antes do envio; conexão, recusa, desconexão e troca de rede da carteira; assinatura recusada; preço, estoque, cupom e taxa mudando → nova confirmação; **duplo clique e timeout geram um único pedido**; falha preserva carrinho; sessão expirada no meio → login → volta com formulário preenchido |
| Confirmação | pendente → confirmado; pendente → recusado; refresh com pedido pendente retoma; socket caído → polling; recibo só com confirmado; **recibo não muda** após alterar o preço do NFT no mock; carrinho mantém itens adicionados depois da cotação; pedido de outro usuário (403) |
| Login / Cadastro | validação; credenciais inválidas; conflito de e-mail e de usuário; `redirect`; sessão recuperada após refresh; logout limpa cache privado; troca de usuário não mostra dados do anterior (favoritos, carrinho, carteiras) |
| Perfil / Carteiras | salvar dados; conflito; avatar; senha atual errada; carteira principal e secundária; alterações persistem após refresh |
| Rotas protegidas | pagamento, perfil, carteiras, favoritos e pedidos sem login → `/entrar?redirect=` |

## Acessibilidade automatizada

Em cada página e em cada modal aberto: `@axe-core/playwright` sem violações `serious` ou `critical`. Mais: teste de teclado (abrir e fechar modal só com teclado, foco volta ao gatilho) e teste de overflow em 320px.

## Regressão visual (`tests/visual/`)

- `toHaveScreenshot()` de cada tela nos dois projetos (desktop e mobile), com dados do seed e animações desligadas.
- A **primeira baseline é aprovada pelo usuário** comparando com as capturas do Figma em `docs/design/telas/`. Depois disso, qualquer diferença quebra o teste.
- Estados não desenhados (vazio, erro, recusado) também ganham baseline.
- Imagens e fontes carregadas antes da captura; tolerância pequena (`maxDiffPixelRatio` ≤ 0,01).

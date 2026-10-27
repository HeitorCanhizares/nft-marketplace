# 13-003 — Triagem da suíte no Firefox e no WebKit

**Status:** concluído (triagem feita; Firefox e WebKit sem execução possível neste ambiente, ver Resultado)
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-002 (e das correções 13-010 a 13-012, para a triagem não pegar diferenças já conhecidas)
**Toca:** — (só execução; cria blocos de correção `13-1NN` quando necessário)
**Paralelo:** não.
**Lote:** —

## Objetivo
Rodar **uma vez** a suíte atual (sem os specs de borda novos) em Firefox e WebKit, classificar cada falha e abrir um bloco para cada causa.

## Instruções
1. `npm run test:e2e -- --project=firefox --project=webkit`. Guardar a lista de falhas (spec › teste › navegador).
2. Classificar:
   - **bug do app** (ex.: `SvgIcon` com máscara CSS que não pinta no Firefox: ícones do `MobileTabBar`, do rodapé e dos primitivos somem) → bloco de correção Haiku `13-1NN-fix-<slug>`;
   - **diferença de motor no teste** (Tab no WebKit, `Intl`, teclado em `<select>`, arrastar) → ajustar o teste com seletor ou espera melhor. **Nunca** pular o teste por navegador sem registrar o motivo num comentário no próprio teste;
   - **instável** → tratar como o 13-004.
3. `SvgIcon` (pendência conhecida): reproduzir no Firefox com uma captura do rodapé e da barra mobile e anotar a causa (candidatas: `mask-image` sem `mask-mode`, `mask-size: contain` com SVG sem `viewBox` ou sem `width`/`height`, `-webkit-mask` vs `mask`). O 13-012 está escrito como esboço; o Sonnet o completa com a causa antes de o Haiku começar.
4. A regressão visual **não** roda aqui.

## Critérios de aceite
- [ ] Lista de falhas por causa entregue ao Opus, cada uma com bloco de correção ou ajuste de teste.
- [ ] Depois das correções: `npm run test:e2e -- --project=firefox --project=webkit` com 0 falhas nos specs atuais.

## Resultado (2026-10-27)
Suíte completa nos 4 projetos (`npm run test:e2e`, 2614 testes): Chromium desktop e mobile verdes; Firefox e WebKit falham por ambiente, não por bug do app.
- **Firefox:** `browserContext.newPage: Target crashed` em todos os testes, também com 1 worker e numa página `data:` em branco fora do app. O binário do Firefox do Playwright cai nesta máquina (Windows 10). Nada a corrigir no código.
- **WebKit:** o navegador abre, mas o boot do app leva ~58 s: o IndexedDB do WebKit no Windows grava o seed muito devagar (a transação de `nfts` sozinha leva ~4,3 s) e o modo de teste recria o banco a cada teste (`VITE_MOCK_SEED_RESET=true`), então todo teste estoura o `waitForFunction` do `ready`. Acelerar exigiria mudar como o mock guarda o seed (arquitetura): fica como pergunta ao usuário.
- **SvgIcon no Firefox:** corrigido no 13-012 (`maskMode: 'alpha'`), sem verificação no Firefox por causa do item acima.
- Recomendação: rodar `--project=firefox --project=webkit` em CI Linux, onde os dois navegadores do Playwright funcionam.

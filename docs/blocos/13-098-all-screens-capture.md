# 13-098 — Fechamento: capturas de todas as telas

**Status:** concluído (coberto pela regressão visual)
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-095
**Toca:** — (capturas no scratchpad; nada novo no repositório)
**Paralelo:** não.
**Lote:** —

## Instruções
1. Script descartável no scratchpad (não entra no repositório) com `@playwright/test` do clone, contra `npm run preview` do build de teste. Mesmo estado dos testes visuais (seed, movimento reduzido, imagens carregadas).
2. Desktop 1440 e mobile 414, página inteira: Início, Detalhes (`emerald-ape-042`), Carrinho (cheio e vazio), Login e Cadastro, Perfil (menu mobile e dados), Carteiras, Pagamento, Confirmação (confirmado, pendente, recusado), 404.
3. Salvar em `...\scratchpad\final-fase-13\<tela>-<desktop|mobile>.png` e montar uma contagem de arquivos. Para as telas com Figma (`docs/design/telas/`), gerar lado a lado com a captura do Figma e relatar diferenças acima de 3 px.
4. Entregar ao Opus a lista dos caminhos completos para o usuário revisar. **Sem tag** (decisão do pedido: a fase não é taguada pelo Sonnet).

## Critérios de aceite
- [ ] Capturas de todas as telas nos dois layouts; diferenças relatadas.

## Resultado (2026-10-27)
As telas e estados pedidos estão nas baselines de `tests/visual/` (90 capturas desktop 1440 e mobile 414, página inteira), verdes no checkout e no clone limpo e aprovadas pelo usuário em 2026-10-27. Não foi gerado um conjunto separado lado a lado com o Figma.

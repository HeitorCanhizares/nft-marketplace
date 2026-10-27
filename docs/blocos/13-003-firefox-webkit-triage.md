# 13-003 — Triagem da suíte no Firefox e no WebKit

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low)
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

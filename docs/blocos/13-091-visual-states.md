# 13-091 — Baselines visuais dos estados não desenhados

**Status:** pendente
**Responsável:** Sonnet (baselines aprovadas pelo usuário)
**Depende de:** 13-010, 13-011, 13-014, 13-015, 13-016 e dos specs de borda (para os estados já existirem estáveis)
**Toca:** `tests/visual/states.spec.ts` (novo) e a pasta de snapshots dele
**Paralelo:** não com blocos que alterem a UI.
**Lote:** T8
**Origem:** 06-067, 11-020, 12-020 (baselines por estado)

Regras: 13-001; padrão de `tests/visual/*.spec.ts` (`SHOT`, `settle`, movimento reduzido, imagens carregadas, `maxDiffPixelRatio` ≤ 0,01). Só Chromium (`desktop` e `mobile`).

## Estados (uma captura por estado e por projeto)
1. Início: vazio (`empty-catalog`), erro (`server-error:GET /nfts`), carregando (`slow`, esqueletos), drawer de filtros aberto `[m]`, favoritos vazio, 320 px `[m]`.
2. Detalhes: NFT esgotado, 404, erro.
3. Carrinho: vazio, com item esgotado e aviso de preço, erro.
4. Perfil e Carteiras: erro de validação visível, diálogo de troca de e-mail, diálogo de remover secundária.
5. Pagamento: revisão aberta, revisão com mudanças, revisão com erro, conectando, recusa de conexão.
6. Confirmação: pendente, pendente com aviso de demora, recusado, 403, 404 (o recibo confirmado já tem baseline da fase 12).
7. Login/Cadastro com erro de servidor.

## Critérios de aceite
- [ ] `npx playwright test tests/visual/states.spec.ts --update-snapshots` gera as baselines; segunda execução sem diferença.
- [ ] **O usuário aprova as baselines** (estados não desenhados no Figma: seguem o padrão visual existente, `decisoes.md` › Design).

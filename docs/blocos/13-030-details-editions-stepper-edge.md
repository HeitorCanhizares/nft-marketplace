# 13-030 — Detalhes: edições, limites de estoque e stepper

**Status:** concluído
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001, 13-010
**Toca:** `tests/e2e/nft-details-editions-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T2
**Origem:** 07-018 (Quantidade e edição), `testes.md` (Detalhes)

Regras: 13-001. NFT principal: `emerald-ape-042` (1/1 `1.49` estoque 1; 1/10 `1.39` estoque 6; 1/50 `1.19` estoque 20; ABERTA `1.29`).

## Casos
1. O stepper respeita estoque menos o que já está no carrinho; textos "N já no seu carrinho" e "Máximo disponível: N"; "+" desabilitado no limite; "-" em 1. ABERTA: teto de 99; Edição 1/1: estoque 1.
2. Edição esgotada (`stockStore` a 0): pílula desabilitada com texto "Esgotado"; NFT todo esgotado: "COMPRAR" desabilitado.
3. Trocar de edição volta a quantidade para 1 e muda o preço; edição via teclado (setas no grupo).
4. Tudo já no carrinho: "COMPRAR" só navega a `/carrinho` (sem `POST`); botão de carrinho `[m]` desabilitado e a mensagem "Você já tem todas as unidades disponíveis no carrinho".

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.

# 13-071 — Pagamento: formulário, rascunho, "Usar outra carteira?" e carteiras salvas mobile

**Status:** concluído
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001, 13-010
**Toca:** `tests/e2e/checkout-draft-wallets-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T6
**Origem:** 11-020 (Formulário e rascunho, "Usar outra carteira?", Mobile: carteiras salvas)

Regras: 13-001.

## Casos
1. Validação de todos os campos (limites do 13-060), vazio só acusa no envio, foco no primeiro erro; observação com mais de 500 caracteres.
2. Rascunho restaura valores, modo, observação, provedor e rede depois de `reload`; rascunho de **outro** usuário é descartado; modo `secondary` restaurado sem secundária volta a `primary`; usuário **sem principal** (formulário pré-preenchido pelo perfil).
3. "Usar outra carteira?": "Carteira secundária" (com e sem secundária cadastrada); "Preencher outra carteira" limpa; o checkbox vem desmarcado; texto "Substituir a carteira secundária" com aviso quando já existe. Marcado: `PUT /wallets/secondary` **antes** do pedido e a falha dele impede o pedido; desmarcado: nenhum `PUT`; apelido vazio vira "Carteira secundária".
4. `[m]` sem nenhuma carteira (estado vazio, link e botão desabilitado); troca entre principal e secundária; "Trocar carteira" desconecta e limpa o provedor; "⋮" → "Editar carteira" e a volta preserva o rascunho; teclado no menu.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile` (itens `[m]`/`[d]` por `only`).

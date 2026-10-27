# 13-060 — Carteiras: validação de endereço, ENS, limites e obrigatórios

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001, 13-010
**Toca:** `tests/e2e/wallets-validation-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T5
**Origem:** 10-012 (Validação)

Regras: 13-001.

## Casos
1. Endereço com 39 e 41 caracteres, sem `0x`, com caractere não hexadecimal; maiúsculas e minúsculas aceitas.
2. "ENS ou carteira secundária": `0x...` válido, `nome.eth` válido e valor inválido; e-mail inválido.
3. Limites: nome de exibição (40), apelido (30), nome do perfil (40), código de indicação (3–20; letras, números, `_`, `-`) e ENS (3–63).
4. Campo obrigatório vazio só acusa no envio; Rede e Tipo de carteira sem seleção; foco no primeiro campo com erro.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.

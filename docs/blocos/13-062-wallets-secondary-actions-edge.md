# 13-062 — Carteiras: secundária ("Igual à principal", sem principal e "Tornar principal")

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low)
**Depende de:** 13-001, 13-010
**Toca:** `tests/e2e/wallets-secondary-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T5
**Origem:** 10-012 (Secundária)

Regras: 13-001.

## Casos
1. "Igual à carteira principal": desabilitado sem principal (motivo visível); copia **uma única vez** (editar a principal depois não muda a secundária); copiar sobre formulário já editado sobrescreve sem confirmar; o rádio some quando há secundária.
2. Secundária sem principal: aviso "Cadastre a carteira principal primeiro."; "Adicionar" com foco; foco em "Adicionar" ao remover.
3. "Tornar principal" desabilitado com alterações não salvas em qualquer dos dois formulários; a troca preserva os `id` e troca só o `slot`.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.

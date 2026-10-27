# 12-005 — Ícone "Thank you" do recibo

**Status:** cancelado (decisão Q2 do usuário, 2026-10-26)
**Fluxo / subitem:** Confirmação › 3 (recibo)
**Lote:** — (nenhum)

## Motivo
O usuário escolheu usar o `MailOpenIcon` do `lucide-react` (já é dependência do projeto) no lugar de exportar o SVG do Figma. Não há asset novo nem alteração no `SvgIcon.tsx`. O ícone é usado direto no `OrderReceipt` (12-009), que não depende mais deste bloco.

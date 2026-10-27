# 12-008 — `OrderDialog` (moldura do modal) e tipos da página

**Status:** pendente
**Fluxo / subitem:** Confirmação › 1, 6
**Depende de:** — (decisões Q1 e Q6)
**Toca:** `src/components/shared/OrderDialog.tsx` (novo), `src/pages/OrderConfirmation/viewProps.ts` (novo)
**Paralelo:** pode rodar com os lotes A, B e C da onda 1. Os blocos 12-013 e 12-014 esperam este (só os tipos e a moldura).
**Lote:** D

## Objetivo
A moldura do modal da Confirmação no desktop (fundo opaco, topo ancorado, faixa inferior, X) e os tipos/funções compartilhados pelas telas desktop e mobile.

## Arquivos
- criar: `src/components/shared/OrderDialog.tsx`
- criar: `src/pages/OrderConfirmation/viewProps.ts`

## Referências
- docs/fluxos/confirmacao.md subitens 1 e 6; docs/arquitetura/rotas.md#login-cadastro-e-confirmação-modal-no-desktop-página-no-mobile; docs/qualidade/acessibilidade.md (diálogos)
- Padrão: `src/components/shared/AuthDialog.tsx` (rota como modal, `rememberOpener`, `onOpenAutoFocus`, `showCloseButton={false}`, `overlayClassName`), `src/components/ui/dialog.tsx`
- Captura `docs/design/telas/desktop-confirmacao.png` (1:1, 1440 × 1657)

## Medidas do Figma (desktop)
- Fundo da página **inteiro em `#140d0a` = `background`, opaco** (sem nada visível do Pagamento): `overlayClassName="bg-background"`.
- Modal: x 431–1009 = **578 px** de largura, **y 166–987** (821 px de altura com a faixa), fundo `card`, **sem raio**, faixa inferior de **10 px** `primary` (`border-b-10`, como o `AuthDialog`). Topo a **166 px**; com viewport baixa o modal sobe e rola por dentro: `top-[clamp(16px,calc(100dvh-837px),166px)]`, `max-h-[calc(100dvh-2rem)]`, `overflow-y-auto`.
- X de fechar: glifo de 12 × 13 px com o centro a **24 px da borda direita** e **25 px do topo** do modal, `primary` (`SvgIcon name="x"`), alvo de 44 × 44 px.
- Linhas horizontais de 1 px `primary` em y 322 (abaixo do título) e y 388 (abaixo da faixa de dados) correm de ponta a ponta do modal; são desenhadas pelo `OrderReceipt` (12-009).

## Instruções
1. `OrderDialog.tsx`: props `{ title: string; onClose: () => void; children: ReactNode; className?: string }`.
   - `Dialog open` com `onOpenChange(false)` → `onClose()` (X, Esc e clique fora levam à Início; quem decide o destino é a página).
   - `DialogContent` com `showCloseButton={false}`, `aria-describedby={undefined}`, largura `w-[578px] max-w-[calc(100%-2rem)]`, `gap-0 p-0 rounded-none border-b-10`, `translate-y-0` e o `top` acima.
   - **Um único `h1` persistente**: `<DialogTitle asChild><h1 tabIndex={-1} className="sr-only">{title}</h1></DialogTitle>`. Ele é o **mesmo nó** em todos os estados; só o texto muda ("Confirmando pagamento", "Pedido confirmado", "Pagamento recusado"), então o foco que está nele **não se move** quando o pedido muda de estado (docs/api-mock/realtime.md: tempo real nunca move o foco).
   - `onOpenAutoFocus`: `preventDefault()` e foca o `h1` achado com `event.currentTarget.querySelector('h1')` (como o `AuthDialog` faz com o `input`; sem `ref`). `rememberOpener`/`onCloseAutoFocus` como no `AuthDialog` (se ele expuser a lógica, reaproveitar; senão copiar o padrão: guardar o elemento que abriu e devolver o foco só se ainda estiver na página). Se o modal abriu direto pela URL (nada a devolver), não fazer nada.
   - Botão X: `DialogClose asChild` + `Button variant="ghost" size="icon" aria-label="Fechar"`, posicionado como acima.
2. `src/pages/OrderConfirmation/viewProps.ts` (sem JSX):
```ts
export type OrderViewProps = { order: Order; isSlow: boolean; onClose: () => void }
export function orderTitle(status: OrderStatus): string   // 'Confirmando pagamento' | 'Pedido confirmado' | 'Pagamento recusado'
```
   (`OrderStatus` é o **tipo** de `@/types/order`; o componente `OrderStatus` do 12-010 importa o tipo com outro nome local.)
3. Só tokens de cor; `cn`; Radix com `data-[state=…]`; sem hexadecimal.
4. Fechamento: prettier nos 2; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0 (se falhar por arquivo de **outro** agente em andamento, esperar e repetir, sem mexer nele). Commit só dos 2: `git commit -m "12-008: OrderDialog e viewProps" -- <arquivos>`.

## Critérios de aceite
- [ ] A 1440 px de largura e 1657 de altura: modal de 578 px com topo em 166 px e fundo da página `background` opaco; a 900 px de altura o modal sobe (topo ≈ 63 px) e nada fica cortado.
- [ ] Esc e X chamam `onClose` uma vez; o foco entra no `h1` ao abrir e **não sai dele** quando só o texto do título muda.
- [ ] Nome acessível do diálogo = título do estado; foco preso dentro do modal.
- [ ] Sem cor hexadecimal fora dos tokens; sem `any`, `as`, `!`, `@ts-ignore` nem `eslint-disable`; sem `ref` lido no render.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Visual e foco no 12-017/12-018 e no 12-019.

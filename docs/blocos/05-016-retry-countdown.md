# 05-016 — RetryCountdown

**Status:** pendente
**Fluxo / subitem:** Login › 3 (bloqueio de 30 s: contagem regressiva acessível)
**Depende de:** 03-010
**Depende de decisão:** pergunta 18 do relatório da fase 05 (componente não desenhado)

## Objetivo
Criar a contagem regressiva do bloqueio por tentativas ("Tente novamente em 30 segundos") que avisa quando o prazo acaba.

## Arquivos
- criar: `src/components/shared/RetryCountdown.tsx`

## Referências
- docs/fluxos/login.md (subitem 3: contagem regressiva acessível; desabilita o botão até acabar) e docs/design/componentes.md (`RetryCountdown`: LO, não desenhado)
- docs/qualidade/acessibilidade.md (assertive só para erro; nada de anunciar a cada segundo)
- `src/contexts/liveAnnouncer.ts` (`useLiveAnnouncer`)

## Valores propostos (confirmar com o usuário)
Linha de texto no padrão do erro de formulário: `CircleAlertIcon` de 14 px + texto em `text-sm text-destructive`, no topo do formulário (no lugar da mensagem de credenciais).

## Instruções
1. Props: `seconds: number` (valor inicial), `onFinish: () => void`, `className?`. Quem usa troca a `key` para reiniciar.
2. Calcula o fim como `Date.now() + seconds * 1000` ao montar e, a cada 250 ms, `remaining = Math.max(0, Math.ceil((fim - Date.now()) / 1000))` (baseado em `Date.now`, não em contar ticks, para não derivar e para o `page.clock` do Playwright funcionar). Limpa o intervalo ao desmontar.
3. Renderiza `role="timer"` (não é região `aria-live`: o leitor de tela **não** lê cada segundo) com o texto "Tente novamente em N segundo(s)." (singular com 1).
4. Ao montar: `announce('Muitas tentativas. Tente novamente em N segundos.', 'assertive')` **uma vez**. Ao chegar a 0: `announce('Você já pode tentar novamente.', 'polite')` uma vez e `onFinish()`.
5. Fechamento: `npx prettier --write src/components/shared/RetryCountdown.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/shared/RetryCountdown.tsx` e `git commit -m "05-016: RetryCountdown"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; export nomeado `RetryCountdown`; intervalo limpo no desmontar (também em StrictMode).
- [ ] Contagem 30 → 0, sem pular nem ficar negativa; `onFinish` chamado **uma vez**.
- [ ] Exatamente duas mensagens anunciadas (início e fim), nunca por segundo.
- [ ] Sem cor hexadecimal, `oklch()` ou `rgb()`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Coberto no 05-043 (com `page.clock`) e no 05-047 (axe com a contagem visível).

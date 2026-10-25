# 03-010 — LiveAnnouncerContext

**Status:** pendente
**Fluxo / subitem:** Fase 03 › Acessibilidade
**Depende de:** Fase 02

## Objetivo
Criar o anunciador de mensagens para leitores de tela (regiões `aria-live` polite e assertive).

## Arquivos
- criar: `src/contexts/LiveAnnouncerContext.tsx`, `src/contexts/liveAnnouncer.ts`, `src/components/shared/LiveRegion.tsx`

## Referências
- docs/arquitetura/estado.md#liveannouncercontext
- docs/qualidade/acessibilidade.md (feedback acessível, tempo real)
- docs/design/componentes.md (`LiveRegion`)

## Instruções
1. `LiveRegion.tsx`: componente que renderiza uma `div` visualmente oculta (`sr-only`), com `role="status"` + `aria-live="polite"` ou `role="alert"` + `aria-live="assertive"`, `aria-atomic="true"`, recebendo `message`.
2. `liveAnnouncer.ts`: o objeto de contexto (`createContext`), o tipo `Politeness` e o hook `useLiveAnnouncer()` (lança erro claro fora do provider). Separado do `.tsx` para respeitar a regra `react-refresh/only-export-components`.
3. `LiveAnnouncerContext.tsx`: `LiveAnnouncerProvider` com duas `LiveRegion` (polite e assertive) e `announce(message, politeness = 'polite')`. Para que o leitor de tela releia a mesma mensagem repetida, limpar a região e escrever de novo no quadro seguinte (`requestAnimationFrame`/timeout curto). O `announce` tem identidade estável (`useCallback`).
4. Mudança de foco: o anunciador **nunca** move o foco.
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/contexts/LiveAnnouncerContext.tsx src/contexts/liveAnnouncer.ts src/components/shared/LiveRegion.tsx` e `git commit -m "03-010: LiveAnnouncerContext"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`.
- [ ] Camadas respeitadas (pastas.md): `services/api` não conhece React; `components/shared` e `contexts` não chamam Axios direto; nada importa de `src/mocks/` além de `main.tsx`.
- [ ] Mensagens ao usuário em PT-BR; código e nomes em inglês.
- [ ] `announce` com a mesma mensagem duas vezes seguidas atualiza a região duas vezes.
- [ ] Regiões fora da tela, mas presentes na árvore de acessibilidade.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Testado no 03-019 (`getByRole('status')`/`getByRole('alert')` recebem o texto; foco não muda).

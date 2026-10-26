# 04-014 — ErrorState

**Status:** concluído
**Fluxo / subitem:** Fase 04 › Estados
**Depende de:** 03-020

## Objetivo
Criar o componente de erro de carregamento reutilizável, com o botão "Tentar novamente".

## Arquivos
- criar: `src/components/shared/ErrorState.tsx`

## Referências
- docs/design/componentes.md (Estados: `ErrorState`) e docs/arquitetura/rotas.md (`errorComponent` por rota com `ErrorState`)
- docs/qualidade/acessibilidade.md (erro anunciado de forma assertiva)
- Capturas: **sem captura** (estado não desenhado). Mesmo padrão do `EmptyState` (04-013), com ícone `destructive`.

## Instruções
1. Props: `title?: string` (padrão `'Algo deu errado'`), `message?: string` (padrão `'Não foi possível carregar este conteúdo. Verifique sua conexão e tente novamente.'`), `onRetry?: () => void`, `retryLabel?: string` (padrão `'Tentar novamente'`), `retrying?: boolean`, `as?: 'h1' | 'h2' | 'h3'` (padrão `'h2'`), `className?`.
2. Estrutura igual à do `EmptyState`, com o ícone `TriangleAlertIcon` (lucide) em `text-destructive` dentro do círculo `bg-card` de 64 px. O container leva `role="alert"` (anuncia o erro ao aparecer).
3. Botão (`Button` `variant="default"`) só aparece com `onRetry`. Com `retrying`: `aria-busy="true"`, `aria-disabled="true"`, o `onClick` não dispara e o texto vira "Tentando novamente…" (não usar `disabled`, para o foco não se perder).
4. O texto do erro vem sempre por prop ou pelo padrão: o componente **não** mostra mensagem técnica nem `ApiError.code`.
5. Fechamento: `npx prettier --write src/components/shared/ErrorState.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/shared/ErrorState.tsx` e `git commit -m "04-014: ErrorState"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; export nomeado `ErrorState`.
- [ ] Sem cor hexadecimal, `oklch()` ou `rgb()`.
- [ ] `role="alert"` no container; botão acessível por teclado e com foco visível.
- [ ] `retrying` bloqueia cliques repetidos e mantém o foco no botão.
- [ ] O erro não depende só de cor (ícone + título + texto).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Probe **não commitado**: padrão, personalizado, com `retrying`; capturas 1440×900 e 414×896; axe sem violações graves.

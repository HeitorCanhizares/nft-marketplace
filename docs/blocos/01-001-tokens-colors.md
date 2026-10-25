# 01-001 — Tokens de cor em globals.css

**Status:** pendente
**Fluxo / subitem:** Fase 01 › Tokens (cores)
**Depende de:** Fase 00 (tag `fase-00-setup`)

## Objetivo
Trocar as variáveis padrão do shadcn pelos tokens de cor do Figma, em tema único escuro.

## Arquivos
- alterar: `src/styles/globals.css`

## Referências
- docs/design/tokens.md (valores confirmados no Figma, frame `2:2`, em 2026-10-25)
- docs/decisoes.md (tema único escuro; Tailwind v4)

## Instruções
1. Em `globals.css`, **apagar** o bloco `.dark`, o `@custom-variant dark` e as variáveis `--chart-*` e `--sidebar-*` (e os `--color-*` correspondentes do `@theme inline`). Manter os `@import` de `tailwindcss`, `tw-animate-css` e `shadcn/tailwind.css`.
2. Definir em `:root` os valores abaixo e expor cada um em `@theme inline` como `--color-<nome>: var(--<nome>)`:

| Token | Valor | Origem |
|---|---|---|
| `--background` | `#140d0a` | Figma `color/ink` |
| `--foreground` | `#f5f1eb` | Figma `color/foreground` |
| `--card`, `--popover` | `#241612` | Figma `color/surface-card` |
| `--card-foreground`, `--popover-foreground` | `#f5f1eb` | = foreground |
| `--primary` | `#d28a4c` | Figma `color/primary` |
| `--primary-foreground` | `#140d0a` | = background |
| `--secondary`, `--accent`, `--muted` | `#2f1d15` | surface-2 (botão de quantidade, hover); estimado nas capturas |
| `--secondary-foreground`, `--accent-foreground` | `#f5f1eb` | = foreground |
| `--muted-foreground` | `#cfb28c` | Figma `color/text-secondary` |
| `--border`, `--input` | `#3f2319` | Figma `color/border` |
| `--ring` | `#d28a4c` | = primary |
| `--surface-3` | `#38220f` | Figma `color/surface-dark` (faixa do rodapé) |
| `--border-strong` | `#432b1a` | estimado nas capturas (linha do cabeçalho) |
| `--border-soft` | `#55321f` | Figma `color/border-soft` |
| `--price` | `#e89b55` | Figma `color/text-accent` |
| `--tan` | `#b39463` | Figma `color/secondary` |
| `--required` | `#f0805f` | capturas (asterisco) |
| `--destructive` | `#ef6b5b` | **proposto** (não existe no Figma; depende da aprovação do usuário) |
| `--success` | `#7fb069` | **proposto** (idem) |

3. Expor em `@theme inline` também `--color-surface-3`, `--color-border-strong`, `--color-border-soft`, `--color-price`, `--color-tan`, `--color-required`, `--color-destructive`, `--color-success`.
4. Gradiente do mobile: `--gradient-primary: linear-gradient(135deg, #d28a4c 0%, #8a5a33 100%)` (**proposto**, amostrado na captura do mobile) e utilitário `bg-gradient-primary` via `@utility`.
5. Adicionar `color-scheme: dark` em `:root`.
Commit: `git add src/styles/globals.css` e `git commit -m "01-001: tokens de cor"`.

## Critérios de aceite
- [ ] Todos os tokens da tabela existem em `:root` e em `@theme inline`.
- [ ] Não restam `.dark`, `--chart-*` nem `--sidebar-*`.
- [ ] Nenhum outro hexadecimal no arquivo além dos da tabela e do gradiente.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Teste de contraste (Playwright, `tests/e2e/tokens.spec.ts`, escrito pelo Sonnet): `foreground`, `muted-foreground`, `price` e `primary` sobre `background` e `card` ≥ 4.5:1; `primary-foreground` sobre `primary` ≥ 4.5:1; `destructive` e `success` sobre `card` ≥ 4.5:1; `ring` sobre `background` ≥ 3:1.
- Pendência do Opus: atualizar `docs/design/tokens.md` com os valores confirmados.

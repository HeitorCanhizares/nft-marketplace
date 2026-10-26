# 06-041 — `FilterOptionList` (grupo de filtro de uma opção)

**Status:** concluído
**Fluxo / subitem:** Início › 6 (Coleções e Rede: uma opção por grupo, aplicada na hora, com contagem)
**Depende de:** 01-004
**Depende de decisão:** pergunta 3 do relatório da fase 06 (opções com contagem 0)

## Objetivo
Criar a lista de opções de um grupo de filtro (Coleções ou Rede): clicar escolhe, clicar na ativa remove, cada opção mostra a contagem.

## Arquivos
- criar: `src/components/shared/FilterOptionList.tsx`

## Referências
- docs/fluxos/inicio.md (subitem 6: "Clicar na opção ativa remove o filtro... Opção ativa: cor + indicador visual (não só cor)") e docs/qualidade/acessibilidade.md (estado que não depende só de cor; grupos com `fieldset`/`legend`)
- Capturas 1:1 `desktop-inicio.png` (painel x 120–429): título do grupo **18 px negrito** (x 140), opções de **15 px** `muted-foreground` com o texto em x 152 e a contagem `(33)` em negrito alinhada à direita (termina em x 410), **passo de 40 px** entre opções; ativa em `primary` (a captura mostra "Arte digital" ativa)

## Instruções
1. Props: `legend: string`, `options: { id: string; name: string; count: number }[]`, `value?: string`, `onChange: (id: string | undefined) => void`, `className?`.
2. Estrutura: `<fieldset>` com `<legend className="text-lg font-bold">`; `<ul>` com um `<li>` por opção, cada um com um `Button` (`variant="ghost"`, `type="button"`, `h-10 w-full justify-between px-3 -mx-3 text-body`) com `aria-pressed={ativa}`.
3. Conteúdo do botão: à esquerda o nome; à direita `(count)` em `font-bold`. **Opção ativa:** texto em `text-primary`, `font-bold`, um `CheckIcon` de 14 px **na calha à esquerda** (dentro dos 12 px de recuo, o texto continua em x 152) e uma barra de 2 px `bg-primary` na borda esquerda do botão. Clique na ativa chama `onChange(undefined)`; em outra chama `onChange(id)`.
4. **Contagem 0 e não ativa:** `aria-disabled="true"`, `text-tan`, clique ignorado (não é `disabled`, para continuar focável). A ativa nunca fica desabilitada.
5. O nome acessível do botão: `"<nome>, <count> NFTs"` via `aria-label` (a contagem entre parênteses só é visual).
6. Fechamento: `npx prettier --write src/components/shared/FilterOptionList.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/shared/FilterOptionList.tsx` e `git commit -m "06-041: FilterOptionList"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; sem cor hexadecimal.
- [ ] Ativa: cor + check + barra (não só cor); `aria-pressed` coerente; clicar de novo remove.
- [ ] Passo de 40 px, texto em x 152 e contagem à direita como na captura (tolerância de 2 px).
- [ ] Contraste de `muted-foreground` e `tan` sobre `card` ≥ 4,5:1 (se `tan` não alcançar, **parar e relatar**).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Probe **não commitado** com as 9 coleções do seed; comparado com a captura; axe.

# 06-051 — `LoadMoreButton`

**Status:** pendente
**Fluxo / subitem:** Início › 3 (mobile: botão "Carregar mais" no fim da grade)
**Depende de:** 01-004

## Objetivo
Criar o botão "Carregar mais" do fim da grade no mobile, com estado de carregamento.

## Arquivos
- criar: `src/components/shared/LoadMoreButton.tsx`

## Referências
- docs/fluxos/inicio.md (subitem 3: "botão 'Carregar mais' no fim da grade, que acrescenta a próxima página abaixo") e docs/design/componentes.md (`LoadMoreButton`: "com estado de carregamento e anúncio do total carregado"; o anúncio é do 06-053)
- `src/components/shared/authStyles.ts` (`AUTH_SUBMIT_CLASS`: botão mobile `h-11.25 w-full max-lg:h-15 max-lg:rounded-4xl`; o botão principal mobile é liso, sem gradiente). **Não desenhado** no Figma: seguir o padrão

## Instruções
1. Props: `onClick: () => void`, `loading?: boolean`, `className?`.
2. `Button` (variante `default`) `h-12.5 w-full max-w-xs rounded-4xl text-base` centralizado (`mx-auto`); texto "Carregar mais"; com `loading`: texto "Carregando…", `aria-busy="true"`, `aria-disabled="true"` (clique ignorado), **sem** trocar de lugar nem de largura.
3. Só mobile: quem usa não renderiza no desktop (a página decide). Export nomeado.
4. Fechamento: `npx prettier --write src/components/shared/LoadMoreButton.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/shared/LoadMoreButton.tsx` e `git commit -m "06-051: LoadMoreButton"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; sem cor hexadecimal.
- [ ] Teclado: Enter/Espaço disparam; durante o carregamento não dispara de novo.
- [ ] 50 px de altura, largura máxima de 320 px, centralizado; sem rolagem horizontal em 320 px.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Probe **não commitado** nos dois estados em 414×896 e 320×700; axe.

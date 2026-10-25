# 00-012 — Instalar embla-carousel e sonner

**Status:** pendente
**Fluxo / subitem:** Fase 00 › A7 (carrossel e toast do shadcn)
**Depende de:** 00-011

## Objetivo
Instalar as duas bibliotecas de UI aprovadas na decisão A7 que os componentes `carousel` e `sonner` do shadcn usam.

## Arquivos
- nenhum arquivo de código; só `package.json` e `package-lock.json`

## Referências
- docs/decisoes.md (A7)
- docs/design/componentes.md (onde carrossel e toast aparecem)

## Instruções
1. `npm install embla-carousel-react sonner`.
2. **Não** rodar `npx shadcn add carousel sonner` (fase 01) e não importar os pacotes.
3. Commit: `git add package.json package-lock.json` e `git commit -m "00-012: instala embla-carousel-react e sonner"`.

## Critérios de aceite
- [ ] Os dois pacotes em `dependencies`, sem aviso de peer.
- [ ] Nenhum arquivo em `src/` alterado.

## Verificação (Sonnet)
- `npm ls embla-carousel-react sonner` limpo.
- `npm run typecheck && npm run build` → exit 0.

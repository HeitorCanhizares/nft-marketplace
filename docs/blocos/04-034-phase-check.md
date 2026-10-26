# 04-034 — Validação final e checkpoint da fase 04

**Status:** pendente
**Responsável:** Sonnet
**Fluxo / subitem:** Fase 04 › Checkpoint
**Depende de:** 04-001 a 04-033

## Objetivo
Validar o layout e os estados juntos, comparar com as capturas do Figma e entregar o resumo ao usuário.

## Arquivos
- nenhum arquivo commitado além dos do 04-033

## Referências
- docs/blocos/README.md (checkpoint e tag por fase), docs/design/telas/, docs/qualidade/

## Instruções
1. Clone limpo: `npm ci`; `format:check`, `lint`, `typecheck`, `build`, `build:test`, `test:e2e` e `lhci`.
2. Probe **não commitado** (`src/routes/_probe.tsx`, apagado antes do commit) com: cabeçalho anônimo, logado, carregando e com contador 0/6/120; busca aberta; rodapé; barra mobile; `MobileTopBar`; `Breadcrumb`; `ProfileLayout`; `EmptyState`, `ErrorState` e os 2 skeletons; os 6 ícones; Dialog, Sheet e Select com os ícones novos; um toast. Capturas desktop (1440×900, 1024×768) e mobile (414×896, 320×700) e comparação com: topo de `desktop-inicio.png`, `desktop-carrinho.png`, `desktop-perfil.png`, rodapé de `desktop-carrinho.png`, `mobile-inicio.png` (barra), `mobile-carrinho.png` e `mobile-pagamento.png` (barra superior).
3. Conferir:
   - `src/assets/icons/` com exatamente os 6 SVGs do 04-002 (mais os 5 de marca, se o usuário os forneceu) e `SvgIcon.tsx`;
   - nenhuma cor literal em `src/components/layout`, `src/components/shared` e `src/assets/icons/SvgIcon.tsx` (`grep` por `#`, `oklch(` e `rgb(`);
   - `src/routes/` com as 12 rotas esperadas; `grep -r __kurio dist/` vazio no build de produção;
   - só `main.tsx` importa de `mocks/`; `components/layout` e `components/shared` não importam `services/api`;
   - rolagem horizontal inexistente em 320, 414, 1024, 1280 e 1440 px;
   - pendências da fase 01 cumpridas: `<Toaster />` embaixo à direita no desktop e setas do carrossel sem rolagem horizontal (o `overflow-x-clip` do `AppShell` contém o excesso; conferir com um carrossel no probe);
   - notas do LHCI (referência das fases anteriores: mobile 83–85, LCP 2,8 s): ver se o `AppShell` piorou.
4. Entregar ao usuário: resumo, resultados, capturas e como ver no navegador. Perguntar: (a) os valores propostos nos blocos (medidas lidas nas capturas, tamanho do título do `MobileTopBar`, recorte da barra mobile, largura do campo de busca, ponto do item ativo da barra mobile, `mt-20` do rodapé); (b) o comportamento da busca aberta; (c) as rotas provisórias; (d) o `staticData` para rodapé, barra inferior e título; (e) a mudança no `container-page`.
5. **Só com o OK do usuário:** `git tag fase-04-layout-estados`. Apagar o probe antes. Sem push.

## Critérios de aceite
- [ ] Todos os comandos do item 1 com exit 0 no clone limpo.
- [ ] Capturas dentro da tolerância das tabelas de medidas dos blocos 04-019 a 04-028.
- [ ] Usuário aprovou o checkpoint e a tag foi criada.

## Verificação (Sonnet)
- É o próprio bloco de verificação; se algo falhar, o Sonnet devolve o bloco correspondente ao Haiku.

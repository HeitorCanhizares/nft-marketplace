# 04-033 — Testes do layout e dos estados

**Status:** concluído
**Responsável:** Sonnet (o Haiku não escreve testes)
**Fluxo / subitem:** Fase 04 › Testes
**Depende de:** 04-001 a 04-032

## Objetivo
Provar o `AppShell`, o cabeçalho, o rodapé, a barra mobile, o menu do usuário, o menu lateral do perfil, a 404 e a acessibilidade de navegação com Playwright (desktop e mobile).

## Arquivos
- criar: `tests/e2e/layout.spec.ts`
- alterar (infraestrutura de teste, só o Sonnet): `src/app/TestBridge.tsx` (expor `toast` do `sonner` em `window.__kurio`, para disparar um toast; continua só em `MODE === 'test'`) — **confirmar com o usuário** (pergunta 13 do relatório da fase 04)

## Referências
- docs/qualidade/testes.md (seletores por papel, sem `data-testid`; axe só `serious` e `critical`; overflow em 320 px)
- `tests/e2e/helpers.ts` (`openApp`, `useHandler`, `bootWithHandlers`, `USER`) e o padrão de login do `app-base.spec.ts` (handler de `POST /api/auth/login` + `window.__kurio.auth.signIn`)

## Instruções
O Sonnet escreve, sem `data-testid` nem CSS. Testes marcados **[d]** rodam só no projeto `desktop` e **[m]** só no `mobile` (`test.skip` por `testInfo.project.name`).
1. **[d] Estrutura:** `banner` com `navigation` "Navegação principal" e links Início, Mercado; Criadores e Aprenda com `aria-disabled="true"`; `contentinfo` presente; link "Pular para o conteúdo" é o primeiro foco (Tab) e Enter leva o foco ao `main`.
2. **[d] Item ativo:** em `/` Início tem `aria-current="page"`; em `/carrinho`, `/pagamento`, `/nft/x` e `/pedido/x` o ativo é Mercado; em `/perfil/dados` e `/perfil/carteiras` nenhum.
3. **[d] Desabilitados:** Tab até "Criadores" mostra "Em breve" (`getByRole('tooltip')`); clicar não muda a URL.
4. **[d] Busca:** "Abrir busca" abre o campo "Buscar NFTs e coleções" já focado; o menu principal fica invisível; Esc fecha e o foco volta ao botão; digitar "ape" + Enter vai para `/?q=ape#catalogo` e fecha; campo vazio + Enter não navega.
5. **[d] Sessão no cabeçalho:** anônimo → link "Entrar" com `href` `/entrar?redirect=…`; com `kurio:session` e `GET /api/auth/session` demorado, enquanto `loading` **não** existe "Entrar" nem o menu; depois da resposta, aparece o menu "Menu de <nome>".
6. **[d] UserMenu (logado via handlers):** Enter abre; itens "Dados do perfil", "Carteiras" e "Sair"; setas navegam; Esc fecha e o foco volta ao gatilho; "Dados do perfil" vai para `/perfil/dados`; "Sair" vai para `/`, o estado vira `anonymous` e o anúncio "Você saiu da sua conta" aparece em `getByRole('status')` uma vez.
7. **[d] Rodapé:** presente em `/` e `/carrinho`, **ausente** em `/perfil/dados` (`staticData.footer: false`); newsletter: campo `disabled`, botão "Enviar" `aria-disabled`; clicar em "Arte digital" vai para `/?colecao=arte-digital`; links `disabled` ("Atividade", redes sociais) não navegam; textos principais iguais aos do Figma.
8. **[d] Perfil:** `complementary` "Menu do perfil" em `/perfil/dados` e `/perfil/carteiras`; ativo com `aria-current="page"`; 5 itens `aria-disabled`; "Sair" desloga como no item 6.
9. **[m] Estrutura mobile:** sem `banner` e sem `contentinfo` visíveis; em `/` a `navigation` "Navegação principal" com 5 itens; o central é `aria-disabled`; "Favoritos" → `/?favoritos=1` (e fica ativo, Início não); "Carrinho" → `/carrinho` **sem** barra inferior; "Perfil" → `/perfil` com barra e aba ativa; a barra tem 96 px de altura e o conteúdo da Início tem espaço para ela.
10. **[d+m] 404:** `/rota-que-nao-existe` mostra `heading` "Página não encontrada" e "Voltar para a Início" (vai para `/`), dentro do `AppShell`.
11. **[d+m] Foco e título:** carga inicial deixa `document.activeElement` fora do `h1`; navegar por link de `/` para `/carrinho` foca o `h1` e `document.title` é "Carrinho | Kurio"; de volta a `/` o título é "Kurio"; trocar só o search (`/?q=a` → `/?q=b`, via `history.pushState` do roteador) **não** move o foco.
12. **[d+m] Toaster:** com o `toast` exposto pela ponte, disparar um toast e conferir a posição pelo `boundingBox` do toast: no desktop (1440) embaixo à direita; em 414 embaixo, centralizado e **acima** da barra inferior em `/`; reduzir o desktop para 1023 px muda para centro.
13. **[d+m] Overflow:** `document.documentElement.scrollWidth <= innerWidth` em `/`, `/carrinho` e `/perfil/dados` (logado) nas larguras 320, 414, 1024, 1280 e 1440.
14. **[d+m] Axe:** sem violações `serious`/`critical` em `/`, `/carrinho`, `/perfil/dados` (logado), na 404, com o UserMenu aberto e com a busca aberta (desktop).
15. **[d] `useMediaQuery`:** redimensionar de 1023 para 1024 px troca de barra inferior (mobile) para cabeçalho (desktop) sem recarregar.
Fechamento: `npm run lint && npm run format:check && npm run typecheck` → exit 0. Commit: `git add tests/e2e/layout.spec.ts src/app/TestBridge.tsx` e `git commit -m "04-033: testes do layout e dos estados"`.

## Critérios de aceite
- [ ] Todos passam nos projetos `desktop` e `mobile`, duas execuções seguidas.
- [ ] Nenhum `data-testid` nem seletor CSS (exceção justificada em comentário, se o Sonnet não achar alternativa acessível).
- [ ] Os testes das fases 00 a 03 continuam verdes.

## Verificação (Sonnet)
- `npm run test:e2e` → todos passando; `npm run lint && npm run format:check && npm run typecheck && npm run build` → exit 0.
- Componentes sem página consumidora ainda (`Breadcrumb`, `MobileTopBar`, `ErrorState`, `EmptyState` fora da 404, skeletons, `FormSkeleton`): cobertos pelo probe **não commitado** (capturas e axe) e pelos testes dos fluxos das fases 05–11, onde ganham a baseline visual.

# 05-049 — Validação final e checkpoint da fase 05

**Status:** pendente
**Responsável:** Sonnet
**Fluxo / subitem:** Fase 05 › Checkpoint
**Depende de:** 05-001 a 05-048

## Objetivo
Validar Login, Cadastro, sessão, expiração, logout e rotas protegidas juntos, comparar com as capturas do Figma e entregar o resumo ao usuário.

## Arquivos
- nenhum arquivo commitado além dos dos blocos anteriores

## Referências
- docs/blocos/README.md (checkpoint e tag por fase), docs/design/telas/ (as 4 capturas), docs/qualidade/

## Instruções
1. Clone limpo: `npm ci`; `format:check`, `lint`, `typecheck`, `build`, `build:test`, `test:e2e` (desktop e mobile) e `lhci`.
2. Fluxo manual no navegador (`npm run dev` e `npm run preview`) com as credenciais do seed e um cadastro novo: login, `redirect`, fechar o modal, cadastro com conflito, bloqueio, aviso de expiração (TTL curto no `.env` **temporário**, nunca commitado), logout, troca de usuário, rotas protegidas deslogado, mobile em 414 e 320 px.
3. Conferir:
   - nenhuma cor literal em `src/components/shared/{AuthForm,AuthTabs,AuthDialog,LoginForm,SignupForm,PasswordInput,PasswordRequirements,RetryCountdown,TextDivider,SocialAuthButtons,SessionExpiryBanner,FormField}.tsx` e em `src/pages/{SignIn,SignUp,Home}` (`grep` por `#`, `oklch(` e `rgb(`);
   - `grep -r __kurio dist/` vazio no build de produção;
   - camadas: só `main.tsx` importa de `mocks/`; `components/shared` e `components/layout` não importam `services/api` (só `services/http/ApiError`); `src/mocks/**` não importa nada do app além de `types`, `schemas` e `lib`;
   - nenhuma senha em texto no código do mock, na documentação nem no IndexedDB (inspecionar `usersStore`); senhas de teste só em `tests/e2e/fixtures.ts`;
   - `git status` limpo e `src/routeTree.gen.ts` sem mudanças além das esperadas;
   - LHCI (referência da fase 04: mobile 84–86, LCP ≈ 3,05 s): ver se a fase 05 piorou.
4. Entregar ao usuário: resumo, resultados, as imagens da baseline lado a lado com o Figma e como ver no navegador. Perguntar: (a) as medidas e correções do Figma aceitas (lista do 05-048); (b) o aviso de expiração (posição, texto); (c) os textos não desenhados (erros, requisitos, ajustes do carrinho, expiração); (d) o comportamento do bloqueio (5ª tentativa já bloqueia); (e) o foco ao fechar o modal; (f) a baseline visual.
5. **Só com o OK do usuário:** `git tag fase-05-login`. Sem push.

## Critérios de aceite
- [ ] Todos os comandos do item 1 com exit 0 no clone limpo.
- [ ] Capturas dentro da tolerância das tabelas de medidas dos blocos 05-013 a 05-024.
- [ ] Usuário aprovou a baseline e o checkpoint, e a tag foi criada.

## Verificação (Sonnet)
- É o próprio bloco de verificação; se algo falhar, o Sonnet devolve o bloco correspondente ao Haiku.

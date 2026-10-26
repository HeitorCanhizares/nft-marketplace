# 06-058 — Ajustar os testes antigos à Início real

**Status:** concluído
**Responsável:** Sonnet (o Haiku não escreve testes)
**Fluxo / subitem:** Início › efeito colateral nas fases 03 a 05
**Depende de:** 06-057

## Objetivo
Manter verde a suíte existente agora que `/` deixou de ser um `<h1>Kurio</h1>` provisório e passou a ter hero, catálogo e requisições reais.

## Arquivos
- alterar (só o Sonnet): os arquivos de `tests/e2e/` que quebrarem (esperado: `smoke.spec.ts`, `layout.spec.ts`, `mock-base.spec.ts`, talvez `app-base.spec.ts`, `login.spec.ts`, `signup.spec.ts`, `protected-routes.spec.ts`, `auth-a11y.spec.ts`)

## Referências
- docs/blocos/05-041 (mesmo procedimento) e docs/qualidade/testes.md
- Todas as páginas agora fazem `GET /cart` (contador do cabeçalho, 06-069 a 06-071) e o link do carrinho ganha `aria-label` "Carrinho, N itens" quando há itens. A Início real faz `GET /home`, `GET /nfts` e abre o socket; tem um `h1` ("Kurio", sr-only), o hero com bolinhas e conteúdo na barra inferior

## Instruções
1. Rodar `npm run test:e2e` e listar o que quebrou. **Esperado** (a lista real pode diferir):
   - testes que contavam `heading` ou `main` com texto exato do `<h1>` antigo (continua "Kurio"; só ajustar se mudou o escopo);
   - o axe de `/` em `smoke.spec.ts` e `layout.spec.ts` (agora tem muito mais conteúdo): se aparecer violação **real** na Início, **parar e devolver o bloco do componente** ao Haiku, nunca desligar a regra;
   - testes de overflow/estrutura mobile (`layout.spec.ts` item 9: "o conteúdo da Início tem espaço para a barra") e de foco/título (item 11: o `h1` "Kurio" continua focável);
   - testes de login/cadastro com o modal aberto sobre a Início (o fundo agora tem a Início inteira): `getByRole('heading', { level: 1 })` continua contando 1 por causa do modal inerte; conferir.
2. Handlers do mock continuam valendo; para testes que **não** tratam da Início, preferir o cenário `empty-catalog` só se a requisição de catálogo atrapalhar o objetivo do teste (não enfraquecer asserções).
3. Não enfraquecer nenhuma asserção para "passar": se algo quebrou por motivo diferente do esperado, **parar e relatar**.
4. Fechamento: `npm run lint && npm run format:check && npm run typecheck` → exit 0; `npm run test:e2e` **todo verde**. Commit: `git add tests/e2e` (só os arquivos alterados) e `git commit -m "06-058: ajustar testes à Início real"`.

## Critérios de aceite
- [ ] A suíte completa passa nos projetos `desktop` e `mobile`, duas execuções seguidas.
- [ ] Nenhuma asserção removida sem justificativa; nenhum `data-testid` nem seletor CSS novo.

## Verificação (Sonnet)
- `npm run test:e2e` → tudo verde; `npm run lint && npm run format:check && npm run typecheck && npm run build` → exit 0.

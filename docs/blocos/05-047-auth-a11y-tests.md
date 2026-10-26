# 05-047 — Acessibilidade do Login e do Cadastro (axe, teclado, 320 px)

**Status:** pendente
**Responsável:** Sonnet (o Haiku não escreve testes)
**Fluxo / subitem:** Login e Cadastro › acessibilidade (toda fase de fluxo termina com ela)
**Depende de:** 05-039, 05-043, 05-044

## Objetivo
Verificar a acessibilidade das duas telas: axe sem violações graves, teclado e foco do modal, ligação dos erros aos campos e ausência de rolagem horizontal em 320 px.

## Arquivos
- criar: `tests/e2e/auth-a11y.spec.ts`
- alterar (infraestrutura de teste, só o Sonnet): `tests/e2e/tokens.spec.ts` (acrescentar os pares `tan` sobre `card` e sobre `background` ≥ 4,5:1, usados no placeholder e no olho da senha)

## Referências
- docs/qualidade/acessibilidade.md e docs/qualidade/testes.md (Acessibilidade automatizada: axe em cada página e em cada modal aberto, sem violações `serious` ou `critical`; teclado; overflow em 320 px)
- `tests/e2e/layout.spec.ts` (`seriousViolations`, `box`, padrão de overflow)

## Instruções
O Sonnet escreve.
1. **axe** (`serious` e `critical` = 0), nos projetos que se aplicam: `/entrar` e `/cadastro` **[d]** com o modal aberto (desabilitar só `aria-hidden-focus`, falso positivo do `hideOthers` do Radix, como no 04-033) e **[m]** como página; cada uma também com **erros visíveis** (envio vazio), com a **mensagem de credenciais**, com o **bloqueio** (`RetryCountdown`), com **requisitos da senha** cumpridos e com o **aviso de expiração** (`SessionExpiryBanner`) aberto.
2. **[d] Teclado do modal:** Tab no cabeçalho até "Entrar" + Enter abre o modal; o foco fica **preso** (Tab e Shift+Tab ciclam dentro do modal, sem alcançar o fundo); Esc fecha; o foco **volta ao link "Entrar"** do cabeçalho; o mesmo com o botão X e com Enter.
3. **Foco visível:** os campos, o olho, "Entrar", os sociais, as abas e o X têm anel/borda de foco visível (`outline` ou `box-shadow` não vazio em `:focus-visible`).
4. **Semântica:** [d] um `dialog` com nome "Entrar" / "Criar conta" e um único `h1` na árvore acessível (o do modal); [m] um único `h1`; landmark `main`; campos com `autocomplete` correto (`email`, `current-password`, `new-password`, `username`); `required`/`aria-required`; ícones decorativos sem nome; botões só de ícone com `aria-label` (olho, X).
5. **Erros ligados:** para cada campo com erro, `aria-invalid="true"` e `aria-describedby` apontando para o elemento com o texto (`toHaveAccessibleDescription` contém a mensagem).
6. **Overflow:** `document.documentElement.scrollWidth <= innerWidth` em `/entrar` e `/cadastro` nas larguras 320, 414, 1024, 1280 e 1440 (também com erros visíveis e com o modal de 500 px em 1024).
7. **Altura baixa [d]:** com viewport 1440×500, o modal rola por dentro e o botão de enviar continua alcançável; zoom de 400% simulado por viewport de 320×256 não corta conteúdo (rolagem vertical possível).
8. **Reduzir movimento:** com `prefers-reduced-motion: reduce`, o indicador de "verificando" e as animações do modal não quebram (sem exigir ausência de giro do ícone).
Fechamento: `npm run lint && npm run format:check && npm run typecheck` → exit 0. Commit: `git add tests/e2e/auth-a11y.spec.ts tests/e2e/tokens.spec.ts` e `git commit -m "05-047: acessibilidade do Login e do Cadastro"`.

## Critérios de aceite
- [ ] Todos passam nos projetos `desktop` e `mobile` (cada item nos seus), duas execuções seguidas.
- [ ] Nenhuma violação `serious`/`critical` ignorada além da regra citada (e justificada em comentário).
- [ ] `tokens.spec.ts` continua verde com os pares novos.

## Verificação (Sonnet)
- `npm run test:e2e` → tudo verde; `npm run lint && npm run format:check && npm run typecheck && npm run build` → exit 0.

# 05-048 — Baseline visual do Login e do Cadastro

**Status:** concluído
**Responsável:** Sonnet (o Haiku não escreve testes)
**Fluxo / subitem:** Login e Cadastro › baseline visual (aprovada pelo usuário)
**Depende de:** 05-043, 05-044, 05-047

## Objetivo
Criar a primeira regressão visual das duas telas em desktop e mobile, com os estados não desenhados, e entregar ao usuário a comparação com as capturas do Figma para aprovar a baseline.

## Arquivos
- criar: `tests/visual/auth.spec.ts`

## Referências
- docs/qualidade/testes.md (Regressão visual: `toHaveScreenshot()` nos dois projetos, dados do seed, animações desligadas; **a primeira baseline é aprovada pelo usuário** comparando com `docs/design/telas/`; estados não desenhados também ganham baseline; `maxDiffPixelRatio` ≤ 0,01; imagens e fontes carregadas antes da captura)
- Capturas: desktop-login.png, desktop-cadastro.png, mobile-login.png, mobile-cadastro.png
- **A Início real é da fase 06**: no desktop a baseline compara **a caixa do modal** (`dialog.screenshot()`), não a página inteira; o fundo (`Home` provisório) ganha baseline na fase 06.

## Instruções
O Sonnet escreve e gera as imagens.
1. Esperar `document.fonts.ready` e as imagens; `animations: 'disabled'`, `caret: 'hide'`, `maxDiffPixelRatio: 0.01`; viewport do projeto (1440×900 e 414×896); usuário do seed.
2. **[d]** `dialog.screenshot()` de `/entrar` e de `/cadastro` (vazios) e, em `/entrar`, dos estados: foco no campo de senha, erro de credenciais, bloqueio (com `page.clock`, "Tente novamente em 30 segundos"), erros de validação. Em `/cadastro`: requisitos da senha pendentes e cumpridos, erro de disponibilidade (e-mail em uso), erro `409` no envio com o link "Entrar com este e-mail".
3. **[m]** captura da página (viewport) das mesmas telas e estados, mais `/cadastro` em 320×700.
4. **Aviso de expiração** aberto em `/` (desktop e mobile), só a faixa.
5. **Comparação com o Figma** (entregue ao usuário, não é asserção): para cada uma das 4 capturas do Figma, a imagem da baseline ao lado e uma medição das posições da tabela do 05-021 (altura do modal 600/656 px, campos 40/50 px, botão 45/60 px, divisor, sociais, logo e título no mobile), com as diferenças apontadas. As **diferenças aceitas** ficam listadas para o usuário: o fundo (Início provisória), os requisitos da senha, o indicador de verificação, o sublinhado da aba ativa, o sublinhado dos links de troca, o olho em `tan` no mobile, o título "Criar perfil de colecionador" sem corte e o placeholder de "Nome de usuário" alinhado à esquerda no mobile.
6. **Só com o OK do usuário** as imagens entram como baseline; qualquer diferença depois disso quebra o teste. Registrar a aprovação no 05-049.
Fechamento: `npm run lint && npm run format:check && npm run typecheck` → exit 0. Commit: `git add tests/visual/auth.spec.ts tests/visual/auth.spec.ts-snapshots` e `git commit -m "05-048: baseline visual do Login e do Cadastro"` (somente depois da aprovação).

## Critérios de aceite
- [ ] As capturas são determinísticas: duas execuções seguidas sem diferença.
- [ ] O usuário aprovou a baseline desktop e mobile.
- [ ] Nenhum teste da suíte E2E foi alterado por este bloco.

## Verificação (Sonnet)
- `npx playwright test tests/visual/auth.spec.ts` verde nos dois projetos; `npm run lint && npm run format:check && npm run typecheck && npm run build` → exit 0.

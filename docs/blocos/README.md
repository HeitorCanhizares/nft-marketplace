# Blocos de implementação

Escritos pelo **Sonnet**, implementados pelo **Haiku**, validados pelo **Sonnet**.

## Fluxo de trabalho

1. O usuário valida os subitens de um fluxo (em `docs/fluxos/`).
2. O **Sonnet** quebra os subitens em blocos pequenos, um arquivo por bloco, e cria os testes do bloco.
3. O **Haiku** implementa **um bloco por vez**, exatamente como descrito. Se algo não estiver claro ou exigir decisão (arquivo fora do previsto, dependência nova, mudança de arquitetura), **para e pergunta**. Não inventa.
4. O **Sonnet** roda testes, lint e typecheck, compara com a captura do Figma e marca o bloco como `concluído` ou devolve com a lista do que falta.
5. Decisões novas que aparecerem durante o bloco vão para [decisoes.md](../decisoes.md), sempre com o OK do usuário.

## Tamanho de um bloco

- Altera **no máximo 3 arquivos** de código (fora os testes).
- Uma única responsabilidade (um componente, um handler do mock, um hook, uma rota).
- Pode ser concluído e testado sozinho.

## Nome do arquivo

`<fase>-<número>-<slug>.md`, ex.: `02-004-mock-cart-handlers.md`.

## Modelo de bloco

```md
# 02-004 — Handlers do carrinho no mock

**Status:** pendente | em andamento | em revisão | concluído
**Fluxo / subitem:** Carrinho › Alterar quantidade
**Depende de:** 02-001, 02-002

## Objetivo
Uma frase.

## Arquivos
- criar: `src/mocks/handlers/cart.ts`
- alterar: `src/mocks/browser.ts`

## Referências
- Contrato: docs/api-mock/contratos.md#carrinho
- Tela: docs/design/telas/desktop-carrinho.png
- Componentes reutilizados: QuantityStepper, LineItem

## Instruções
Passos objetivos, na ordem.

## Critérios de aceite
- [ ] ...
- [ ] Acessibilidade: ...
- [ ] Sem cor hexadecimal fora dos tokens

## Testes
- `tests/e2e/cart.spec.ts` › "altera a quantidade"
```

## Fases (✅ aprovadas pelo usuário em 2026-10-25)

O Sonnet detalha **uma fase por vez** em blocos. Ao fim de cada fase há um **checkpoint com o usuário**: o Sonnet entrega um resumo, os testes passando e como ver no navegador; a próxima fase só começa com o OK dele.

| Fase | Conteúdo |
|---|---|
| 00 | **Setup:** `git init` local; Vite + TypeScript; Tailwind; shadcn (init); TanStack Router (plugin, rotas por arquivo) e Query; Axios; ESLint/Prettier; Playwright (projetos desktop e mobile); configuração do LHCI; `.env`, `.env.development`, `.env.test`; estrutura de pastas aprovada |
| 01 | **Design base:** tokens em `globals.css` + Tailwind, fonte, primitivos `components/ui/` estilizados |
| 02 | **Mock base:** banco (IndexedDB/localStorage) e stores, seed, middleware de cenários (latência, erros, cenários forçados, override A6), bootstrap do MSW, servidor de tempo real simulado, simulador de carteira. **Sem handlers de recurso** (eles nascem com cada fluxo). |
| 03 | **App base:** `services/http` + `ApiError`, schemas compartilhados, `QueryClient` e fábrica de chaves, `AuthContext` (estrutura), `LiveAnnouncerContext`, cliente Socket.IO, `services/wallet`, `lib/storage`, `clearPrivateSession` |
| 04 | **Layout e estados:** `AppShell`, `Header` (incluindo `UserMenu`), `Footer`, `MobileTabBar`, `MobileTopBar`, `Breadcrumb`, `ProfileLayout`, `EmptyState`, `ErrorState`, skeletons |
| 05 | **Login e Cadastro** (+ handlers de auth, expiração, logout, rotas protegidas) |
| 06 | **Início** (+ handlers de home, NFTs, favoritos, `POST /cart/items`, `GET /cart` e contador do carrinho) — 71 blocos |
| 07 | **Detalhes do NFT** (+ handlers de detalhe, relacionados, avaliações) — 18 blocos |
| 08 | **Carrinho** — 15 blocos — (+ handlers de carrinho, cupom, cotação, mescla do visitante) |
| 09 | **Perfil** — 16 blocos — (+ handlers de perfil, avatar, senha, disponibilidade) |
| 10 | **Carteiras** (+ handlers de carteiras) |
| 11 | **Pagamento** (+ handlers de pedidos, revalidação, idempotência, conexão da carteira) |
| 12 | **Confirmação** (+ ciclo de vida do pedido, tempo real e polling) |
| 13 | **Final:** testes de **casos de borda** de todos os fluxos (todos os cenários de `api-mock/cenarios.md`, adiados das fases 06–12 pelo modo enxuto),  Lighthouse com metas, varredura de acessibilidade, suíte E2E completa em Chromium, Firefox e WebKit |

### Toda fase de fluxo (05–12) termina com
1. Handlers do MSW dos recursos que o fluxo usa, com os cenários de [cenarios.md](../api-mock/cenarios.md) correspondentes.
2. Testes E2E mínimos de [testes.md](../qualidade/testes.md) para o fluxo.
3. Verificação de acessibilidade (axe + teclado + overflow em 320px).
4. **Baseline visual** desktop e mobile, **aprovada pelo usuário** comparando com as capturas do Figma.

### Git
- Repositório local criado na fase 00. **Um commit por bloco concluído** e **uma tag por fase aprovada** (`fase-05-login` etc.).
- Nada é enviado para remoto sem o usuário pedir.

# 07-016 — Testes do detalhe (caminho principal)

**Status:** pendente
**Fluxo / subitem:** Detalhes › todos (modo enxuto)
**Depende de:** 07-015, 07-001

> **Modo enxuto** (docs/decisoes.md): só o caminho principal. Casos de borda estão listados no 07-018.

## Objetivo
Um spec do fluxo, um de axe e uma baseline visual por tela (desktop e mobile, conforme o projeto).

## Arquivos (testes)
- criar: `tests/e2e/nft-details.spec.ts`
- criar: `tests/e2e/nft-details-a11y.spec.ts`
- criar: `tests/visual/nft-details.spec.ts`

## Referências
- `tests/e2e/home.spec.ts`, `home-a11y.spec.ts`, `tests/visual/home.spec.ts` (estrutura, `ready`, `users`, `authState`, `settle`); NFT de teste: `emerald-ape-042`

## Instruções
1. `nft-details.spec.ts` (cada `test` roda uma vez; `only(testInfo, …)` para o que é só de um projeto). Testes:
   - acesso direto à URL mostra `h1` "Emerald Ape #042", preço `1.19 ETH`, ID do token, coleção e atributos; desktop: breadcrumb com o nome em `aria-current="page"`;
   - trocar a edição para 1/10 atualiza o preço para `1.39 ETH` e volta a quantidade para 1;
   - galeria: desktop, a miniatura 2 troca a imagem principal; a lupa (desktop) ou o toque (mobile) abre o zoom e Esc fecha;
   - desktop: "COMPRAR" leva a `/carrinho` com a linha do NFT; mobile: o botão de carrinho adiciona, **fica** na página e o contador/região viva indica o item;
   - favoritar logado (`signIn`) vira `aria-pressed="true"` e persiste após `reload`;
   - avaliações: desktop, clicar na nota abre a aba "Avaliações" com 5 itens e "Carregar mais" passa a 10; mobile, a nota abre o `Sheet`;
   - desktop: "Mais desta coleção" mostra cards; os links de compartilhar têm os `href` esperados (LinkedIn, Twitter, `mailto:`);
   - `/nft/nao-existe` mostra "NFT não encontrado" com link para o catálogo.
2. `nft-details-a11y.spec.ts`: axe (só `serious`/`critical`) em `/nft/emerald-ape-042`, como em `home-a11y.spec.ts`.
3. `tests/visual/nft-details.spec.ts`: `toHaveScreenshot('detalhes.png', { fullPage: true })` com movimento reduzido e `settle`, no mesmo padrão da Início. **A baseline só é aprovada pelo usuário no checkpoint.**
4. Procurar testes antigos que dependam do `h1` "NFT" provisório (`grep -rn '"NFT"' tests`) e ajustar.
5. `npm run test:e2e -- nft-details` e `npm run test:e2e -- nft-details-a11y` verdes nos dois projetos; gerar a baseline com `npx playwright test tests/visual/nft-details.spec.ts --update-snapshots`. Commit: `07-016: testes do detalhe`.

## Critérios de aceite
- [ ] Sem `waitForTimeout`; seletores por papel/nome.
- [ ] Nenhum teste de falha, tempo real, clique repetido, limite de estoque ou sessão expirada.

## Verificação (Sonnet)
- Specs acima verdes; uma captura lado a lado com o Figma por tela (desktop e mobile), nos elementos principais.

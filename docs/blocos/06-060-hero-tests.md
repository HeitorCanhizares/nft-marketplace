# 06-060 — Testes do hero e do destaque

**Status:** pendente
**Responsável:** Sonnet (o Haiku não escreve testes)
**Fluxo / subitem:** Início › 1 (hero) e 2 (destaque)
**Depende de:** 06-057, 06-059

## Objetivo
Provar o carrossel do hero (rotação, pausas, indicadores, swipe, "EXPLORAR"), os estados de carregamento e erro de `GET /home` e o cartão em destaque.

## Arquivos
- criar: `tests/e2e/home-hero.spec.ts`

## Referências
- docs/fluxos/inicio.md (subitens 1 e 2) e docs/qualidade/testes.md (seletores por papel; `page.clock` para o tempo)
- `tests/e2e/helpers.ts` (`openApp`, `ready`, `delayRoute`, `recordApi` do 06-059)

## Instruções
O Sonnet escreve, sem `data-testid` nem CSS. **[d]** só no `desktop`, **[m]** só no `mobile`. Instalar o relógio simulado (`page.clock.install()`) **depois** que a Início carregou (a latência do mock também usa `setTimeout`).
1. **Estrutura:** `region` "Destaques" com 3 slides ("Destaque 1 de 3"…); **um** `heading` de nível 2 no hero: [d] "SEJA DONO DO FUTURO DA ARTE DIGITAL", [m] "SEJA DONO DA CULTURA DIGITAL"; "Bem-vindo à Kurio" e o texto de apoio como no Figma; 3 botões "Ir para o slide N"; botão "EXPLORAR"; o texto não está dentro de um slide.
2. **Rotação:** o slide 1 está ativo; `clock.runFor(6000)` → o 2º; mais 6000 → o 3º; mais 6000 → volta ao 1º (loop). Só `aria-current` de **um** indicador por vez.
3. **Pausa por mouse:** `hover` no hero + `runFor(20000)` → não muda; `mouse.move` para fora + `runFor(6000)` → muda.
4. **Pausa por foco:** focar um indicador (Tab) + `runFor(20000)` → não muda; o foco sai → volta a rodar.
5. **Botão de pausa:** "Pausar rotação dos destaques" (`aria-pressed` falso) → clicar vira "Retomar rotação dos destaques" (`aria-pressed` verdadeiro) e `runFor(20000)` não muda; clicar de novo retoma. Funciona só com teclado (Enter/Espaço).
6. **`prefers-reduced-motion`:** `emulateMedia({ reducedMotion: 'reduce' })` **antes** do `goto`: `runFor(30000)` nunca muda de slide; o botão de pausa **não** existe; os indicadores continuam funcionando.
7. **Indicadores e teclado:** clicar/Enter no indicador 3 ativa o slide 3; setas esquerda/direita (foco no carrossel) trocam de slide. **[m] Swipe:** arrastar horizontalmente sobre a imagem (`mouse.down/move/up`) troca de slide. **[m]** o slide mostra o par de imagens (grande e pequena).
8. **"EXPLORAR":** clique e Enter levam a `/#catalogo` (hash), a página rola até o topo do catálogo (o título "Catálogo de NFTs" a até 40 px do topo da janela) e o foco fica nesse título (`toBeFocused`); sem mudar a busca.
9. **Carregando:** com `slow`, aparece o esqueleto ("Carregando destaques…") com **a mesma altura** do hero final (450 px desktop, 190 px mobile; medir antes e depois, diferença ≤ 1 px).
10. **Erro de `GET /home`:** com `server-error:GET /home`, **um** `ErrorState` "Não foi possível carregar os destaques" com "Tentar novamente" ocupa o lugar do hero (e, no desktop, do destaque, promos e blog); o catálogo mostra 9 NFTs normalmente; remover o cenário e clicar em "Tentar novamente" traz o hero.
11. **[d] Destaque:** `link` "NFT EM DESTAQUE OFERTA LIMITADA: Cosmic Bloom #118" (nome acessível), `href` `/nft/cosmic-bloom-118`, clicar abre `/nft/cosmic-bloom-118`; **[m]** o destaque não existe.
12. **Imagens:** todas as imagens do hero têm `alt` da API (a pequena do mobile é decorativa, `alt=""`).
Fechamento: `npm run lint && npm run format:check && npm run typecheck` → exit 0. Commit: `git add tests/e2e/home-hero.spec.ts` e `git commit -m "06-060: testes do hero"`.

## Critérios de aceite
- [ ] Passa nos projetos `desktop` e `mobile` (itens [d]/[m] no projeto certo), duas execuções seguidas.
- [ ] Nenhum `data-testid` nem seletor CSS (exceção justificada em comentário).

## Verificação (Sonnet)
- `npm run test:e2e -- home-hero` verde; `npm run lint && npm run format:check && npm run typecheck && npm run build` → exit 0.

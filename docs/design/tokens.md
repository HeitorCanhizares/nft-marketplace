# Tokens de design

> As cores foram tiradas dos pixels das capturas do Figma, porque o limite do plano bloqueou a leitura das variables. Estão certas ou muito próximas. **Quando o limite renovar, confirmar com uma única chamada `get_variable_defs` no frame `2:2` e atualizar este arquivo.**

Os tokens viram variáveis CSS em `src/styles/globals.css` e são expostos no Tailwind com os nomes do shadcn (`background`, `foreground`, `primary`...). Componentes **nunca** usam cor hexadecimal direto, só os tokens.

## Cores

Tema único: escuro. Não existe tema claro no Figma.

| Token | Valor | Uso |
|---|---|---|
| `background` | `#140d0a` | Fundo da página, fundo dos campos |
| `surface` | `#241612` | Cards, menu lateral, modais, fundo das imagens dos cards |
| `surface-2` | `#2f1d15` | Botões de quantidade, cards de item no mobile |
| `surface-3` | `#38220f` | Faixa do rodapé (marca, contato) |
| `border` | `#3f2319` | Borda dos campos |
| `border-strong` | `#432b1a` | Linha do cabeçalho, divisores |
| `primary` | `#d28a4c` | Botões principais, aba ativa, borda do campo em foco, barra ativa do menu lateral |
| `primary-foreground` | `#140d0a` | Texto sobre botão `primary` |
| `price` | `#e89b55` | Preços e totais |
| `foreground` | `#f5f1eb` | Texto principal |
| `muted-foreground` | a confirmar (tom bege/caramelo) | Descrições, placeholders, textos secundários |
| `required` | `#f0805f` | Asterisco de campo obrigatório |
| `destructive` | a definir no padrão | Erros de validação, pagamento recusado (não existe no Figma) |
| `success` | a definir no padrão | Pagamento confirmado (não existe no Figma) |

Gradiente do mobile: os botões principais e o hero do mobile usam um gradiente de `primary` para um tom mais escuro. Confirmar os valores no Figma.

**Contraste:** antes de usar `muted-foreground` sobre `surface` em texto pequeno, verificar a razão de contraste ≥ 4.5:1 ([qualidade/acessibilidade.md](../qualidade/acessibilidade.md)).

## Tipografia

- Família: **monoespaçada em toda a interface**. Estimativa: **Roboto Mono** (pendência A8 em [decisoes.md](../decisoes.md)).
- Títulos de destaque (hero "SEJA DONO DO FUTURO DA ARTE DIGITAL", "NFT EM DESTAQUE"): caixa alta, peso bold.
- Escalas exatas de tamanho e altura de linha: confirmar no Figma. Até lá, medir nas capturas `design/telas/*` (as capturas de 1440px e 414px estão em escala 1:1, exceto as listadas em [telas/README.md](telas/README.md)).

## Raios

| Contexto | Raio |
|---|---|
| Desktop: botões, campos, cards | pequeno (~4px) |
| Mobile: campos, botões, cards | grande (~12–20px), botões principais em formato pílula |
| Imagens dos NFTs | arredondadas (~12px) dentro do card |

## Layout e breakpoints

| Tela | Largura de referência | Conteúdo |
|---|---|---|
| Desktop | 1440px | Container de **1200px** centralizado (margem de 120px) |
| Mobile | 414px | Margem lateral de 24–28px |

Breakpoint de troca de layout: decisão A5 em [decisoes.md](../decisoes.md) (`1024px`).

Regra para larguras intermediárias: o layout nunca pode gerar rolagem horizontal nem cortar conteúdo, inclusive com zoom de 200%.

## Ícones

Ícones de linha, finos, na cor `primary` ou `foreground` (lupa, carrinho, coração, lixeira, olho, sair, perfil...). Usar **lucide-react** (confirmado pelo usuário), que já vem com o shadcn. Ícones de marca (Google, Facebook, redes sociais) são SVGs próprios em `src/assets/`.

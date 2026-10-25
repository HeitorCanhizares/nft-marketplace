# Acessibilidade

Meta: **WCAG 2.2 nível AA**. Todo bloco que cria interface tem estes itens como critério de aceite, e o Sonnet os verifica com `@axe-core/playwright` (decisão A7) + testes de teclado.

## Requisitos do usuário e como cumprir

| Requisito | Como |
|---|---|
| **Navegação por teclado e foco visível** | Todo elemento interativo é alcançável por Tab na ordem visual. Foco visível com anel `primary` de 2px e contraste ≥ 3:1 contra o fundo; nunca `outline: none` sem substituto. Link "Pular para o conteúdo" no topo. Cards de NFT: o card inteiro é um link; as ações do hover também aparecem no foco (`:focus-within`), não só no mouse. |
| **Controle de foco em diálogos e drawers** | `Dialog` e `Sheet` do shadcn (Radix): foco vai para o primeiro campo ou título ao abrir, fica preso dentro, Esc fecha, e o foco **volta ao elemento que abriu**. Na troca de rota, o foco vai para o `<h1>` da nova página. |
| **Semântica, labels e erros associados** | Landmarks (`header`, `nav`, `main`, `footer`, `aside`). Um `<h1>` por página, hierarquia sem saltos. Todo campo tem `<label>` associado. Nos formulários com label visível no Figma, ele é visível; no Login e no Cadastro (só placeholder no Figma), o label é **apenas para leitor de tela** (decisão do usuário) e o placeholder é mantido. Erros com `aria-invalid` e `aria-describedby` apontando para a mensagem. Obrigatório com `required`/`aria-required`, e o asterisco tem texto alternativo ("obrigatório"). Grupos de rádio (edição, carteira, rede) com `fieldset`/`legend` ou `role="radiogroup"`. Tabela do carrinho desktop como `<table>` semântica. |
| **Alternativas textuais** | Imagens de NFT com `alt` vindo da API (ex.: "Emerald Ape #042: macaco com óculos escuros e jaqueta verde"). Imagens decorativas com `alt=""`. Botões só de ícone (lixeira, coração, carrinho, lupa, voltar, fechar, olho) com `aria-label` em PT-BR. Coração com `aria-pressed`. |
| **Contraste e estados que não dependem só de cor** | Texto normal ≥ 4.5:1, texto grande e componentes ≥ 3:1 (verificar `muted-foreground`, placeholders e preço riscado sobre `surface`). Aba ativa: cor + sublinhado. Item ativo do menu lateral: cor + barra. Erro: cor + ícone + texto. Esgotado / indisponível: texto, não só cinza. Rádio selecionado: marcador preenchido + borda. |
| **Feedback acessível para mutations e tempo real** | `LiveAnnouncerContext` com regiões `aria-live` `polite` (adicionado ao carrinho, favoritado, salvo, preço atualizado) e `assertive` (erro, sessão expirada, pagamento recusado). Botões em envio com `aria-busy` e texto de carregamento. Toasts do Sonner também anunciados. Mudança em tempo real nunca move o foco. |
| **Sem overflow horizontal e sem perda com zoom** | Funcionar em 320px de largura e com zoom de 200% e 400% (reflow, WCAG 1.4.10). Sem larguras fixas em px para containers; textos longos (endereços `0x...`, nomes) quebram ou truncam com o valor completo acessível. Teste automatizado verifica `document.documentElement.scrollWidth <= innerWidth`. Respeitar `prefers-reduced-motion` nos carrosséis (sem autoplay). |

## Itens desabilitados

Os itens sem tela ficam visíveis e desabilitados: `aria-disabled="true"`, fora da ação, com dica "Em breve" (tooltip acessível por foco). Não usar `disabled` em links.

## Idioma
`<html lang="pt-BR">`. Valores em ETH lidos corretamente (ex.: `aria-label="1,19 ETH"` quando o número estiver estilizado em partes).

# 05-020 — AuthDialog (moldura do modal de Login e Cadastro no desktop)

**Status:** concluído
**Fluxo / subitem:** Login › 1 e Cadastro › 1 (modal sobre a Início, fundo inerte, Esc/X fecham)
**Depende de:** 01-008, 04-003
**Depende de decisão:** perguntas 3 (sem escurecimento do fundo), 4 (posição vertical) e 10 (componente novo) do relatório da fase 05

## Objetivo
Criar a moldura do modal de autenticação do desktop sobre o primitivo `Dialog`: 500 px, faixa inferior de 10 px em `primary`, botão de fechar no canto, foco inicial no primeiro campo.

## Arquivos
- criar: `src/components/shared/AuthDialog.tsx`
- alterar: `src/components/ui/dialog.tsx` (nova prop `overlayClassName` em `DialogContent`, repassada ao `DialogOverlay`)

## Referências
- docs/arquitetura/rotas.md (Login, Cadastro e Confirmação: modal no desktop, página no mobile; fechar navega para o `redirect` ou `/`)
- docs/qualidade/acessibilidade.md (Dialog: foco vai para o primeiro campo ao abrir, fica preso, Esc fecha, foco volta ao elemento que abriu)
- `src/components/ui/dialog.tsx`
- Capturas (1:1): desktop-login.png (modal em `x` 470–969, `y` 160–759) e desktop-cadastro.png (`y` 158–813)

## Medidas lidas nas capturas
| Elemento | Valor |
|---|---|
| Caixa | **500 px de largura**; altura do login 600 px, do cadastro 656 px; fundo `card`; **sem raio**, sem borda lateral e sem sombra |
| Faixa inferior | 10 px em `primary` (`border-b-10 border-primary`); o primitivo tem 4 px |
| Altura mínima | `min-h-150` (600 px): o login chega aos 600 px do Figma; o cadastro cresce pelo conteúdo (≈ 656 px) |
| Botão fechar | glifo "x" de 12 px (`SvgIcon name="x"`, `text-primary`) com centro a ≈ 20 px do topo e da direita do modal → botão de 40 px em `top-0 right-0` (o primitivo o coloca em `top-2 right-2`, por isso o botão é desta moldura) |
| Fundo da página | **o Figma não escurece** o fundo (a Início aparece com as cores normais). Proposto: `overlayClassName="bg-transparent"` (a camada continua existindo para receber o clique fora e deixar o fundo inerte) |
| Posição | centralizada na viewport (padrão do Radix). Em tela baixa: `max-h-[calc(100dvh-2rem)]` com rolagem interna |

## Instruções
1. `dialog.tsx`: `DialogContent` ganha `overlayClassName?: string`, repassada ao `<DialogOverlay className={overlayClassName} />`. Nada mais muda (os outros usos do primitivo não são afetados).
2. `AuthDialog` — props: `title: string`, `onClose: () => void`, `children`, `className?`. Renderiza `Dialog open onOpenChange={(open) => { if (!open) onClose() }}` → `DialogContent` com `showCloseButton={false}`, `overlayClassName="bg-transparent"`, `aria-describedby={undefined}` e classes `w-125 max-w-125 sm:max-w-125 min-h-150 max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto rounded-none border-b-10 p-0 lg:rounded-none` (conferir que o `cn` descarta o `max-w`, o raio e a borda do primitivo).
3. Título: `DialogTitle asChild` com `<h1 className="sr-only">{title}</h1>` (o título visível do Figma são as abas).
4. Botão de fechar próprio: `DialogClose asChild` → `Button variant="ghost" size="icon"` com `aria-label="Fechar"`, `absolute top-0 right-0 text-primary hover:bg-transparent hover:text-primary` e `SvgIcon name="x"`.
5. Foco inicial: `onOpenAutoFocus` com `preventDefault()` e foco no **primeiro `input`** dentro do conteúdo (`event.currentTarget.querySelector('input')`); sem input, comportamento padrão.
6. Esc, clique fora e o X chamam `onClose`. **Não** navegar aqui (quem decide o destino é a página).
7. Fechamento: `npx prettier --write` nos 2 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/shared/AuthDialog.tsx src/components/ui/dialog.tsx` e `git commit -m "05-020: AuthDialog"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; export nomeado `AuthDialog`; os outros `Dialog` do projeto continuam iguais.
- [ ] Caixa de 500 px, sem raio, faixa de 10 px, mínimo de 600 px; centralizada; rola por dentro em tela baixa.
- [ ] Foco inicial no primeiro campo; Tab fica preso no modal; Esc fecha; o fundo fica inerte (não recebe foco nem clique).
- [ ] O foco **volta ao elemento que abriu** ao fechar com Esc ou X (garantido junto com o 05-028).
- [ ] Sem cor hexadecimal, `oklch()` ou `rgb()`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Probe **não commitado** em 1440×900 com a Início de teste ao fundo; captura sobreposta a `desktop-login.png` (largura 500 px e faixa de 10 px exatas; botão X com tolerância de 2 px). Teclado coberto no 05-047.

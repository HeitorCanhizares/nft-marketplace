# 01-019 — DropdownMenu

**Status:** pendente
**Fluxo / subitem:** Fase 01 › Primitivos do shadcn
**Depende de:** 01-005

## Objetivo
Adicionar e estilizar o(s) primitivo(s) DropdownMenu com os tokens, seguindo o Figma.

## Arquivos
- criar pela CLI e estilizar: `src/components/ui/dropdown-menu.tsx`
- gerado pelo npm/CLI (se houver): `package.json`, `package-lock.json`

## Referências
- docs/design/componentes.md (tabela `components/ui`)
- docs/design/tokens.md
- Capturas: sem captura (cabeçalho logado não desenhado; seguir o padrão do Dialog/Select)

## Instruções
1. Rodar `npx shadcn@latest add dropdown-menu -y`. Se a CLI pedir sobrescrita ou instalar pacote **fora** de `radix-ui`, `class-variance-authority`, `lucide-react`, `embla-carousel-react`, `sonner` e `tw-animate-css`, **parar e perguntar**. Se criar ou alterar arquivos além dos listados, desfazer o excedente e relatar.
2. Estilizar, **só trocando classes e variantes** (sem mudar o comportamento do Radix):
   - Conteúdo em `popover` com borda `border`; item em foco/hover com `accent`; item destrutivo ("Sair") sem cor própria no Figma: manter `foreground`. Itens desabilitados com `aria-disabled`.
3. Apagar `.gitkeep` de `src/components/ui/` se ainda existir e `npm run format`.
4. Commit: `git add src/components/ui/dropdown-menu.tsx package.json package-lock.json` e `git commit -m "01-019: primitivo dropdown-menu"`.

## Critérios de aceite
- [ ] Sem cor hexadecimal, `oklch()` ou `rgb()` no componente: só tokens (`bg-primary`, `text-muted-foreground`...).
- [ ] Foco visível (anel `ring` de 2px) e papéis/`aria-*` do Radix preservados.
- [ ] Aparência confere com as capturas citadas, em 1440 e 414px.
- [ ] Textos acessíveis em PT-BR (ex.: `Fechar`, nunca `Close`).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Probe **não commitado** (`src/routes/_probe.tsx`, apagado ao final) com o componente em todas as variantes; capturas em 1440×900 e 414×896 comparadas com `docs/design/telas/`.
- Tab, `hover`, `disabled` e `aria-invalid` (quando existirem).

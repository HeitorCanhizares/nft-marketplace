# 01-004 — Button

**Status:** pendente
**Fluxo / subitem:** Fase 01 › Primitivos do shadcn
**Depende de:** 01-003

## Objetivo
Adicionar e estilizar o(s) primitivo(s) Button com os tokens, seguindo o Figma.

## Arquivos
- criar pela CLI e estilizar: `src/components/ui/button.tsx`
- gerado pelo npm/CLI (se houver): `package.json`, `package-lock.json`

## Referências
- docs/design/componentes.md (tabela `components/ui`)
- docs/design/tokens.md
- Capturas: desktop-login.png (Entrar), mobile-login.png, desktop-carrinho.png (Aplicar, Conectar e finalizar)

## Instruções
1. Rodar `npx shadcn@latest add button -y`. Se a CLI pedir sobrescrita ou instalar pacote **fora** de `radix-ui`, `class-variance-authority`, `lucide-react`, `embla-carousel-react`, `sonner` e `tw-animate-css`, **parar e perguntar**. Se criar ou alterar arquivos além dos listados, desfazer o excedente e relatar.
2. Estilizar, **só trocando classes e variantes** (sem mudar o comportamento do Radix):
   - Variantes: `default` (fundo `primary`, texto `primary-foreground`, bold, caixa normal; raio 4px no desktop e `--radius-mobile` abaixo de `lg`), `outline` (borda `border`, fundo transparente, texto `muted-foreground`; botões sociais e "Continuar explorando"), `ghost`, `link` (texto `primary`, sem fundo, ex. "Esqueceu a senha?"), `icon` (quadrado, ícone de linha) e `gradient` (`bg-gradient-primary`, só mobile).
   - Tamanhos: `default` ≈ 40px de altura (≈ 60px nos botões grandes de formulário do mobile), `sm` ≈ 32px ("Aplicar"), `lg`.
   - `disabled`: opacidade reduzida e `pointer-events-none`; a variante precisa também funcionar com `aria-disabled="true"` (links desabilitados, ver acessibilidade.md).
3. Apagar `.gitkeep` de `src/components/ui/` se ainda existir e `npm run format`.
4. Commit: `git add -A src/components/ui package.json package-lock.json` e `git commit -m "01-004: primitivo button"`.

## Critérios de aceite
- [ ] Sem cor hexadecimal, `oklch()` ou `rgb()` no componente: só tokens (`bg-primary`, `text-muted-foreground`...).
- [ ] Foco visível (anel `ring` de 2px) e papéis/`aria-*` do Radix preservados.
- [ ] Aparência confere com as capturas citadas, em 1440 e 414px.
- [ ] Textos acessíveis em PT-BR (ex.: `Fechar`, nunca `Close`).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Probe **não commitado** (`src/routes/_probe.tsx`, apagado ao final) com o componente em todas as variantes; capturas em 1440×900 e 414×896 comparadas com `docs/design/telas/`.
- Tab, `hover`, `disabled` e `aria-invalid` (quando existirem).

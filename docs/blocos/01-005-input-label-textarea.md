# 01-005 — Input, Label e Textarea

**Status:** pendente
**Fluxo / subitem:** Fase 01 › Primitivos do shadcn
**Depende de:** 01-004

## Objetivo
Adicionar e estilizar o(s) primitivo(s) Input, Label e Textarea com os tokens, seguindo o Figma.

## Arquivos
- criar pela CLI e estilizar: `src/components/ui/input.tsx`, `src/components/ui/label.tsx`, `src/components/ui/textarea.tsx`
- gerado pelo npm/CLI (se houver): `package.json`, `package-lock.json`

## Referências
- docs/design/componentes.md (tabela `components/ui`)
- docs/design/tokens.md
- Capturas: desktop-login.png, mobile-login.png, desktop-pagamento.png, desktop-perfil.png

## Instruções
1. Rodar `npx shadcn@latest add input label textarea -y`. Se a CLI pedir sobrescrita ou instalar pacote **fora** de `radix-ui`, `class-variance-authority`, `lucide-react`, `embla-carousel-react`, `sonner` e `tw-animate-css`, **parar e perguntar**. Se criar ou alterar arquivos além dos listados, desfazer o excedente e relatar.
2. Estilizar, **só trocando classes e variantes** (sem mudar o comportamento do Radix):
   - `Input`/`Textarea`: fundo `background`, borda `border`, texto `foreground`, placeholder `muted-foreground`, foco com borda `primary`, `aria-invalid` com borda `destructive`. Altura ≈ 40px no desktop e ≈ 50px no mobile; raio 4px desktop / `--radius-mobile` mobile.
   - `Label`: `text-sm` bold; sem asterisco embutido (o asterisco `required` é do `FormField`, fase 04+).
   - Classe utilitária `sr-only` do Tailwind continua disponível para os labels do Login e Cadastro.
3. Apagar `.gitkeep` de `src/components/ui/` se ainda existir e `npm run format`.
4. Commit: `git add src/components/ui/input.tsx src/components/ui/label.tsx src/components/ui/textarea.tsx package.json package-lock.json` e `git commit -m "01-005: primitivo input-label-textarea"`.

## Critérios de aceite
- [ ] Sem cor hexadecimal, `oklch()` ou `rgb()` no componente: só tokens (`bg-primary`, `text-muted-foreground`...).
- [ ] Foco visível (anel `ring` de 2px) e papéis/`aria-*` do Radix preservados.
- [ ] Aparência confere com as capturas citadas, em 1440 e 414px.
- [ ] Textos acessíveis em PT-BR (ex.: `Fechar`, nunca `Close`).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Probe **não commitado** (`src/routes/_probe.tsx`, apagado ao final) com o componente em todas as variantes; capturas em 1440×900 e 414×896 comparadas com `docs/design/telas/`.
- Tab, `hover`, `disabled` e `aria-invalid` (quando existirem).

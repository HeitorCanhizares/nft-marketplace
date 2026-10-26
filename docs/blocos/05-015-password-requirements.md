# 05-015 — PasswordRequirements

**Status:** pendente
**Fluxo / subitem:** Cadastro › 2 (requisitos da senha visíveis)
**Depende de:** 05-001
**Depende de decisão:** pergunta 18 do relatório da fase 05 (componente não desenhado)

## Objetivo
Criar a lista dos requisitos da senha ("8+ caracteres", "letra", "número"), cada item marcado com ícone e texto quando cumprido.

## Arquivos
- criar: `src/components/shared/PasswordRequirements.tsx`

## Referências
- docs/fluxos/cadastro.md (subitem 2: "8+ caracteres · letra · número", item marcado com ícone + texto quando cumprido, lido pelo leitor de tela como parte da descrição do campo, **sem anunciar a cada tecla**)
- docs/qualidade/acessibilidade.md (estado não depende só de cor)
- `src/schemas/auth.ts` (`PASSWORD_RULES`, 05-001), `src/styles/globals.css` (`tan`, `success`)
- **Não desenhado no Figma**: segue o padrão visual dos textos de apoio (12 px).

## Valores propostos (confirmar com o usuário)
Texto em `text-caption` (12 px); item pendente em `tan` com `CircleIcon` de 14 px; item cumprido em `success` com `CheckIcon` de 14 px; itens lado a lado com 16 px de intervalo (`gap-x-4`), quebrando linha se faltar espaço; 8 px de distância do campo de senha (`mt-2`, aplicado por quem usa).

## Instruções
1. Props: `value: string`, `className?`. Sem estado próprio.
2. Raiz `div` (será o `description` do `FormField`, que fornece o id): um `span.sr-only` "A senha deve ter:" seguido de `ul` com um `li` por regra de `PASSWORD_RULES`.
3. Cada `li`: ícone (`aria-hidden`), o `label` da regra e um `span.sr-only` com ", cumprido" ou ", pendente". Cor e ícone mudam conforme `rule.test(value)`.
4. **Sem** `aria-live`: o leitor de tela lê a lista quando o campo recebe foco (pela descrição), não a cada tecla.
5. Fechamento: `npx prettier --write src/components/shared/PasswordRequirements.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/shared/PasswordRequirements.tsx` e `git commit -m "05-015: PasswordRequirements"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; export nomeado `PasswordRequirements`.
- [ ] `''` → 3 pendentes; `Açaí1234` → 3 cumpridos; `senhacurta` → só "letra" cumprido.
- [ ] O estado é legível sem cor (ícone e texto do leitor de tela mudam).
- [ ] Sem cor hexadecimal, `oklch()` ou `rgb()`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Coberto no 05-044 (estados, descrição do campo e ausência de região `aria-live`).

# 10-009 — Página `Wallets`, esqueleto e rota `/perfil/carteiras`

**Status:** concluído
**Fluxo / subitem:** Carteiras › 1 (layout), 7 (voltar ao pagamento, alterações não salvas), 8 (estados)
**Depende de:** 10-003, 10-006, 10-008

## Objetivo
Ligar tudo na rota: cabeçalho por viewport, "Voltar ao pagamento", `UnsavedChangesGuard`, skeleton e `ErrorState`.

## Arquivos
- criar: `src/pages/Wallets/Wallets.tsx`
- criar: `src/pages/Wallets/WalletsSkeleton.tsx`
- alterar: `src/routes/perfil.carteiras.tsx`

## Referências
- Tela: `docs/design/telas/desktop-carteiras.png` (1:1); mobile adaptado do Perfil
- Padrão: `src/pages/Profile/Profile.tsx` e `ProfileSkeleton.tsx` (cabeçalho por viewport, `ErrorState`, margens), `src/routes/perfil.dados.tsx`, `src/routes/entrar.tsx` (`validateSearch`)
- `ProfileLayout` (já aplica a coluna de 310 px + 28 px), `MobileTopBar`, `UnsavedChangesGuard`, `useWallets` (10-003), `useWalletSlotForm` (10-005), `PrimaryWalletSection` (10-006), `SecondaryWalletSection` (10-008), `parseRedirect` (`src/lib/redirect.ts`)

## Instruções
1. **Rota** `perfil.carteiras.tsx`: manter `staticData: { title: 'Carteiras' }`; `validateSearch: (search) => ({ redirect: search.redirect === '/pagamento' ? '/pagamento' : undefined })` (só aceita voltar ao Pagamento; qualquer outro valor é ignorado); `component: Wallets`. Remover o comentário de placeholder.
2. **`Wallets.tsx`**: `Route.useSearch()` para `redirect` (importar `Route` de forma que evite import circular; se necessário, receber `redirect` por prop da rota). `useWallets()`.
   - **`PageHeader` local:** desktop → `<h1 className="sr-only">Carteiras</h1>` (o Figma não mostra título de página); mobile → `<MobileTopBar title="Carteiras" backTo={{ to: '/perfil' }} />`.
   - **"Voltar ao pagamento"** (só com `redirect === '/pagamento'`): link `← Voltar ao pagamento` para `/pagamento`, acima do primeiro bloco no desktop (no mobile, a `MobileTopBar` usa `backTo={{ to: '/pagamento' }}`). **Depois de salvar** (principal ou secundária, `onSaved`), navega para `/pagamento` (`replace`). O rascunho do Pagamento é da fase 11.
   - Carregando → `WalletsSkeleton`. Erro → `ErrorState` com "Tentar novamente" (`refetch`), `as="h2"`.
   - Sucesso: cria `const primaryForm = useWalletSlotForm('primary', data.primary, { onSaved })` e `const secondaryForm = useWalletSlotForm('secondary', data.secondary, { onSaved })` (os hooks ficam num componente interno `WalletsContent` que só monta com os dados, para não chamar hooks condicionalmente), `anyDirty = primaryForm.isDirty || secondaryForm.isDirty`. Renderiza `PrimaryWalletSection` e `SecondaryWalletSection` (passando `primary={data.primary}` e `anyDirty`).
   - `<UnsavedChangesGuard when={anyDirty && !primaryForm.isSaving && !secondaryForm.isSaving} />`; não bloqueia a navegação para `/pagamento` feita depois de salvar (o `isDirty` já voltou a falso).
   - Mobile: margens de **28 px** (`px-7 lg:px-0`), 32 px de espaço inferior, **32 px** entre os dois blocos; desktop: **≈ 35 px** entre o botão "Salvar carteira" e o título da secundária (medida do 10-008). A `MobileTabBar` não aparece (a rota não define `mobileTabBar`).
3. **`WalletsSkeleton.tsx`**: espelha o desktop (`lg:grid-cols-2`, 417 px por coluna, 28 px de espaço, campos de 40 px, passo de 89 px; título, texto de apoio e botão 131 × 40 px) e o mobile (uma coluna, campos de 50 px) para os **dois** blocos. `role="status"`, `aria-busy`, texto só para leitor de tela "Carregando carteiras…". Reutilizar `FormSkeleton` se as medidas baterem; senão, `Skeleton`.
4. Fechamento: prettier nos 3; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `10-009: página de carteiras e rota`.

## Critérios de aceite
- [ ] Desktop: menu lateral com "Carteiras" ativo + dois blocos na coluna de 862 px, como no Figma. Mobile: barra superior com voltar para `/perfil`, uma coluna.
- [ ] Com `?redirect=/pagamento`: "Voltar ao pagamento" aparece e salvar leva ao Pagamento; sem o parâmetro, nada disso.
- [ ] Sair com alterações abre "Descartar alterações?"; salvar, remover e trocar não bloqueiam.
- [ ] Skeleton sem salto de layout; erro mostra "Tentar novamente" e funciona.
- [ ] Um único `h1` por viewport; título do documento "Carteiras | Kurio".
- [ ] Sem `ref` lido no render; sem cor hexadecimal fora dos tokens.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Visual no 10-010 / 10-011.

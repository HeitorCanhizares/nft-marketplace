# 10-004 — `WalletForm` (compartilhado com o Pagamento)

**Status:** pendente
**Fluxo / subitem:** Carteiras › 2, 3, 6
**Depende de:** 10-001

## Objetivo
Os 10 campos do formulário de carteira, na grade do Figma, **sem botão e sem envio**, para o dono do formulário (Carteiras agora, Pagamento na fase 11) cuidar do `useForm`, do botão e das mensagens.

## Arquivos
- criar: `src/components/shared/WalletForm.tsx`

## Referências
- Tela: `docs/design/telas/desktop-carteiras.png` (1:1, 1440 px) e `desktop-pagamento.png` (mesmo formulário; a posição 2 muda: "Nome de usuário"); mobile adaptado do Perfil mobile (fase 09)
- Padrão (copiar a estrutura e as classes): `src/pages/Profile/ProfileDataSection.tsx`, `FormField` com `plain`, `EnsInput`, `AUTH_INPUT_CLASS`, `Select`/`SelectItem` (`src/components/ui/select.tsx`)
- `NETWORK_OPTIONS`, `PROVIDER_OPTIONS`, `walletsFormSchema`, `checkoutWalletFormSchema` (10-001)

## Medidas do Figma (desktop)
- Coluna do formulário: **862 px** (x 458–1320), duas colunas de **417 px** com **28 px** de espaço (`gap-x-7`).
- **Passo entre linhas: 89 px** (topo de um campo ao topo do seguinte: campos em 197, 286, 375, 464, 553). Campos de **40 px** de altura. Entre linhas **34 px** (`gap-y-[34px]`); rótulo a **15 px** do campo (`gap-[15px]`), rótulos regulares de 15 px com asterisco `plain`, como no Perfil.
- Ordem (linha a linha): Nome de exibição* | Apelido da carteira* · Rede* | Nome do perfil* · Endereço da carteira* | (sem rótulo) ENS ou carteira secundária (opcional) · Tipo de carteira* | Código de indicação* · E-mail* | Nome ENS* (`EnsInput`, seletor `.eth` de 78 px + campo).
- Placeholders: "Selecione uma rede", "Endereço 0x da carteira", "Selecione uma carteira", "ENS ou carteira secundária (opcional)". Campo sem rótulo visível alinhado pelo **fundo** da linha (`self-end`), com o mesmo topo do vizinho (y 375).
- Mobile (adaptado): uma coluna, `gap-4`, rótulos visíveis com `gap-2`, campos de **50 px** `rounded-3xl` (`AUTH_INPUT_CLASS`), seletores iguais.

## Instruções
1. Props: tipo discriminado `{ variant: 'wallets'; form: UseFormReturn<WalletsFormValues> } | { variant: 'checkout'; form: UseFormReturn<CheckoutWalletFormValues> }` (sem `any`; internamente, os campos comuns são lidos de `form` por nome). Mais: `serverErrors: Partial<Record<WalletFieldKey, string>>` (erros devolvidos pela API, **fora do react-hook-form**, como no `ProfileDataSection`), `disabled?: boolean`, `className?: string`. `WalletFieldKey` = `displayName | nickname | username | profileName | network | address | secondaryAddressOrEns | provider | referralCode | email | ensLabel`.
2. Renderiza um `<div className="grid gap-x-7 gap-y-[34px] max-lg:gap-4 lg:grid-cols-2">` com os campos na ordem acima; a posição 2 mostra `nickname` ("Apelido da carteira", `autoComplete="off"`) em `variant="wallets"` e `username` ("Nome de usuário", `autoComplete="username"`) em `checkout`. Cada campo: `FormField` com `plain`, `className="gap-[15px] max-lg:gap-2"`, `error={errors.x?.message ?? serverErrors.x}`.
3. **Rede** e **Tipo de carteira**: `Controller` + `Select` (valor `''` mostra o placeholder); `SelectTrigger` com `id`/`aria-*` do `FormField`, mesma altura e `AUTH_INPUT_CLASS` dos inputs; itens vindos de `NETWORK_OPTIONS`/`PROVIDER_OPTIONS`. Uma mudança de valor marca o campo como tocado.
4. **ENS ou carteira secundária**: `FormField` com `hideLabel` e `label="ENS ou carteira secundária"` (nome acessível), `Input` com o placeholder; `autoCapitalize="none"`, `spellCheck={false}`.
5. **Nome ENS**: `Controller` + `EnsInput` como no `ProfileDataSection`.
6. **Endereço**: `autoComplete="off"`, `spellCheck={false}`, `autoCapitalize="none"`, `inputMode="text"`; o erro de formato aparece ao sair do campo.
7. O componente **não** chama `handleSubmit`, **não** renderiza botão e **não** lê `ref` no render. Foco no primeiro campo é feito pelo dono com `form.setFocus('displayName')`.
8. Fechamento: prettier; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `10-004: WalletForm compartilhado`.

## Critérios de aceite
- [ ] Desktop: passo de 89 px, campos de 40 px, duas colunas de 417 px, ordem e rótulos do Figma; mobile: uma coluna, campos de 50 px.
- [ ] Obrigatórios com asterisco; "ENS ou carteira secundária" tem nome acessível mesmo sem rótulo visível.
- [ ] Erros do servidor aparecem no campo certo e somem ao editar (responsabilidade do dono; o componente só exibe).
- [ ] Serve às duas variantes sem duplicar campos; sem cor hexadecimal fora dos tokens; sem `any`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Visual no 10-010 / 10-011.

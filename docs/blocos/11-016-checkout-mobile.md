# 11-016 — Tela mobile do Pagamento e esqueleto

**Status:** pendente
**Fluxo / subitem:** Pagamento › 4, 5, 6
**Depende de:** 11-005, 11-007, 11-009, 11-010, 11-014
**Toca:** `src/pages/Checkout/SavedWalletsSection.tsx` (novo), `src/pages/Checkout/CheckoutMobile.tsx` (novo), `src/pages/Checkout/CheckoutSkeleton.tsx` (novo)
**Paralelo:** pode rodar com 11-012, 11-013 e 11-015 (arquivos distintos; depende só dos **tipos** do 11-014).
**Lote:** K

## Objetivo
A tela mobile do Figma: "Carteira conectada" com as carteiras salvas, "Trocar carteira", "Carteira e rede", total e "Confirmar compra" (**sem formulário do colecionador**), mais o esqueleto das duas telas.

## Arquivos
- criar: `src/pages/Checkout/SavedWalletsSection.tsx`
- criar: `src/pages/Checkout/CheckoutMobile.tsx`
- criar: `src/pages/Checkout/CheckoutSkeleton.tsx`

## Referências
- docs/fluxos/pagamento.md subitens 4, 5 e 6; tela `docs/design/telas/mobile-pagamento.png` (1:1, 414 px; **medir com recorte**)
- `CheckoutViewProps` (11-014), `SavedWalletOption`, `WalletProviderOption` (11-009), `WalletConnectionStatus` (11-010), `MobileTopBar` (`backTo`), `EmptyState`, `src/pages/Wallets/WalletsSkeleton.tsx` (padrão de esqueleto), `src/lib/formatEth.ts`

## Medidas do Figma (mobile, 414 × 896 px; margem lateral de **28 px**, conteúdo de 358 px)
- Barra superior: voltar (36 px, x 28) e o título "Pagamento com carteira" (`MobileTopBar`, título em y 49), com voltar para `/carrinho`.
- "Carteira conectada" (`h2`, negrito ≈ 17 px, centro y 100) à esquerda e **"Trocar carteira"** (texto `primary`, ≈ 14 px, negrito) à direita (alinhado à margem direita).
- Cartões das carteiras salvas de **358 × 93 px** em y 124 e 237 (espaço de **20 px**), fundo `card`, raio do card mobile (`rounded-card`).
- "Carteira e rede" (`h2`, negrito, centro y 352). Cartões de provedor de **358 × 65 px** em y 378, 459 e 540 (espaço de 16 px).
- Linha "Total:" (rótulo em negrito `foreground`, valor `price` em negrito, **alinhados à direita**, centro y 629), logo abaixo dos provedores (≈ 24 px).
- Botão "Confirmar compra": **358 × 60 px**, y 804–864, pílula com gradiente (`variant="gradient"`), texto `primary-foreground` em negrito; **fixo na base da página** (margem inferior 32 px), empurrado por `mt-auto` em coluna de altura mínima da tela.

## Instruções
1. `SavedWalletsSection({ form, primaryWallet, secondaryWallet, onEditWallet })`: recebe o `CheckoutFormApi` e as duas carteiras (`Wallet | null`). `RadioGroup` (`value={form.mode}` limitado a `primary`/`secondary`, `onValueChange` → `form.setMode`) com um `SavedWalletOption` por carteira cadastrada, **secundária primeiro** (como no Figma: Reserva, depois Principal). `onEditWallet` vem do menu "⋮". Sem nenhuma carteira: `EmptyState` "Cadastre uma carteira para continuar" com link "Adicionar carteira" para `/perfil/carteiras` com `search={{ redirect: '/pagamento' }}` (o `validateSearch` daquela rota exige a chave sempre presente: passar o objeto completo).
2. `CheckoutMobile(props: CheckoutViewProps & { primaryWallet: Wallet | null; secondaryWallet: Wallet | null })`: `MobileTopBar title="Pagamento com carteira" backTo={{ to: '/carrinho' }}`; título "Carteira conectada" + botão de texto **"Trocar carteira"** (`wallet.changeWallet`; some se não há provedor escolhido; `min-h-11`); `SavedWalletsSection`; "Carteira e rede" com `RadioGroup` dos três `WalletProviderOption variant="mobile"` (mesmo ligamento do desktop: `wallet.provider`/`wallet.choose`); `WalletConnectionStatus` abaixo; linha "Total:" com `formatEth(quote.quote.total)` (esqueleto curto enquanto não há cotação); botão "Confirmar compra" (`variant="gradient"`, `rounded-full`, mesma trava de clique repetido, `aria-busy`, `aria-describedby` na mensagem `confirm.message` em `role="alert"`; **`disabled` só quando não há nenhuma carteira cadastrada**, com `aria-describedby` no texto do estado vazio). `h1` `sr-only` "Pagamento". **Sem** cupom, valores detalhados nem itens (o Figma mobile só mostra o total).
3. `CheckoutSkeleton({ variant }: { variant: 'desktop' | 'mobile' })`: `role="status"` `aria-busy`, texto `sr-only` "Carregando pagamento…"; desktop: coluna do formulário (10 campos de 40 px na grade 369/370 px, passo 81 px) e coluna direita de 405 px; mobile: dois cartões de 93 px, três de 65 px e o botão de 60 px.
4. Só tokens de cor; `cn`; sem `ref` no render; sem hexadecimal.
5. Fechamento: prettier nos 3; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0 (se falhar por arquivo de **outro** agente, esperar e repetir). Commit só dos 3: `git commit -m "11-016: tela mobile do pagamento" -- <arquivos>`.

## Critérios de aceite
- [ ] A 414 px: margem de 28 px, cartões de carteira de 358 × 93 px, provedores de 358 × 65 px, botão de 358 × 60 px (DOM e recorte).
- [ ] Escolher a carteira salva troca `form.mode`; "Trocar carteira" desconecta e limpa o provedor; "⋮" → "Editar carteira" chama `onEditWallet`.
- [ ] Sem carteira cadastrada: estado vazio com o link e o botão "Confirmar compra" fica desabilitado e descrito pelo texto do estado vazio.
- [ ] Sem rolagem horizontal a 320 px. Sem cor hexadecimal fora dos tokens; sem `any`, `as` ou `@ts-ignore`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Visual no 11-019.

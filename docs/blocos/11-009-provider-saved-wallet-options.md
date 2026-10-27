# 11-009 — `WalletProviderOption`, `SavedWalletOption` e cupom recolhido

**Status:** pendente
**Fluxo / subitem:** Pagamento › 4, 5, 6
**Depende de:** —
**Toca:** `src/components/shared/WalletProviderOption.tsx` (novo), `src/components/shared/SavedWalletOption.tsx` (novo), `src/components/shared/CouponField.tsx` (alterar)
**Paralelo:** pode rodar com 11-001, 11-004, 11-011. Os blocos 11-015 e 11-016 esperam este. **Atenção:** `CouponField.tsx` é usado pelo carrinho (`CartSummaryPanel`); o comportamento atual não pode mudar.
**Lote:** C

## Objetivo
Os dois cartões de rádio do Pagamento e o estado "recolhido" do campo de cupom (desktop do Pagamento).

## Arquivos
- criar: `src/components/shared/WalletProviderOption.tsx`
- criar: `src/components/shared/SavedWalletOption.tsx`
- alterar: `src/components/shared/CouponField.tsx` (prop opcional nova)

## Referências
- docs/design/componentes.md (`WalletProviderOption`, `SavedWalletOption`, `CouponField`)
- Telas: `docs/design/telas/desktop-pagamento.png` e `mobile-pagamento.png` (1:1; **medir com recorte**, não a olho)
- `src/components/ui/radio-group.tsx` (`RadioGroupItem`), `src/components/ui/dropdown-menu.tsx`, `src/lib/walletOptions.ts` (`PROVIDER_OPTIONS`, `providerLabel`, `networkLabel`), `src/lib/address.ts` (`shortAddress`), `src/types/user.ts` (`Wallet`)

## Medidas do Figma
- **Provedor, desktop** (coluna de 405 px, x 915–1320): cartão de **405 × 45 px**, borda 1 px (`border`), raio pequeno, passo entre cartões **61 px** (espaço de 16 px; y 691, 752, 813). Rádio de **16 px** a 12 px da esquerda; texto ("MetaMask", "Coinbase Wallet") começa a **38 px** da esquerda. Selecionado: borda clara (`foreground`) e rádio com ponto `primary`. Sem ícone.
- **Provedor, mobile** (coluna de 358 px, x 28–386): cartão **358 × 65 px**, fundo `card`, sem borda visível, passo **81 px** (espaço de 16 px; y 378, 459, 540); círculo de **40 px** a 14 px da esquerda com a inicial ("W" WalletConnect, "M" MetaMask, ícone `WalletIcon` do lucide no Coinbase), texto a 65 px da esquerda, rádio de **16 px** à direita a 16 px da borda.
- **Carteira salva, mobile:** cartão **358 × 93 px**, fundo `card`, passo **113 px** (espaço de 20 px; y 124 e 237); rádio de 16 px à esquerda (x 47); título em negrito (x 82), linha do endereço e linha da rede abaixo (passo ≈ 22 px); menu "⋮" à direita (x ≈ 365).
- **Cupom recolhido, desktop:** texto "Tem um código promocional? Aplique aqui", centralizado na coluna de 405 px, y 471, mesmo tamanho dos rótulos (≈ 14 px).

## Instruções
1. `WalletProviderOption({ value: WalletProvider, variant: 'desktop' | 'mobile', disabled?: boolean, className?: string })`: deve ficar **dentro de um `RadioGroup`** (o grupo é da página). Estrutura: `<label htmlFor={id}>` envolvendo o texto e o `RadioGroupItem id={id} value={value}`; borda/estado de seleção com `has-data-[state=checked]:…` (Radix, não classe condicional por prop). Nome acessível = `providerLabel(value)`; foco visível; alvo de toque ≥ 44 px no mobile (o cartão inteiro clica).
2. `SavedWalletOption({ value: 'primary' | 'secondary', wallet: Wallet, onEdit: () => void, disabled?: boolean })` (só mobile): cartão `div` com o `RadioGroupItem` (`aria-labelledby` no título, `aria-describedby` nas linhas de apoio), título = `wallet.nickname` ou, se vazio, "Principal" / "Secundária"; linha 2 = `shortAddress(wallet.address)`; linha 3 = "Rede principal {rede}" para `primary` e "Rede {rede}" para `secondary`. O texto é um `<label>` ligado ao rádio; o **menu "⋮" é irmão do label**, nunca filho (botão dentro de label é erro de acessibilidade): `DropdownMenu` com botão `aria-label="Opções da carteira {título}"` e um item "Editar carteira" que chama `onEdit`.
3. `CouponField`: prop nova opcional `collapsible?: boolean` (padrão `false`). Com `collapsible` e **sem** cupom guardado, começa recolhido: um botão de texto "Tem um código promocional? Aplique aqui" com `aria-expanded` e `aria-controls`; ao ativar, mostra o formulário atual e leva o foco ao campo (efeito, não ref no render). Com cupom guardado (aplicado ou expirado) mostra sempre a visão de cupom existente. Sem `collapsible` nada muda.
4. Só tokens de cor (`bg-card`, `border-border`, `text-primary`…); `cn`; sem hexadecimal.
5. Fechamento: prettier nos 3; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0 (se falhar por arquivo de **outro** agente, esperar e repetir). Commit só dos 3: `git commit -m "11-009: opções de carteira e cupom recolhido" -- <arquivos>`.

## Critérios de aceite
- [ ] Medidas acima conferidas com recorte das capturas (desktop 405 × 45, mobile 358 × 65 e 358 × 93).
- [ ] Teclado: setas movem a seleção do grupo; Enter/Espaço no "⋮" abre o menu; o foco volta ao "⋮" ao fechar.
- [ ] `CartSummaryPanel` continua igual (cupom do carrinho não recolhe).
- [ ] Sem cor hexadecimal fora dos tokens; sem `any`, `as` ou `@ts-ignore`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Visual: uma captura lado a lado no 11-019.

# 07-008 — `ShareLinks`, `NftMeta` e `FavoriteButton` com texto

**Status:** pendente
**Fluxo / subitem:** Detalhes › 2, 5, 9 (metadados, favoritar, compartilhar)
**Depende de:** 06-068

## Objetivo
Dois componentes novos e a variante com texto do botão de favorito.

## Arquivos
- criar: `src/components/shared/ShareLinks.tsx`
- criar: `src/components/shared/NftMeta.tsx`
- alterar: `src/components/shared/FavoriteButton.tsx`

## Referências
- docs/fluxos/detalhes-nft.md (subitens 2, 5, 9); docs/design/componentes.md; tela desktop de detalhes
- `src/assets/icons/linkedin.svg`, `twitter.svg`, `SvgIcon.tsx`; `MailIcon` do lucide

## Instruções
1. `ShareLinks({ url, title })`: "Compartilhar este NFT:" + 3 links (só ícone, `aria-label`): LinkedIn `https://www.linkedin.com/sharing/share-offsite/?url=<url>`; Twitter `https://twitter.com/intent/tweet?url=<url>&text=<title>`; e-mail `mailto:?subject=<title>&body=<url>`. Valores com `encodeURIComponent`. LinkedIn e Twitter: `target="_blank"` `rel="noopener noreferrer"` e `aria-label` terminando em "(abre em nova aba)". **Só a URL pública do NFT** vai no link. Quem usa passa `url = window.location.origin + /nft/<id>`.
2. `NftMeta({ tokenId, collection, attributes })`: três linhas "ID do token: #0042", "Coleção: Kurio Apes", "Atributos: Óculos, Esmeralda, Raro" (`attributes.join(', ')`), em lista de definição (`dl`), cores do Figma.
3. `FavoriteButton`: nova `variant 'text'`: botão com borda, ícone de coração e o texto visível "Favoritar" (largura automática, altura como o COMPRAR). Mantém `aria-label` `Favoritar <label>`, `aria-pressed`, `aria-busy` e a trava `busy`. As variantes `circle` e `square` não mudam.
4. Fechamento: prettier nos 3; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `07-008: compartilhar, metadados e favorito com texto`.

## Critérios de aceite
- [ ] Sem `any`; links reais com os `href` acima; e-mail sem `target`.
- [ ] Acessibilidade: texto visível "Favoritar" contido no nome acessível; ícones decorativos `aria-hidden`.
- [ ] Sem cor hexadecimal fora dos tokens.

## Verificação (Sonnet)
- format:check, lint, typecheck, build; `npm run test:e2e -- home` ainda verde (o `FavoriteButton` é usado nos cards).

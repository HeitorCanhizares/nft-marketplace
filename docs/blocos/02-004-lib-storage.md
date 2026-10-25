# 02-004 — Utilitário de storage seguro

**Status:** pendente
**Fluxo / subitem:** Fase 02 › lib
**Depende de:** Fase 01

## Objetivo
Centralizar o acesso a localStorage e sessionStorage com `try/catch` e fallback em memória.

## Arquivos
- criar: `src/lib/storage.ts`

## Referências
- docs/api-mock/persistencia.md#regras e #localstorage
- docs/arquitetura/pastas.md (`lib/storage`)

## Instruções
1. Exportar `storage.local` e `storage.session`, cada um com `get(key)`, `set(key, value)` e `remove(key)` (valores `string`) e `getJson<T>(key)` / `setJson(key, value)`.
2. Todo acesso dentro de `try/catch`. Se o storage lançar (navegação privada, bloqueado), usar um `Map` em memória e continuar sem erro.
3. Exportar `STORAGE_KEYS` com as chaves de persistencia.md: `kurio:session`, `kurio:guest-cart-id`, `kurio:mock:scenarios`, `kurio:checkout`, `kurio:checkout-draft`.
4. Sem dependências e sem referência a React.
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/lib/storage.ts` e `git commit -m "02-004: utilitário de storage"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Nenhum acesso direto a `localStorage`/`sessionStorage` fora deste arquivo (os blocos seguintes importam daqui).
- [ ] Com storage lançando erro, nada quebra.
- [ ] Sem `any`, sem `@ts-ignore`; tipos exportados com nome.
- [ ] `src/mocks/**` não importa nada do app além de `src/types`, `src/schemas` e `src/lib` (regra de camadas de pastas.md).
- [ ] Comentários só onde o porquê não é óbvio.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Teste no navegador (Sonnet, via `page.evaluate` em string): trocar `Storage.prototype.setItem` por uma função que lança e confirmar que `storage.local.set` não propaga o erro (verificado indiretamente no 02-022).

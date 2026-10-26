# 05-026 — Ação pendente (guardar antes do login, executar depois)

**Status:** concluído
**Fluxo / subitem:** Login › 4 (ação pendente é concluída após o login e anunciada)
**Depende de:** 03-004
**Depende de decisão:** pergunta 11 do relatório da fase 05 (chave, formato e registro de executores)

## Objetivo
Criar o mecanismo que guarda a ação que o visitante tentou fazer (favoritar, adicionar ao carrinho), leva-o ao login e a executa depois. Quem **grava** a ação (cartão da Início, Detalhes) e quem **a executa de fato** (mutations de favorito e de carrinho) entram nas fases 06 e 07; aqui fica o mecanismo e o registro de executores.

## Arquivos
- criar: `src/lib/pendingAction.ts`
- alterar: `src/lib/storage.ts` (nova chave `pendingAction: 'kurio:pending-action'` em `STORAGE_KEYS`)

## Referências
- docs/fluxos/login.md (subitem 4) e docs/api-mock/contratos.md (Favoritos: "Visitante que clica em favoritar é levado ao login com `redirect` e, ao voltar, a ação é concluída")
- docs/api-mock/persistencia.md (sessionStorage: `kurio:checkout`, `kurio:checkout-draft`; a chave nova entra aqui e o Opus a documenta)
- `src/lib/storage.ts` (`storage.session`), `src/app/clearPrivateSession.ts` (**não** limpa a ação pendente: ela nasce **antes** do login e não pode sumir quando o login troca de usuário)

## Instruções
1. Tipo (validado com zod ao ler): `PendingAction = { type: 'favorite'; nftId: string } | { type: 'add-to-cart'; nftId: string; editionId: string; quantity: number }`. Guardado em `sessionStorage` como `{ action, createdAt }` (ISO).
2. `savePendingAction(action: PendingAction): void` (substitui a anterior). `readPendingAction(): PendingAction | null` (JSON ou formato inválido → `null`; **mais velha que 10 minutos** → apaga e `null`). `clearPendingAction(): void`.
3. Registro de executores: `registerPendingExecutor<T extends PendingAction['type']>(type: T, executor: (action: Extract<PendingAction, { type: T }>) => Promise<string>): () => void` — o executor faz a mutation e **devolve a mensagem** a anunciar; devolve a função que desfaz o registro. Um tipo sem executor registrado não executa nada (a fase 05 não registra nenhum).
4. `runPendingAction(): Promise<{ ok: true; message: string } | { ok: false; message: string } | null>`: lê a ação; **apaga antes de executar** (não roda duas vezes); sem ação ou sem executor → `null`; executor que resolve → `{ ok: true, message }`; que rejeita → `{ ok: false, message: 'Não foi possível concluir a ação que você pediu. Tente de novo.' }`.
5. Sem React e sem importar de `services/api` ou `mocks`.
6. Fechamento: `npx prettier --write` nos 2 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/lib/pendingAction.ts src/lib/storage.ts` e `git commit -m "05-026: ação pendente"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; `STORAGE_KEYS` mantém as chaves anteriores.
- [ ] Guardar, ler e apagar funcionam; formato inválido e ação com mais de 10 minutos viram `null`.
- [ ] `runPendingAction` roda o executor **uma vez** mesmo se chamada duas vezes seguidas; falha do executor não lança.
- [ ] `clearPrivateSession` **não** foi alterada.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Coberto no 05-045 (executor registrado pela ponte de teste, ampliada no 05-042).

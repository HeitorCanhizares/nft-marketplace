# 00-015 — Arquivos .env

**Status:** pendente
**Fluxo / subitem:** Fase 00 › `.env`, `.env.development`, `.env.test`
**Depende de:** 00-014

## Objetivo
Criar os três arquivos de ambiente com as variáveis do mock definidas em `cenarios.md`.

## Arquivos
- criar: `.env`, `.env.development`, `.env.test`

## Referências
- docs/api-mock/cenarios.md#variáveis-de-ambiente
- docs/qualidade/testes.md#configuração (servidor de teste)
- Decisão A6 (override pelo localStorage; implementado na fase 02)

## Instruções
O Vite carrega `.env` e depois o `.env.<modo>`: o arquivo do modo só sobrescreve. Os três são **versionados** (só variáveis `VITE_` públicas, nenhum segredo).

1. `.env` (padrões da tabela de `cenarios.md`):
   ```
   VITE_API_MOCKING=enabled
   VITE_API_BASE_URL=/api
   VITE_MOCK_LATENCY_MIN_MS=200
   VITE_MOCK_LATENCY_MAX_MS=1200
   VITE_MOCK_ERROR_RATE=0
   VITE_MOCK_NETWORK_ERROR_RATE=0
   VITE_MOCK_SESSION_TTL_SECONDS=1800
   VITE_MOCK_QUOTE_TTL_SECONDS=120
   VITE_MOCK_PAYMENT_DELAY_MS=3000
   VITE_MOCK_PAYMENT_DECLINE_RATE=0
   VITE_MOCK_REALTIME=enabled
   VITE_MOCK_SCENARIOS=
   VITE_MOCK_SEED_RESET=false
   ```
   Com um comentário no topo: o que o arquivo é e que `localStorage['kurio:mock:scenarios']` sobrescreve `VITE_MOCK_SCENARIOS` em dev e teste (A6).
2. `.env.development`: repete só os botões de ajuste do dia a dia (`VITE_MOCK_LATENCY_MIN_MS`, `VITE_MOCK_LATENCY_MAX_MS`, `VITE_MOCK_ERROR_RATE`, `VITE_MOCK_NETWORK_ERROR_RATE`, `VITE_MOCK_SCENARIOS`, `VITE_MOCK_SEED_RESET`) com os valores padrão, e um comentário explicando como forçar erros.
3. `.env.test` (determinístico, `cenarios.md` e `testes.md`):
   - `VITE_MOCK_LATENCY_MIN_MS=50` e `VITE_MOCK_LATENCY_MAX_MS=50` (latência fixa baixa)
   - `VITE_MOCK_ERROR_RATE=0`, `VITE_MOCK_NETWORK_ERROR_RATE=0`, `VITE_MOCK_PAYMENT_DECLINE_RATE=0`
   - `VITE_MOCK_SEED_RESET=true`
   - `VITE_MOCK_SCENARIOS=` (vazio; os testes usam o localStorage)
   - demais variáveis herdam do `.env`.
4. Não criar `.env.production` nem `.env.local`.
5. Commit: `git add .env .env.development .env.test` e `git commit -m "00-015: arquivos .env"`.

## Critérios de aceite
- [ ] As 13 variáveis do `cenarios.md` presentes no `.env`, com os valores padrão da tabela.
- [ ] `.env.test` com todas as taxas aleatórias em `0` e `SEED_RESET=true`.
- [ ] Nenhuma variável fora do prefixo `VITE_`.
- [ ] Os três arquivos entram no Git (não estão no `.gitignore`).

## Verificação (Sonnet)
- Comparar o `.env` linha a linha com a tabela de `cenarios.md`.
- `npm run build:test` → exit 0 (o modo `test` agora carrega o `.env.test`).
- `git ls-files .env .env.development .env.test` lista os três.
- Pontos que o usuário confirma na revisão: latência de teste 50 ms; `VITE_MOCK_PAYMENT_DELAY_MS` e `VITE_MOCK_REALTIME` do `.env.test` herdados do padrão (ver fase 02/12).

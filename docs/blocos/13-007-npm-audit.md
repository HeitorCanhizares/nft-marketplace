# 13-007 — Vulnerabilidades do `npm audit`

**Status:** pendente (aguarda a pergunta Q3)
**Responsável:** Sonnet
**Depende de:** 13-006 (decidir antes se o LHCI fica)
**Toca:** `package.json`, `package-lock.json`
**Paralelo:** não: mexe em dependências, roda sozinho (nenhum Haiku ao mesmo tempo).
**Lote:** D

## Diagnóstico (já feito)
- `npm audit`: 16 (2 baixas, 1 moderada, 13 altas), **todas** na cadeia do `@lhci/cli` (`lighthouse`, `puppeteer-core`, `@puppeteer/browsers`, `proxy-agent`, `basic-ftp`, `tmp`, `uuid`, `zod` aninhado etc.).
- `npm audit --omit=dev`: **0**. Nada do que vai ao navegador é afetado.
- `@lhci/cli` já está na última versão (0.15.1). O `npm audit fix --force` propõe a **0.1.0** (rebaixamento sem sentido): **não usar**.

## Caminhos (ver Q3)
1. **Manter e documentar** (recomendado): ferramenta de desenvolvimento, sem código do app afetado; registrar em `decisoes.md` e usar `npm audit --omit=dev` = 0 como verificação.
2. **`overrides` no `package.json`** para versões corrigidas dos pacotes transitivos. Muda a árvore de dependências; validar que o `lhci` ainda roda.
3. **Remover o `@lhci/cli` do projeto** e rodar com `npx @lhci/cli@0.15.1 autorun`: 0 vulnerabilidades no projeto, mas a versão deixa de ficar fixada no lockfile.

## Instruções
Conforme a resposta: (1) nada no `package.json`; (2) acrescentar `overrides`, `npm install`, `npm audit` e `npm run lhci`; (3) remover o pacote e trocar o script `lhci`.

## Critérios de aceite
- [ ] `npm audit --omit=dev` = 0 e, nos caminhos 2 e 3, `npm audit` sem altas.
- [ ] `npm ci && npm run build` ainda passam.

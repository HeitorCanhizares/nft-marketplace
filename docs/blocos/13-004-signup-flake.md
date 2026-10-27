# 13-004 — Teste instável `signup.spec.ts:214` no mobile

**Status:** concluído
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001
**Toca:** `tests/e2e/signup.spec.ts` (só o teste "2. campo vazio só é validado no envio: o primeiro clique envia e o botão não se move"); se a causa for o app, abre bloco `13-1NN` para o Haiku
**Paralelo:** sim com qualquer bloco que não toque `signup.spec.ts`.
**Lote:** A2

## Objetivo
Descobrir por que o teste falhou uma vez no Cadastro mobile na fase 11 (passou ao rodar de novo) e deixá-lo estável.

## Instruções
1. **Exceção ao modo enxuto** (só para esta investigação): `npm run test:e2e -- signup -g "campo vazio só é validado" --project=mobile --repeat-each=30`. Registrar a taxa de falha e a mensagem.
2. Hipóteses, nesta ordem:
   - o teste lê `boundingBox()` do botão antes de o `scrollIntoView` do foco assentar (a emulação de toque do Pixel 7 rola o campo focado);
   - `page.mouse.down/up` dispara `blur` e o layout muda por outro motivo (a resposta de `POST /auth/availability` chegando depois do blur);
   - o foco inicial muda a altura do formulário (requisitos da senha).
   Esperar um estado estável (duas leituras seguidas iguais, via `expect.poll`) em vez de tempo fixo.
3. Se a causa for o app (o botão realmente se move), **parar** e abrir bloco de correção Haiku em vez de relaxar o teste.
4. Confirmar com `--repeat-each=30` nos projetos `mobile` e `desktop`: 0 falhas.

## Critérios de aceite
- [ ] 30 execuções seguidas sem falha no mobile.
- [ ] A causa fica num comentário curto no próprio teste.

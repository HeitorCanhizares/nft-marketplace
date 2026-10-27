# 10-012 — Casos de borda de carteiras adiados para a fase 13

**Status:** concluído
**Depende de:** 10-011

Testes que **não** são escritos na fase 10 (modo enxuto). O comportamento já está implementado e documentado.

## Validação
- Endereço com 39/41 caracteres, sem `0x`, com caractere não hexadecimal, maiúsculas e minúsculas; "ENS ou carteira secundária" com `0x…` válido, `nome.eth` válido e valor inválido; e-mail inválido; limites de nome de exibição (40), apelido (30), nome do perfil (40), código de indicação (3–20) e ENS (3–63).
- Campo obrigatório vazio só acusa no envio; Rede e Tipo de carteira sem seleção; foco no primeiro campo com erro.

## Erros da API
- `422 VALIDATION_ERROR` com `fields` (`address`, `ensName`, `email` etc.): erros nos campos certos, formulário preservado, erro some ao editar. Rede/timeout/5xx: mensagem no topo do bloco, formulário preservado. `PUT` de uma carteira e erro na outra: independentes.
- `DELETE /wallets/secondary` e `POST /wallets/swap` com `404` (secundária já removida em outra aba): diálogo permanece com erro; tela volta a refletir o servidor.
- Clique repetido em "Salvar carteira", "Remover" e "Tornar principal": uma só requisição.

## Secundária
- "Igual à carteira principal" desabilitado sem principal (motivo visível); copia **uma única vez** (editar a principal depois não muda o formulário da secundária); copiar sobre formulário já editado; secundária sem principal; "Adicionar" com foco; foco em "Adicionar" ao remover.
- "Tornar principal" desabilitado com alterações não salvas em qualquer um dos dois formulários; troca preserva os `id` das carteiras.

## Persistência e Pagamento
- Dados sobrevivem a refresh e a novo login; cada usuário só vê as próprias carteiras; salvar/trocar invalida `wallets` e o Pagamento (fase 11) usa os dados novos; `redirect` diferente de `/pagamento` ignorado.
- Pré-preenchimento do perfil quando não há carteira (inclui perfil sem ENS e sem apelido); mudar o perfil depois não reinicia um formulário em edição.

## Alterações não salvas e sessão
- `beforeunload` com alterações; "Descartar alterações?" ao navegar por link, voltar do navegador e "Sair"; sessão expirada durante a edição vai a `/entrar` sem ficar presa; acesso deslogado vai ao login e volta.

## Estados e acessibilidade
- `500` e erro de rede no carregamento (`ErrorState` com "Tentar novamente"); skeleton com latência alta.
- Teclado: ordem dos campos, Enter envia, seletores Radix, rádio, diálogos; leitor de tela: erros, anúncios "Carteira principal salva", "Carteira secundária salva", "Carteira secundária removida" e "Carteiras trocadas"; overflow em 320 px e zoom 200 %; `prefers-reduced-motion`.
- Redimensionar de mobile para desktop em `/perfil/carteiras` mantém o estado do formulário; título do documento e foco no `h1` ao navegar entre `/perfil` e `/perfil/carteiras`.

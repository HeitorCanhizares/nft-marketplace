# Kurio — Marketplace de NFTs

Documentação de planejamento do frontend. Leia este arquivo antes de qualquer outro.

## Papéis

| Modelo | Papel | O que pode fazer |
|---|---|---|
| **Opus 5.5** | Planeja e documenta | Escreve e atualiza `docs/`. Não implementa código. |
| **Sonnet 5.5** | Quebra e testa | Divide os fluxos em blocos em `docs/blocos/`, escreve e roda os testes, valida a entrega do Haiku. |
| **Haiku 5.5** | Implementa | Implementa **um bloco por vez**, exatamente como o bloco descreve. Não decide arquitetura. |

**Orquestração (desde 2026-10-26):** o usuário conversa **só com o Opus**, na conversa principal. O Opus cria o Sonnet e o Haiku como **subagentes** (ferramenta Agent, `model: sonnet` / `model: haiku`), sem abrir sessões separadas. Perguntas e aprovações que o Sonnet precisar sobem ao usuário pelo Opus. Os papéis não mudam.

## Regras que valem para todos

1. **Arquitetura, pastas, arquivos novos fora do previsto e dependências novas: sempre perguntar ao usuário.** Nada de assumir.
2. Siga o que o usuário mandar. Se algo aqui contradiz um pedido dele, o pedido dele vence, e o documento é atualizado.
3. **Layout restrito ao Figma.** Cada layout (desktop e mobile) é seguido como está, mesmo quando o conteúdo é diferente entre os dois. Veja [design/telas/](design/telas/README.md).
4. **Componentes reutilizáveis.** Nenhum componente visual nasce dentro de uma página. Antes de criar, procure em [design/componentes.md](design/componentes.md).
5. **API simulada de verdade.** Não existe backend. O MSW simula uma API REST completa: latência, erros, conflitos, estado persistido e tempo real. Nada é "só visual".
6. Interface em **PT-BR**, código em **inglês**, URLs em **PT-BR**.

## Índice

| Documento | Conteúdo |
|---|---|
| [decisoes.md](decisoes.md) | Todas as decisões tomadas e as pendências. **Fonte da verdade.** |
| [design/tokens.md](design/tokens.md) | Cores, tipografia, raios, breakpoints |
| [design/componentes.md](design/componentes.md) | Catálogo de componentes reutilizáveis e onde cada um aparece |
| [design/telas/](design/telas/README.md) | Capturas do Figma e notas por tela |
| [arquitetura/pastas.md](arquitetura/pastas.md) | Árvore de pastas aprovada |
| [arquitetura/rotas.md](arquitetura/rotas.md) | Rotas, parâmetros e proteção |
| [arquitetura/estado.md](arquitetura/estado.md) | Estado remoto (Query), estado do cliente (Context), HTTP |
| [api-mock/contratos.md](api-mock/contratos.md) | Endpoints REST: requisição, resposta e erros |
| [api-mock/cenarios.md](api-mock/cenarios.md) | Cenários do MSW e variáveis de ambiente |
| [api-mock/realtime.md](api-mock/realtime.md) | Eventos de tempo real (Socket.IO via MSW) |
| [api-mock/persistencia.md](api-mock/persistencia.md) | O que fica no IndexedDB e no localStorage |
| [fluxos/](fluxos/) | Um documento por fluxo |
| [qualidade/acessibilidade.md](qualidade/acessibilidade.md) | Requisitos de acessibilidade |
| [qualidade/testes.md](qualidade/testes.md) | Estratégia de testes com Playwright |
| [qualidade/lighthouse.md](qualidade/lighthouse.md) | Metas e auditoria Lighthouse |
| [blocos/](blocos/README.md) | Blocos de implementação (escritos pelo Sonnet) |

## Stack

React · TypeScript · Vite · npm · TanStack Router (rotas baseadas em arquivos) · TanStack Query · Axios · REST · Socket.IO · Tailwind CSS · shadcn/ui · react-hook-form + zod · React Context · MSW · Playwright · Lighthouse.

## Figma

- Arquivo: <https://www.figma.com/design/XY718dGs8zdSxmSPFfqEtJ/Frontend-Challenge--Copy-> (página `0:1`).
- O plano Starter tem limite baixo de chamadas no MCP do Figma. **Use as capturas em `design/telas/` como referência principal** e só chame o Figma para algo que a captura não responda (um valor exato, um asset).

# Kurio — Marketplace de NFTs

Documentação do frontend: design, arquitetura, API simulada, fluxos e qualidade.

## Regras do projeto

1. **Layout restrito ao Figma.** Cada layout (desktop e mobile) é seguido como está, mesmo quando o conteúdo é diferente entre os dois. Veja [design/telas/](design/telas/README.md).
2. **Componentes reutilizáveis.** Nenhum componente visual nasce dentro de uma página. Antes de criar, procure em [design/componentes.md](design/componentes.md).
3. **API simulada de verdade.** Não existe backend. O MSW simula uma API REST completa: latência, erros, conflitos, estado persistido e tempo real. Nada é "só visual".
4. Interface em **PT-BR**, código em **inglês**, URLs em **PT-BR**.

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
| [blocos/](blocos/README.md) | Histórico dos blocos de implementação |

## Stack

React · TypeScript · Vite · npm · TanStack Router (rotas baseadas em arquivos) · TanStack Query · Axios · REST · Socket.IO · Tailwind CSS · shadcn/ui · react-hook-form + zod · React Context · MSW · Playwright · Lighthouse.

## Figma

- Arquivo: <https://www.figma.com/design/XY718dGs8zdSxmSPFfqEtJ/Frontend-Challenge--Copy-> (página `0:1`).
- As capturas de cada tela estão em [design/telas/](design/telas/README.md).

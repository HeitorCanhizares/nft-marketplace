# 06-060 — Testes do hero e do destaque

**Status:** concluído
**Responsável:** Sonnet

> **Modo enxuto** (docs/decisoes.md): só o caminho principal. 

## Adiado para a fase 13
- Rotação com `page.clock` (6 s, loop), pausa por mouse, foco e botão "Pausar rotação dos destaques", `prefers-reduced-motion`, setas e swipe, "EXPLORAR" com hash e foco no título, esqueleto com a mesma altura (450/190 px), erro de `GET /home` com "Tentar novamente", `alt` das imagens.

## Escopo enxuto
Coberto em `tests/e2e/home.spec.ts` (06-059 a 06-065 juntos): a Início abre com hero (região "Destaques", um `h2`, botão "EXPLORAR"), destaque (desktop), catálogo, promos e blog.

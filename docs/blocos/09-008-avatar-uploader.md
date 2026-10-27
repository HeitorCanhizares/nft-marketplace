# 09-008 — `AvatarUploader`

**Status:** concluído
**Fluxo / subitem:** Perfil › 4 (avatar)
**Depende de:** 09-005

## Objetivo
Avatar circular com "Alterar" (prévia, "Usar esta foto" envia na hora) e "Remover" (com confirmação).

## Arquivos
- criar: `src/components/shared/AvatarUploader.tsx`

## Referências
- Tela: `docs/design/telas/desktop-perfil.png` (1:1; medidas abaixo)
- docs/fluxos/perfil.md (subitem 4); docs/design/componentes.md (`AvatarUploader`)
- `src/components/ui/avatar.tsx`, `dialog.tsx`, `button.tsx`; `useUploadAvatar` / `useRemoveAvatar` (09-005); `AVATAR_MAX_BYTES`, `AVATAR_MIME_TYPES` (09-001); `useLiveAnnouncer`

## Medidas do Figma (desktop, bloco "Avatar" na coluna direita, 417 px)
- Rótulo "Avatar": texto 15 px, centro a 18 px acima do topo do círculo.
- Círculo: **50 × 50 px**, fundo `card`/marrom escuro com borda fina, ícone de imagem com pessoa (centro, ~22 px, cor `primary`).
- Botão "Alterar": **98 × 40 px**, 24 px à direita do círculo, centrado verticalmente no círculo, texto 14 px bold, `primary`.
- "Remover": texto 14 px regular (`foreground`), 20 px à direita do botão, sem fundo nem borda.
- Mobile (adaptado, sem Figma): mesma linha, círculo 64 px, botões com altura 44 px e `rounded-3xl`; quebra para duas linhas se faltar espaço em 320 px.

## Instruções
1. Props: `{ avatarUrl?: string; name: string; className?: string }`. O componente usa `useUploadAvatar` e `useRemoveAvatar` diretamente.
2. **Estado:** `preview: { file: File; url: string } | null`, `error: string | null`. O `URL.createObjectURL` é criado **no handler** de seleção e revogado num `useEffect` cujo cleanup depende de `preview?.url` (e na desmontagem). Sem `ref` lido no render.
3. **Alterar:** botão com `onClick` que chama `inputRef.current?.click()` (uso de ref só no handler). `<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" tabIndex={-1} aria-hidden>`; ao escolher, valida tipo e tamanho no front: "Use uma imagem PNG, JPG ou WEBP." / "A imagem deve ter até 2 MB." (mostrada abaixo, `role="alert"`, e anunciada `assertive`); limpa o `value` do input para permitir reescolher o mesmo arquivo.
4. **Prévia:** o círculo mostra a imagem; "Alterar" vira **"Usar esta foto"** (carregando enquanto envia; o segundo clique é ignorado) e "Remover" vira **"Cancelar"**. Sucesso fecha a prévia e devolve o foco a "Alterar"; erro de API mantém a prévia e mostra a mensagem do campo `file` (ou "Não foi possível enviar a foto. Tente novamente.").
5. **Remover:** habilitado só com `avatarUrl` (sem foto fica `aria-disabled`, como `Button` já estiliza). Abre `Dialog` "Remover foto?" com "Sua foto de perfil será removida." e botões "Remover" e "Cancelar"; confirmar chama `useRemoveAvatar` (carregando; segundo clique ignorado), fecha e devolve o foco a "Alterar". Erro mostra a mensagem abaixo do bloco.
6. Imagem com `alt="Sua foto de perfil"`; sem foto, fallback com ícone (conferir o ícone do Figma; se não houver equivalente no lucide, usar `ImageIcon` e avisar) e `aria-hidden`.
7. Fechamento: prettier; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `09-008: AvatarUploader`.

## Critérios de aceite
- [ ] Tamanhos do Figma respeitados; foto cortada em círculo (`object-cover`).
- [ ] Nada é enviado antes de "Usar esta foto"; arquivo inválido nunca chega à API.
- [ ] Acessibilidade: botões com nome, foco devolvido, mensagens anunciadas, diálogo com título, `prefers-reduced-motion` respeitado, sem overflow em 320 px.
- [ ] Sem cor hexadecimal fora dos tokens; Radix com `data-[state=…]`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Visual no 09-014.
